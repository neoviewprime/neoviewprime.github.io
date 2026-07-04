import { randomUUID } from "crypto";
import {
  clearCorporateHierarchyChildren,
  isCentralCorporateApprover,
  isCoelbaCompanyId,
  normalizeCoelbaHierarchy,
} from "../data/coelbaHierarchyRules";
import { getDbClient } from "../db/connection";
import { fromDbArray, fromDbJson, toDbArray } from "../db/providerUtils";
import { reportJsonFileService } from "./reportJsonFileService";
import { isApprovalJobTitle, userManagementService } from "./userManagementService";
import { approvalDelegationService } from "./approvalDelegationService";
import { notificationService } from "./notificationService";
import { utdFlowService } from "./utdFlowService";
import { reportCatalogFileQueryService } from "./reportCatalogFileQueryService";
import { reportCatalogSemanticSyncService } from "./reportCatalogSemanticSyncService";
import { logger } from "../utils/logger";

type ApprovalDecision = "approved" | "rejected";

export type PendingApprovalRow = {
  id: string;
  source_report_id: string;
  report_name: string;
  report_description: string;
  report_date: string | null;
  report_url: string | null;
  report_size_label: string | null;
  company_id: string | null;
  company_name: string;
  superintendence_id: string | null;
  superintendence_name: string;
  management_id: string | null;
  management_name: string;
  project_id: string | null;
  project_name: string;
  indicator_name: string;
  path: unknown;
  created_at: string;
  updated_at: string;
  payload: unknown;
  submitted_by: string | null;
  approver_user_id: string | null;
  approver_name: string | null;
  approver_job_title: string | null;
};

const matchesApprovalScope = (
  approver: Awaited<ReturnType<typeof userManagementService.getUserById>>,
  row: Pick<PendingApprovalRow, "company_id" | "superintendence_id" | "management_id" | "project_id">
) => {
  if (!approver || !isApprovalJobTitle(approver.job_title)) return false;
  if (!approver.company_id || approver.company_id !== row.company_id) return false;
  if (approver.superintendence_id && approver.superintendence_id !== row.superintendence_id) return false;
  if (approver.management_id && approver.management_id !== row.management_id) return false;
  if (approver.project_id && approver.project_id !== row.project_id) return false;
  return true;
};

const normalizePendingRowHierarchy = <
  T extends Pick<
    PendingApprovalRow,
    | "company_id"
    | "company_name"
    | "superintendence_id"
    | "superintendence_name"
    | "management_id"
    | "management_name"
    | "project_id"
    | "project_name"
  >
>(
  row: T
) =>
  clearCorporateHierarchyChildren(
    normalizeCoelbaHierarchy({
      companyId: row.company_id,
      companyName: row.company_name,
      superintendenceId: row.superintendence_id,
      superintendenceName: row.superintendence_name,
      managementId: row.management_id,
      managementName: row.management_name,
      projectId: row.project_id,
      projectName: row.project_name,
    })
  );

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeApproverId = (approverId?: string | null) => {
  if (!approverId) return null;
  const trimmed = approverId.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed : null;
};

const buildApprovalContextForActor = async (
  actorUserId: string | undefined,
  row: Pick<PendingApprovalRow, "company_id" | "superintendence_id" | "management_id" | "project_id" | "approver_user_id">
) => {
  const normalizedActorId = normalizeApproverId(actorUserId);
  if (!normalizedActorId) return null;

  const actor = await userManagementService.getUserById(normalizedActorId);
  if (!actor || actor.status !== "active") return null;

  if (actor.roles?.includes("superadmin")) {
    return {
      actorUserId: actor.id,
      actorName: actor.full_name,
      delegatedBy: null as null | { id: string; name: string }
    };
  }

  if (isCoelbaCompanyId(row.company_id) && isCentralCorporateApprover(actor)) {
    return {
      actorUserId: actor.id,
      actorName: actor.full_name,
      delegatedBy: null as null | { id: string; name: string }
    };
  }

  if (row.approver_user_id && row.approver_user_id === actor.id && matchesApprovalScope(actor, row)) {
    return {
      actorUserId: actor.id,
      actorName: actor.full_name,
      delegatedBy: null as null | { id: string; name: string }
    };
  }

  if (row.approver_user_id) {
    const delegation = await approvalDelegationService.findActiveDelegation(actor.id, row.approver_user_id);
    if (delegation) {
      const delegator = await userManagementService.getUserById(row.approver_user_id);
      if (matchesApprovalScope(delegator, row)) {
        return {
          actorUserId: actor.id,
          actorName: actor.full_name,
          delegatedBy: delegator
            ? {
                id: delegator.id,
                name: delegator.full_name
              }
            : null
        };
      }
    }
  }

  if (matchesApprovalScope(actor, row)) {
    return {
      actorUserId: actor.id,
      actorName: actor.full_name,
      delegatedBy: null as null | { id: string; name: string }
    };
  }

  return null;
};

type CatalogMaterializationRow = {
  id: string;
  source_report_id: string;
  report_name: string;
  report_description: string;
  report_date: string | null;
  report_size_label: string | null;
  report_size_bytes: number | null;
  report_url: string | null;
  company_id: string;
  company_name: string;
  superintendence_id: string;
  superintendence_name: string;
  management_id: string;
  management_name: string;
  project_id: string;
  project_name: string;
  indicator_ids: unknown;
  indicator_names: unknown;
  indicator_value: string | null;
  indicator_unit: string | null;
  indicator_trend: string | null;
  metric_views: number | null;
  metric_comments: number | null;
  metric_likes: number | null;
  metric_shares: number | null;
  path: unknown;
  raw_json: unknown;
};

const parseSubmitter = (payload: unknown): { name: string; email?: string } => {
  const parsed = fromDbJson<Record<string, unknown>>(payload, {});
  const name = String(parsed.submittedByName ?? parsed.submitterName ?? "Analista NeoView");
  const emailRaw = parsed.submittedByEmail;
  return {
    name,
    email: emailRaw ? String(emailRaw) : undefined,
  };
};

const materializeApprovedReport = async (reportCatalogId: string): Promise<void> => {
  const db = await getDbClient();
  const result = await db.query<CatalogMaterializationRow>(
    `SELECT
      id,
      source_report_id,
      report_name,
      report_description,
      report_date,
      report_size_label,
      report_size_bytes,
      report_url,
      company_id,
      company_name,
      superintendence_id,
      superintendence_name,
      management_id,
      management_name,
      project_id,
      project_name,
      indicator_ids,
      indicator_names,
      indicator_value,
      indicator_unit,
      indicator_trend,
      metric_views,
      metric_comments,
      metric_likes,
      metric_shares,
      path,
      raw_json
    FROM report_catalog
    WHERE id = $1
    LIMIT 1`,
    [reportCatalogId]
  );

  const row = result.rows[0];
  if (!row) return;

  const indicatorNames = fromDbArray(row.indicator_names);
  const indicatorIds = fromDbArray(row.indicator_ids);
  const normalizedHierarchy = normalizePendingRowHierarchy({
    company_id: row.company_id,
    company_name: row.company_name,
    superintendence_id: row.superintendence_id,
    superintendence_name: row.superintendence_name,
    management_id: row.management_id,
    management_name: row.management_name,
    project_id: row.project_id,
    project_name: row.project_name,
  });
  const parsedPath = [
    normalizedHierarchy.companyName ?? row.company_name,
    normalizedHierarchy.superintendenceName ?? row.superintendence_name,
    normalizedHierarchy.managementName ?? row.management_name,
    normalizedHierarchy.projectName ?? row.project_name,
    row.report_name,
  ].filter(Boolean);
  const parsedRawJson = fromDbJson<Record<string, unknown>>(row.raw_json, {});

  const fullPath = await reportJsonFileService.writeReportJson({
    sourceReportId: row.source_report_id,
    reportName: row.report_name,
    reportDescription: row.report_description ?? "",
    reportDate: row.report_date,
    reportSizeLabel: row.report_size_label ?? "",
    reportSizeBytes: row.report_size_bytes ?? 0,
    reportUrl: row.report_url ?? null,
    companyId: normalizedHierarchy.companyId ?? row.company_id,
    companyName: normalizedHierarchy.companyName ?? row.company_name,
    superintendenceId: normalizedHierarchy.superintendenceId ?? row.superintendence_id,
    superintendenceName: normalizedHierarchy.superintendenceName ?? row.superintendence_name,
    managementId: normalizedHierarchy.managementId ?? undefined,
    managementName: normalizedHierarchy.managementName ?? undefined,
    projectId: normalizedHierarchy.projectId ?? undefined,
    projectName: normalizedHierarchy.projectName ?? undefined,
    indicators: indicatorNames.map((name, index) => ({
      id: indicatorIds[index] ?? "",
      name,
      value: row.indicator_value ?? "",
      unit: row.indicator_unit ?? "",
      trend: row.indicator_trend ?? "stable",
    })),
    metrics: {
      views: row.metric_views ?? 0,
      comments: row.metric_comments ?? 0,
      likes: row.metric_likes ?? 0,
      shares: row.metric_shares ?? 0,
    },
    path: parsedPath,
    reportStatus: "approved",
    rawJson: parsedRawJson,
  });
  reportCatalogFileQueryService.invalidateCache();
  await reportCatalogSemanticSyncService.syncCatalogDocumentFile({
    fullPath,
    reportCatalogId,
  });
};

export const reportApprovalService = {
  async listPending(input?: { approverId?: string }): Promise<
    Array<{
      id: string;
      source_report_id: string;
      name: string;
      description: string;
      uploaded_at: string;
      indicator_name: string;
      submitter_name: string;
      submitter_email?: string;
      destination_path: string[];
      company_id?: string;
      company_name: string;
      superintendence_id?: string;
      superintendence_name: string;
      management_id?: string;
      management_name: string;
      project_id?: string;
      project_name: string;
      report_url?: string;
      report_size_label?: string;
      approver_id?: string;
      approver_name?: string;
      approver_job_title?: string;
      submitted_by?: string;
      delegated_by_name?: string;
    }>
  > {
    const db = await getDbClient();
    const result = await db.query<PendingApprovalRow>(
      `SELECT
        rc.id,
        rc.source_report_id,
        rc.report_name,
        rc.report_description,
        rc.report_date,
        rc.report_url,
        rc.report_size_label,
        rc.company_id,
        rc.company_name,
        rc.superintendence_id,
        rc.superintendence_name,
        rc.management_id,
        rc.management_name,
        rc.project_id,
        rc.project_name,
        rc.indicator_name,
        rc.path,
        rs.created_at,
        rc.updated_at,
        rs.payload,
        rs.submitted_by,
        rs.approver_user_id,
        rs.approver_name,
        rs.approver_job_title
      FROM report_catalog rc
      LEFT JOIN (
        SELECT report_catalog_id, MAX(created_at) AS latest_created_at
        FROM report_submissions
        GROUP BY report_catalog_id
      ) latest_rs ON latest_rs.report_catalog_id = rc.id
      LEFT JOIN report_submissions rs
        ON rs.report_catalog_id = rc.id
       AND rs.created_at = latest_rs.latest_created_at
      WHERE rc.report_status = $1
      ORDER BY rc.created_at ASC`,
      ["pending_approval"]
    );

    const items = await Promise.all(
      result.rows.map(async (row) => {
        const approvalContext = input?.approverId
          ? await buildApprovalContextForActor(input.approverId, row)
          : null;

        if (input?.approverId && !approvalContext) {
          return null;
        }

        const submitter = parseSubmitter(row.payload);
        const normalizedHierarchy = normalizePendingRowHierarchy(row);
        const destinationPath = [
          normalizedHierarchy.companyName ?? row.company_name,
          normalizedHierarchy.superintendenceName ?? row.superintendence_name,
          normalizedHierarchy.managementName ?? row.management_name,
          normalizedHierarchy.projectName ?? row.project_name,
          row.report_name,
        ].filter(Boolean);
        return {
          id: row.id,
          source_report_id: row.source_report_id,
          name: row.report_name,
          description: row.report_description ?? "",
          uploaded_at: row.created_at,
          indicator_name: row.indicator_name ?? "Indicador não informado",
          submitter_name: submitter.name,
          submitter_email: submitter.email,
          destination_path: destinationPath,
          company_id: normalizedHierarchy.companyId ?? undefined,
          company_name: normalizedHierarchy.companyName ?? row.company_name,
          superintendence_id: normalizedHierarchy.superintendenceId ?? undefined,
          superintendence_name: normalizedHierarchy.superintendenceName ?? row.superintendence_name,
          management_id: normalizedHierarchy.managementId ?? undefined,
          management_name: normalizedHierarchy.managementName ?? row.management_name,
          project_id: normalizedHierarchy.projectId ?? undefined,
          project_name: normalizedHierarchy.projectName ?? row.project_name,
          report_url: row.report_url ?? undefined,
          report_size_label: row.report_size_label ?? undefined,
          approver_id: row.approver_user_id ?? undefined,
          approver_name: row.approver_name ?? undefined,
          approver_job_title: row.approver_job_title ?? undefined,
          submitted_by: row.submitted_by ?? undefined,
          delegated_by_name: approvalContext?.delegatedBy?.name ?? undefined
        };
      })
    );

    return items.filter((item): item is NonNullable<typeof item> => Boolean(item));
  },
  async listHistory(limit = 100, approverId?: string): Promise<
    Array<{
      id: string;
      report_id: string;
      approver_id: string;
      approver_name: string;
      status: ApprovalDecision;
      comments?: string;
      approved_at: string;
      created_at: string;
      updated_at: string;
      report_name: string;
      destination_path: string[];
      submitter_name: string;
    }>
  > {
    const db = await getDbClient();
    const params: unknown[] = [];
    const whereClauses: string[] = [];
    const normalizedApproverId = normalizeApproverId(approverId);

    if (normalizedApproverId) {
      params.push(normalizedApproverId);
      whereClauses.push(`approver_id = $${params.length}`);
    }

    params.push(limit);

    const result = await db.query<{
      id: string;
      report_id: string;
      approver_id: string;
      approver_name: string;
      status: ApprovalDecision;
      comments: string | null;
      approved_at: string;
      created_at: string;
      updated_at: string;
      report_name: string;
      destination_path: unknown;
      submitter_name: string;
    }>(
      `SELECT
        id,
        report_id,
        approver_id,
        approver_name,
        status,
        comments,
        approved_at,
        created_at,
        updated_at,
        report_name,
        destination_path,
        submitter_name
      FROM report_approvals
      ${whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY approved_at DESC, created_at DESC
      LIMIT $${params.length}`,
      params
    );

    return result.rows.map((row) => ({
      ...row,
      comments: row.comments ?? undefined,
      destination_path: fromDbArray(row.destination_path),
    }));
  },

  async getStats(approverId?: string): Promise<{
    pending: number;
    approved_today: number;
    rejected_today: number;
    avg_approval_time_hours: number;
  }> {
    const db = await getDbClient();
    const normalizedApproverId = normalizeApproverId(approverId);
    const pending = normalizedApproverId
      ? { rows: [{ count: (await this.listPending({ approverId: normalizedApproverId })).length }] }
      : await db.query<{ count: number }>(
          `SELECT COUNT(*) AS count FROM report_catalog WHERE report_status = $1`,
          ["pending_approval"]
        );
    const historyParams: unknown[] = [];
    const historyWhereClauses: string[] = [];

    if (normalizedApproverId) {
      historyParams.push(normalizedApproverId);
      historyWhereClauses.push(`approver_id = $${historyParams.length}`);
    }

    const history = await db.query<{
      status: string;
      created_at: string;
      approved_at: string | null;
    }>(
      `SELECT status, created_at, approved_at
       FROM report_approvals
       ${historyWhereClauses.length ? `WHERE ${historyWhereClauses.join(" AND ")}` : ""}`,
      historyParams
    );

    const now = new Date();
    const sameDay = (value?: string | null) => {
      if (!value) return false;
      const parsed = new Date(value);
      return (
        parsed.getFullYear() === now.getFullYear() &&
        parsed.getMonth() === now.getMonth() &&
        parsed.getDate() === now.getDate()
      );
    };

    const approvedToday = history.rows.filter((row) => row.status === "approved" && sameDay(row.approved_at)).length;
    const rejectedToday = history.rows.filter((row) => row.status === "rejected" && sameDay(row.approved_at)).length;
    const elapsedHours = history.rows
      .map((row) => {
        const start = new Date(row.created_at);
        const end = row.approved_at ? new Date(row.approved_at) : null;
        if (!end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      })
      .filter((value): value is number => value !== null && value >= 0);

    return {
      pending: Number(pending.rows[0]?.count ?? 0),
      approved_today: approvedToday,
      rejected_today: rejectedToday,
      avg_approval_time_hours:
        elapsedHours.length > 0
          ? Math.round((elapsedHours.reduce((sum, value) => sum + value, 0) / elapsedHours.length) * 10) / 10
          : 0,
    };
  },

  async decide(input: {
    reportId: string;
    status: ApprovalDecision;
    comments?: string;
    approverId: string;
    approverName: string;
  }): Promise<void> {
    const db = await getDbClient();
    const actorUserId = normalizeApproverId(input.approverId);
    if (!actorUserId) {
      throw new Error("Invalid approver id");
    }
    const pending = await this.listPending();
    const target = pending.find((item) => item.id === input.reportId);
    if (!target) {
      throw new Error("Pending report not found");
    }

    const approvalContext = await buildApprovalContextForActor(actorUserId, {
      company_id: target.company_id ?? null,
      superintendence_id: target.superintendence_id ?? null,
      management_id: target.management_id ?? null,
      project_id: target.project_id ?? null,
      approver_user_id: target.approver_id ?? null
    });

    if (!approvalContext) {
      throw new Error("Este usuário não possui alçada ativa para decidir este relatório.");
    }

    await db.query(
      `UPDATE report_catalog
       SET report_status = $2, updated_at = NOW()
       WHERE id = $1`,
      [input.reportId, input.status]
    );

    await db.query(
      `INSERT INTO report_approvals (
        id, report_id, approver_id, approver_name, status, comments, approved_at, report_name, destination_path, submitter_name, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, NOW(), NOW()
      )`,
      [
        randomUUID(),
        input.reportId,
        actorUserId,
        approvalContext.delegatedBy
          ? `${approvalContext.actorName} (delegação de ${approvalContext.delegatedBy.name})`
          : approvalContext.actorName,
        input.status,
        input.comments ?? null,
        target.name,
        toDbArray(db, target.destination_path),
        target.submitter_name,
      ]
    );

    await utdFlowService.syncReportStatus({
      reportCatalogId: input.reportId,
      reportStatus: input.status,
      approverUserId: actorUserId,
      approverName: approvalContext.delegatedBy
        ? `${approvalContext.actorName} (delegacao de ${approvalContext.delegatedBy.name})`
        : approvalContext.actorName,
    });

    if (input.status === "approved") {
      try {
        await materializeApprovedReport(input.reportId);
      } catch (error) {
        logger.warn("Report approved but JSON materialization failed; startup rebuild will reconcile the catalog", {
          reportId: input.reportId,
          error: (error as Error).message,
        });
      }
    }

    if (target.submitted_by) {
      await notificationService.create({
        recipientUserId: target.submitted_by,
        type: 'approval_decision',
        title: input.status === 'approved' ? 'Relatório aprovado' : 'Relatório rejeitado',
        message:
          input.status === 'approved'
            ? `Seu relatório ${target.name} foi aprovado${approvalContext.delegatedBy ? ` por ${approvalContext.actorName} em delegação de ${approvalContext.delegatedBy.name}` : ''}.`
            : `Seu relatório ${target.name} foi rejeitado${input.comments ? ` com o comentário: ${input.comments}` : '.'}`,
        entityType: 'report_catalog',
        entityId: input.reportId,
        actionUrl: '/workspace',
        metadata: {
          status: input.status,
          comments: input.comments ?? null,
          actorUserId
        }
      });
    }

    if (approvalContext.delegatedBy) {
      await notificationService.create({
        recipientUserId: approvalContext.delegatedBy.id,
        type: 'delegated_approval_decision',
        title: 'Sua delegação foi utilizada',
        message: `${approvalContext.actorName} ${input.status === 'approved' ? 'aprovou' : 'rejeitou'} o relatório ${target.name} usando sua delegação.`,
        entityType: 'report_catalog',
        entityId: input.reportId,
        actionUrl: '/approvals',
        metadata: {
          actorUserId,
          actorName: approvalContext.actorName,
          status: input.status
        }
      });
    }
  },
  async getManagerSummary(input: { approverId?: string; actorKey?: string }) {
    const db = await getDbClient();
    const approverId = normalizeApproverId(input.approverId);
    const [pending, history, likes] = await Promise.all([
      this.listPending({ approverId: approverId ?? undefined }),
      db.query<{
        id: string;
        report_id: string;
        approver_id: string;
        approver_name: string;
        status: ApprovalDecision;
        approved_at: string;
        report_name: string;
        destination_path: unknown;
      }>(
        `SELECT id, report_id, approver_id, approver_name, status, approved_at, report_name, destination_path
         FROM report_approvals
         ORDER BY approved_at DESC, created_at DESC
         LIMIT 50`
      ),
      input.actorKey
        ? db.query<{
            report_catalog_id: string;
            source_report_id: string | null;
            report_name: string;
            company_id: string | null;
            company_name: string;
            superintendence_id: string | null;
            management_id: string | null;
            project_id: string | null;
            report_date: string | null;
            metric_likes: number;
            metric_views: number;
            path: unknown;
          }>(
            `SELECT
              rl.report_catalog_id,
              rc.source_report_id,
              rc.report_name,
              rc.company_id,
              rc.company_name,
              rc.superintendence_id,
              rc.management_id,
              rc.project_id,
              rc.report_date,
              rc.metric_likes,
              rc.metric_views,
              rc.path
             FROM report_likes rl
             INNER JOIN report_catalog rc ON rc.id = rl.report_catalog_id
             WHERE rl.actor_key = $1
             ORDER BY rl.created_at DESC
             LIMIT 6`,
            [input.actorKey]
          )
        : Promise.resolve({ rows: [], rowCount: 0 }),
    ]);

    const filteredHistory = history.rows.filter((row) =>
      approverId ? row.approver_id === approverId : true
    );

    return {
      approvedCount: filteredHistory.filter((row) => row.status === "approved").length,
      rejectedCount: filteredHistory.filter((row) => row.status === "rejected").length,
      pendingCount: pending.length,
      likedCount: likes.rows.length,
      pendingReports: pending.slice(0, 5),
      recentDecisions: filteredHistory.slice(0, 6).map((row) => ({
        id: row.id,
        reportId: row.report_id,
        reportName: row.report_name,
        status: row.status,
        approvedAt: row.approved_at,
        approverName: row.approver_name,
        destinationPath: fromDbArray(row.destination_path),
      })),
      likedReports: likes.rows.map((row) => ({
        reportId: row.report_catalog_id,
        sourceReportId: row.source_report_id,
        reportName: row.report_name,
        companyId: row.company_id,
        companyName: row.company_name,
        superintendenceId: row.superintendence_id,
        managementId: row.management_id,
        projectId: row.project_id,
        reportDate: row.report_date,
        likes: Number(row.metric_likes ?? 0),
        views: Number(row.metric_views ?? 0),
        path: fromDbArray(row.path),
      })),
    };
  },
};



