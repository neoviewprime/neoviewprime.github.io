import { randomUUID } from "node:crypto";
import { getDbClient } from "../db/connection";
import { fromDbArray, fromDbJson, toDbArray } from "../db/providerUtils";
import { reportEngagementService } from "./reportEngagementService";
import { isApprovalJobTitle, userManagementService } from "./userManagementService";
import { logger } from "../utils/logger";

type CountRow = { count: number };

type CatalogMetricAuditRow = {
  id: string;
  report_name: string;
  metrics_row_id: string | null;
  metric_views: number | null;
  views_count: number | null;
  metric_likes: number | null;
  likes_count: number | null;
  metric_comments: number | null;
  comments_count: number | null;
  metric_shares: number | null;
  shares_count: number | null;
  fact_views: number | null;
  fact_likes: number | null;
  fact_comments: number | null;
  fact_shares: number | null;
};

type ApprovalBackfillRow = {
  id: string;
  report_name: string;
  source_report_id: string;
  path: unknown;
  updated_at: string | null;
  submitted_at: string | null;
  approver_user_id: string | null;
  approver_name: string | null;
  submitted_by: string | null;
  payload: unknown;
};

export type CatalogIntegrityAudit = {
  totals: {
    catalogReports: number;
    metricRows: number;
    submissions: number;
    approvals: number;
  };
  orphanCounts: {
    metricRows: number;
    submissions: number;
    approvals: number;
    events: number;
    comments: number;
    likes: number;
    shares: number;
    shareMonitoringByCatalog: number;
    shareMonitoringByShare: number;
    chunks: number;
  };
  derivedIssues: {
    reportsWithoutMetricsRow: number;
    metricsMismatches: number;
    approvedManualWithoutApprovalRecord: number;
  };
};

export type CatalogIntegrityRepairResult = {
  before: CatalogIntegrityAudit;
  repaired: {
    orphanRowsDeleted: number;
    metricRowsCreated: number;
    metricRowsReconciled: number;
    approvalsBackfilled: number;
    legacyApprovalsMarked: number;
  };
  after: CatalogIntegrityAudit;
};

const countValue = async (sql: string, params?: unknown[]) => {
  const db = await getDbClient();
  const result = await db.query<CountRow>(sql, params);
  return Number(result.rows[0]?.count ?? 0);
};

const nonNegative = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.floor(numeric));
};

export const mergeMetricValue = (...values: unknown[]): number =>
  values.reduce<number>((max, value) => Math.max(max, nonNegative(value)), 0);

const countCatalogMetricMismatches = async () =>
  countValue(
    `SELECT COUNT(*) AS count
     FROM report_catalog rc
     LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
     WHERE rem.id IS NOT NULL
       AND (
         COALESCE(rc.metric_views, 0) <> COALESCE(rem.views_count, 0)
         OR COALESCE(rc.metric_likes, 0) <> COALESCE(rem.likes_count, 0)
         OR COALESCE(rc.metric_comments, 0) <> COALESCE(rem.comments_count, 0)
         OR COALESCE(rc.metric_shares, 0) <> COALESCE(rem.shares_count, 0)
       )`
  );

const buildBackfillApprovalComment =
  "Registro de aprovação reconstruído automaticamente durante o saneamento de integridade do catálogo.";

const LEGACY_APPROVAL_POLICY_ID = "legacy-approval-policy";
const LEGACY_APPROVAL_POLICY_NAME = "Aprovacao legada";
const LEGACY_APPROVAL_POLICY_COMMENT =
  "Aprovacao legada marcada explicitamente por ausencia de trilha confiavel do aprovador original.";

type ApprovalBackfillPolicy =
  | {
      approverId: string;
      approverName: string;
      comment: string;
      policy: "submission_approver";
    }
  | {
      approverId: string;
      approverName: string;
      comment: string;
      policy: "self_approved_submitter";
    }
  | {
      approverId: string;
      approverName: string;
      comment: string;
      policy: "legacy_explicit";
    };

const parseNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const resolveLegacyApprovalPolicy = async (row: ApprovalBackfillRow): Promise<ApprovalBackfillPolicy> => {
  const payload = fromDbJson<Record<string, unknown>>(row.payload, {});

  const payloadApproverId = parseNonEmptyString(payload.approverId);
  const payloadApproverName = parseNonEmptyString(payload.approverName);
  const payloadSubmitterName =
    parseNonEmptyString(payload.submittedByName) ?? parseNonEmptyString(payload.submitterName);

  const approverId = row.approver_user_id ?? payloadApproverId;
  const approverName = row.approver_name ?? payloadApproverName;

  if (approverId && approverName) {
    return {
      approverId,
      approverName,
      comment: `${buildBackfillApprovalComment} Origem: submissao com aprovador associado.`,
      policy: "submission_approver",
    };
  }

  if (row.submitted_by) {
    const submitter = await userManagementService.getUserById(row.submitted_by).catch(() => null);
    if (submitter?.id && isApprovalJobTitle(submitter.job_title)) {
      return {
        approverId: submitter.id,
        approverName: submitter.full_name,
        comment: `${buildBackfillApprovalComment} Origem: remetente com alcada de aprovacao identificado no historico.`,
        policy: "self_approved_submitter",
      };
    }
  }

  const fallbackName = payloadSubmitterName ? `${LEGACY_APPROVAL_POLICY_NAME} (${payloadSubmitterName})` : LEGACY_APPROVAL_POLICY_NAME;
  return {
    approverId: LEGACY_APPROVAL_POLICY_ID,
    approverName: fallbackName,
    comment: `${LEGACY_APPROVAL_POLICY_COMMENT} ${buildBackfillApprovalComment}`,
    policy: "legacy_explicit",
  };
};

export const reportIntegrityService = {
  async auditCatalogIntegrity(): Promise<CatalogIntegrityAudit> {
    const [
      catalogReports,
      metricRows,
      submissions,
      approvals,
      orphanMetricRows,
      orphanSubmissions,
      orphanApprovals,
      orphanEvents,
      orphanComments,
      orphanLikes,
      orphanShares,
      orphanShareMonitoringByCatalog,
      orphanShareMonitoringByShare,
      orphanChunks,
      reportsWithoutMetricsRow,
      metricsMismatches,
      approvedManualWithoutApprovalRecord,
    ] = await Promise.all([
      countValue("SELECT COUNT(*) AS count FROM report_catalog"),
      countValue("SELECT COUNT(*) AS count FROM report_engagement_metrics"),
      countValue("SELECT COUNT(*) AS count FROM report_submissions"),
      countValue("SELECT COUNT(*) AS count FROM report_approvals"),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_engagement_metrics rem
         LEFT JOIN report_catalog rc ON rc.id = rem.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_submissions rs
         LEFT JOIN report_catalog rc ON rc.id = rs.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_approvals ra
         LEFT JOIN report_catalog rc ON rc.id = ra.report_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_engagement_events ree
         LEFT JOIN report_catalog rc ON rc.id = ree.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_comments rcmt
         LEFT JOIN report_catalog rc ON rc.id = rcmt.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_likes rl
         LEFT JOIN report_catalog rc ON rc.id = rl.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_shares rs
         LEFT JOIN report_catalog rc ON rc.id = rs.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_share_monitoring rsm
         LEFT JOIN report_catalog rc ON rc.id = rsm.report_catalog_id
         WHERE rc.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_share_monitoring rsm
         LEFT JOIN report_shares rs ON rs.id = rsm.report_share_id
         WHERE rs.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_chunks rch
         LEFT JOIN reports r ON r.id = rch.report_id
         WHERE r.id IS NULL`
      ),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_catalog rc
         LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
         WHERE rem.id IS NULL`
      ),
      countCatalogMetricMismatches(),
      countValue(
        `SELECT COUNT(*) AS count
         FROM report_catalog rc
         LEFT JOIN report_approvals ra ON ra.report_id = rc.id
         WHERE rc.report_status = 'approved'
           AND rc.source_report_id LIKE 'manual-%'
           AND ra.id IS NULL`
      ),
    ]);

    return {
      totals: {
        catalogReports,
        metricRows,
        submissions,
        approvals,
      },
      orphanCounts: {
        metricRows: orphanMetricRows,
        submissions: orphanSubmissions,
        approvals: orphanApprovals,
        events: orphanEvents,
        comments: orphanComments,
        likes: orphanLikes,
        shares: orphanShares,
        shareMonitoringByCatalog: orphanShareMonitoringByCatalog,
        shareMonitoringByShare: orphanShareMonitoringByShare,
        chunks: orphanChunks,
      },
      derivedIssues: {
        reportsWithoutMetricsRow,
        metricsMismatches,
        approvedManualWithoutApprovalRecord,
      },
    };
  },

  async repairCatalogIntegrity(): Promise<CatalogIntegrityRepairResult> {
    const before = await this.auditCatalogIntegrity();
    const db = await getDbClient();

    let orphanRowsDeleted = 0;
    const cleanupStatements = [
      `DELETE FROM report_share_monitoring WHERE report_share_id IS NOT NULL AND report_share_id NOT IN (SELECT id FROM report_shares)`,
      `DELETE FROM report_share_monitoring WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_shares WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_likes WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_comments WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_engagement_events WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_engagement_metrics WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_submissions WHERE report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_approvals WHERE report_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM report_chunks WHERE report_id NOT IN (SELECT id FROM reports)`,
      `DELETE FROM reports WHERE report_catalog_id IS NOT NULL AND report_catalog_id NOT IN (SELECT id FROM report_catalog)`,
      `DELETE FROM notifications WHERE entity_type = 'report_catalog' AND entity_id IS NOT NULL AND entity_id NOT IN (SELECT id FROM report_catalog)`,
    ];

    for (const statement of cleanupStatements) {
      const result = await db.query(statement);
      orphanRowsDeleted += result.rowCount;
    }

    const metricRows = await db.query<CatalogMetricAuditRow>(
      `SELECT
         rc.id,
         rc.report_name,
         rem.id AS metrics_row_id,
         rc.metric_views,
         rem.views_count,
         rc.metric_likes,
         rem.likes_count,
         rc.metric_comments,
         rem.comments_count,
         rc.metric_shares,
         rem.shares_count,
         COALESCE((
           SELECT COUNT(*)
           FROM report_engagement_events ree
           WHERE ree.report_catalog_id = rc.id AND ree.action = 'view'
         ), 0) AS fact_views,
         COALESCE((
           SELECT COUNT(*)
           FROM report_likes rl
           WHERE rl.report_catalog_id = rc.id
         ), 0) AS fact_likes,
         COALESCE((
           SELECT COUNT(*)
           FROM report_comments rct
           WHERE rct.report_catalog_id = rc.id
         ), 0) AS fact_comments,
         COALESCE((
           SELECT COUNT(*)
           FROM report_shares rs
           WHERE rs.report_catalog_id = rc.id
         ), 0) AS fact_shares
       FROM report_catalog rc
       LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id`
    );

    let metricRowsCreated = 0;
    let metricRowsReconciled = 0;

    for (const row of metricRows.rows) {
      if (!row.metrics_row_id) {
        await reportEngagementService.upsertFromInitial(row.id, {
          views: nonNegative(row.metric_views),
          likes: nonNegative(row.metric_likes),
          comments: nonNegative(row.metric_comments),
          shares: nonNegative(row.metric_shares),
        });
        metricRowsCreated += 1;
      }

      const nextViews = mergeMetricValue(row.metric_views, row.views_count, row.fact_views);
      const nextLikes = mergeMetricValue(row.metric_likes, row.likes_count, row.fact_likes);
      const nextComments = mergeMetricValue(row.metric_comments, row.comments_count, row.fact_comments);
      const nextShares = mergeMetricValue(row.metric_shares, row.shares_count, row.fact_shares);

      const currentCatalog = {
        views: nonNegative(row.metric_views),
        likes: nonNegative(row.metric_likes),
        comments: nonNegative(row.metric_comments),
        shares: nonNegative(row.metric_shares),
      };
      const currentMetrics = {
        views: row.metrics_row_id ? nonNegative(row.views_count) : currentCatalog.views,
        likes: row.metrics_row_id ? nonNegative(row.likes_count) : currentCatalog.likes,
        comments: row.metrics_row_id ? nonNegative(row.comments_count) : currentCatalog.comments,
        shares: row.metrics_row_id ? nonNegative(row.shares_count) : currentCatalog.shares,
      };

      const changed =
        currentCatalog.views !== nextViews ||
        currentCatalog.likes !== nextLikes ||
        currentCatalog.comments !== nextComments ||
        currentCatalog.shares !== nextShares ||
        currentMetrics.views !== nextViews ||
        currentMetrics.likes !== nextLikes ||
        currentMetrics.comments !== nextComments ||
        currentMetrics.shares !== nextShares;

      if (!changed) continue;

      await db.query(
        `UPDATE report_catalog
         SET metric_views = $2,
             metric_likes = $3,
             metric_comments = $4,
             metric_shares = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [row.id, nextViews, nextLikes, nextComments, nextShares]
      );

      await db.query(
        `UPDATE report_engagement_metrics
         SET views_count = $2,
             likes_count = $3,
             comments_count = $4,
             shares_count = $5,
             updated_at = CURRENT_TIMESTAMP
         WHERE report_catalog_id = $1`,
        [row.id, nextViews, nextLikes, nextComments, nextShares]
      );

      metricRowsReconciled += 1;
    }

    const approvalCandidates = await db.query<ApprovalBackfillRow>(
      `SELECT
         rc.id,
         rc.report_name,
         rc.source_report_id,
         rc.path,
         rc.updated_at,
         rs.created_at AS submitted_at,
         rs.approver_user_id,
         rs.approver_name,
         rs.submitted_by,
         rs.payload
       FROM report_catalog rc
       LEFT JOIN report_approvals ra ON ra.report_id = rc.id
       LEFT JOIN (
         SELECT report_catalog_id, MAX(created_at) AS latest_created_at
         FROM report_submissions
         GROUP BY report_catalog_id
       ) latest_rs ON latest_rs.report_catalog_id = rc.id
       LEFT JOIN report_submissions rs
         ON rs.report_catalog_id = rc.id
        AND rs.created_at = latest_rs.latest_created_at
       WHERE rc.report_status = 'approved'
         AND rc.source_report_id LIKE 'manual-%'
         AND ra.id IS NULL`
    );

    let approvalsBackfilled = 0;
    let legacyApprovalsMarked = 0;
    for (const row of approvalCandidates.rows) {
      const payload = fromDbJson<Record<string, unknown>>(row.payload, {});
      const policy = await resolveLegacyApprovalPolicy(row);
      const submitterName = String(payload.submittedByName ?? payload.submitterName ?? "Analista NeoView");
      const approvedAt = row.updated_at ?? row.submitted_at ?? new Date().toISOString();

      await db.query(
        `INSERT INTO report_approvals (
          id,
          report_id,
          approver_id,
          approver_name,
          status,
          comments,
          approved_at,
          report_name,
          destination_path,
          submitter_name,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, 'approved', $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
        [
          randomUUID(),
          row.id,
          policy.approverId,
          policy.approverName,
          policy.comment,
          approvedAt,
          row.report_name,
          toDbArray(db, fromDbArray(row.path)),
          submitterName,
        ]
      );

      approvalsBackfilled += 1;
      if (policy.policy === "legacy_explicit") {
        legacyApprovalsMarked += 1;
      }
    }

    const after = await this.auditCatalogIntegrity();

    const result = {
      before,
      repaired: {
        orphanRowsDeleted,
        metricRowsCreated,
        metricRowsReconciled,
        approvalsBackfilled,
        legacyApprovalsMarked,
      },
      after,
    };

    logger.info("Catalog integrity repair completed", result.repaired);
    return result;
  },
};
