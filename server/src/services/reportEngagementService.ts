import { randomUUID } from 'crypto';
import { DbClient, getDbClient } from '../db/connection';
import { isCoelbaUtdHierarchy } from '../data/coelbaHierarchyRules';
import { notificationService } from './notificationService';
import { userManagementService } from './userManagementService';

export type EngagementAction = 'view' | 'like' | 'comment' | 'share';

export const VIEW_COOLDOWN_MS = 2 * 60 * 60 * 1000;

const ACTION_COOLDOWN_MS: Partial<Record<EngagementAction, number>> = {
  view: VIEW_COOLDOWN_MS
};

const parseDbDate = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parsePath = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((x) => String(x));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      return value
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const buildDashboardReportUrl = (snapshot: {
  companyId?: string;
  superintendenceId?: string;
  managementId?: string;
  projectId?: string;
  sourceReportId?: string;
  reportName?: string;
} | null): string => {
  if (!snapshot?.companyId || !snapshot?.superintendenceId || !snapshot?.managementId || !snapshot?.projectId) {
    return '/reports';
  }

  const params = new URLSearchParams({
    company: snapshot.companyId,
    sup: snapshot.superintendenceId,
    mgmt: snapshot.managementId,
    proj: snapshot.projectId,
  });
  if (
    isCoelbaUtdHierarchy({
      companyId: snapshot.companyId,
      superintendenceId: snapshot.superintendenceId,
      managementId: snapshot.managementId
    })
  ) {
    params.set('view', 'utds');
  }

  if (snapshot.sourceReportId) {
    params.set('report', snapshot.sourceReportId);
  }
  if (snapshot.reportName) {
    params.set('reportName', snapshot.reportName);
  }

  return `/dashboard?${params.toString()}`;
};


type CatalogSnapshot = {
  sourceReportId: string;
  reportName: string;
  reportPath: string[];
  companyId?: string;
  companyName?: string;
  superintendenceId?: string;
  superintendenceName?: string;
  managementId?: string;
  managementName?: string;
  projectId?: string;
  projectName?: string;
} | null;

type ManagedUser = Awaited<ReturnType<typeof userManagementService.getUserById>>;

const createShareMonitoringRecord = async (input: {
  db: Awaited<ReturnType<typeof getDbClient>>;
  reportShareId: string;
  reportCatalogId: string;
  actorKey: string;
  snapshot: CatalogSnapshot;
  senderUserId?: string | null;
  sender: ManagedUser;
  recipient: { userId?: string | null; name?: string | null };
  recipientUser: ManagedUser;
}): Promise<void> => {
  const actionUrl = buildDashboardReportUrl(input.snapshot);
  const reportName = input.snapshot?.reportName?.trim() || 'Relatório sem nome';
  const reportPath = JSON.stringify(input.snapshot?.reportPath ?? []);
  const recipientName = input.recipientUser?.full_name ?? input.recipient.name ?? null;
  const metadata = JSON.stringify({
    reportCatalogId: input.reportCatalogId,
    sourceReportId: input.snapshot?.sourceReportId ?? null,
    senderUserId: input.senderUserId ?? null,
    senderName: input.sender?.full_name ?? null,
    recipientUserId: input.recipient.userId ?? null,
    recipientName,
  });

  await input.db.query(
    `INSERT INTO report_share_monitoring (
      id,
      report_share_id,
      report_catalog_id,
      source_report_id,
      report_name,
      report_path,
      actor_key,
      sender_user_id,
      sender_name,
      sender_email,
      sender_employee_id,
      recipient_user_id,
      recipient_name,
      recipient_email,
      recipient_employee_id,
      company_id,
      company_name,
      superintendence_id,
      superintendence_name,
      management_id,
      management_name,
      project_id,
      project_name,
      action_url,
      metadata
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
    )`,
    [
      randomUUID(),
      input.reportShareId,
      input.reportCatalogId,
      input.snapshot?.sourceReportId ?? null,
      reportName,
      reportPath,
      input.actorKey,
      input.senderUserId ?? null,
      input.sender?.full_name ?? null,
      input.sender?.email ?? null,
      input.sender?.employee_id ?? null,
      input.recipient.userId ?? null,
      recipientName,
      input.recipientUser?.email ?? null,
      input.recipientUser?.employee_id ?? null,
      input.snapshot?.companyId ?? null,
      input.snapshot?.companyName ?? null,
      input.snapshot?.superintendenceId ?? null,
      input.snapshot?.superintendenceName ?? null,
      input.snapshot?.managementId ?? null,
      input.snapshot?.managementName ?? null,
      input.snapshot?.projectId ?? null,
      input.snapshot?.projectName ?? null,
      actionUrl,
      metadata,
    ]
  );
};
export const canIncrementViewAfterCooldown = (
  lastOccurredAt: string | Date | null | undefined,
  now = Date.now(),
): boolean => {
  if (!lastOccurredAt) return true;
  const parsed = lastOccurredAt instanceof Date ? lastOccurredAt : parseDbDate(lastOccurredAt);
  if (!parsed) return true;
  return now - parsed.getTime() >= VIEW_COOLDOWN_MS;
};

export type CommentTreeItem = {
  id: string;
  message: string;
  actor_key: string;
  created_at: string;
  parent_comment_id: string | null;
  replies: CommentTreeItem[];
};

export const reportEngagementService = {
  async getCatalogSnapshot(reportCatalogId: string): Promise<{
    sourceReportId: string;
    reportName: string;
    reportPath: string[];
    companyId?: string;
    companyName?: string;
    superintendenceId?: string;
    superintendenceName?: string;
    managementId?: string;
    managementName?: string;
    projectId?: string;
    projectName?: string;
  } | null> {
    const db = await getDbClient();
    const result = await db.query<{
      source_report_id: string;
      report_name: string;
      path: unknown;
      company_id: string | null;
      company_name: string | null;
      superintendence_id: string | null;
      superintendence_name: string | null;
      management_id: string | null;
      management_name: string | null;
      project_id: string | null;
      project_name: string | null;
    }>(
      `SELECT source_report_id, report_name, path, company_id, company_name, superintendence_id, superintendence_name, management_id, management_name, project_id, project_name
       FROM report_catalog
       WHERE id = $1
       LIMIT 1`,
      [reportCatalogId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      sourceReportId: row.source_report_id ?? '',
      reportName: row.report_name ?? '',
      reportPath: parsePath(row.path),
      companyId: row.company_id ?? undefined,
      companyName: row.company_name ?? undefined,
      superintendenceId: row.superintendence_id ?? undefined,
      superintendenceName: row.superintendence_name ?? undefined,
      managementId: row.management_id ?? undefined,
      managementName: row.management_name ?? undefined,
      projectId: row.project_id ?? undefined,
      projectName: row.project_name ?? undefined,
    };
  },

  async ensureMetricRow(reportCatalogId: string, dbClient?: DbClient): Promise<void> {
    const db = dbClient ?? await getDbClient();
    const snapshot = await this.getCatalogSnapshot(reportCatalogId);
    const sourceReportId = snapshot?.sourceReportId ?? '';
    const reportName = snapshot?.reportName ?? '';
    const reportPath = snapshot?.reportPath ?? [];
    const serializedPath = JSON.stringify(reportPath);
    const existing = await db.query<{ id: string }>(
      'SELECT id FROM report_engagement_metrics WHERE report_catalog_id = $1 LIMIT 1',
      [reportCatalogId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO report_engagement_metrics (id, report_catalog_id, report_source_id, report_name, report_path)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), reportCatalogId, sourceReportId, reportName, serializedPath]
      );
      return;
    }

    await db.query(
      `UPDATE report_engagement_metrics
       SET report_source_id = $2, report_name = $3, report_path = $4, updated_at = NOW()
       WHERE report_catalog_id = $1`,
      [reportCatalogId, sourceReportId, reportName, serializedPath]
    );
  },

  async syncMetricsFromFacts(reportCatalogId: string): Promise<void> {
    const db = await getDbClient();
    await this.ensureMetricRow(reportCatalogId);

    const likes = await db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM report_likes WHERE report_catalog_id = $1`,
      [reportCatalogId]
    );
    const comments = await db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM report_comments WHERE report_catalog_id = $1`,
      [reportCatalogId]
    );
    const shares = await db.query<{ count: number }>(
      `SELECT COUNT(*) AS count FROM report_shares WHERE report_catalog_id = $1`,
      [reportCatalogId]
    );

    const likesCount = Number(likes.rows[0]?.count ?? 0);
    const commentsCount = Number(comments.rows[0]?.count ?? 0);
    const sharesCount = Number(shares.rows[0]?.count ?? 0);

    await db.query(
      `UPDATE report_engagement_metrics
       SET likes_count = $2, comments_count = $3, shares_count = $4, updated_at = NOW()
       WHERE report_catalog_id = $1`,
      [reportCatalogId, likesCount, commentsCount, sharesCount]
    );

    await db.query(
      `UPDATE report_catalog
       SET metric_likes = $2, metric_comments = $3, metric_shares = $4, updated_at = NOW()
       WHERE id = $1`,
      [reportCatalogId, likesCount, commentsCount, sharesCount]
    );
  },

  async repairViewMetricsFromEvents(reportCatalogId: string): Promise<{ repaired: boolean; viewsCount: number }> {
    const db = await getDbClient();
    await this.ensureMetricRow(reportCatalogId);

    const [events, metrics] = await Promise.all([
      db.query<{ count: number }>(
        `SELECT COUNT(*) AS count
         FROM report_engagement_events
         WHERE report_catalog_id = $1 AND action = 'view'`,
        [reportCatalogId]
      ),
      db.query<{ views_count: number; metric_views: number }>(
        `SELECT rem.views_count, rc.metric_views
         FROM report_catalog rc
         LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
         WHERE rc.id = $1
         LIMIT 1`,
        [reportCatalogId]
      )
    ]);

    const eventViews = Number(events.rows[0]?.count ?? 0);
    const metricViews = Number(metrics.rows[0]?.views_count ?? 0);
    const catalogViews = Number(metrics.rows[0]?.metric_views ?? 0);
    const targetViews = Math.max(eventViews, metricViews, catalogViews);

    if (targetViews <= metricViews && targetViews <= catalogViews) {
      return { repaired: false, viewsCount: targetViews };
    }

    await db.query(
      `UPDATE report_engagement_metrics
       SET views_count = $2, updated_at = NOW()
       WHERE report_catalog_id = $1`,
      [reportCatalogId, targetViews]
    );
    await db.query(
      `UPDATE report_catalog
       SET metric_views = $2, updated_at = NOW()
       WHERE id = $1`,
      [reportCatalogId, targetViews]
    );

    return { repaired: true, viewsCount: targetViews };
  },

  async maybeIncrementView(reportCatalogId: string, actorKey: string): Promise<{ incremented: boolean; reason?: string }> {
    const db = await getDbClient();
    const key = actorKey.trim() || 'anonymous';
    const cooldownMs = ACTION_COOLDOWN_MS.view ?? 0;

    const last = await db.query<{ occurred_at: string }>(
      `SELECT occurred_at
       FROM report_engagement_events
       WHERE report_catalog_id = $1 AND actor_key = $2 AND action = 'view'
       ORDER BY occurred_at DESC
       LIMIT 1`,
      [reportCatalogId, key]
    );

    const lastAt = parseDbDate(last.rows[0]?.occurred_at);
    if (cooldownMs > 0 && !canIncrementViewAfterCooldown(lastAt)) {
      const repaired = await this.repairViewMetricsFromEvents(reportCatalogId);
      if (repaired.repaired) {
        return { incremented: true, reason: 'view_repaired_from_events' };
      }
      return { incremented: false, reason: 'view_cooldown_2h' };
    }

    await this.ensureMetricRow(reportCatalogId);
    await db.query(
      `UPDATE report_engagement_metrics
       SET views_count = views_count + 1, updated_at = NOW()
       WHERE report_catalog_id = $1`,
      [reportCatalogId]
    );
    await db.query(
      `UPDATE report_catalog
       SET metric_views = metric_views + 1, updated_at = NOW()
       WHERE id = $1`,
      [reportCatalogId]
    );
    await db.query(
      `INSERT INTO report_engagement_events (id, report_catalog_id, actor_key, action)
       VALUES ($1, $2, $3, 'view')`,
      [randomUUID(), reportCatalogId, key]
    );
    return { incremented: true };
  },

  async toggleLike(reportCatalogId: string, actorKey: string, userId?: string | null): Promise<{ liked: boolean }> {
    const db = await getDbClient();
    const key = actorKey.trim() || 'anonymous';

    const existing = await db.query<{ id: string }>(
      `SELECT id FROM report_likes WHERE report_catalog_id = $1 AND actor_key = $2 LIMIT 1`,
      [reportCatalogId, key]
    );

    let liked = false;
    if (existing.rows[0]?.id) {
      await db.query('DELETE FROM report_likes WHERE id = $1', [existing.rows[0].id]);
      liked = false;
    } else {
      await db.query(
        `INSERT INTO report_likes (id, report_catalog_id, actor_key, user_id)
         VALUES ($1, $2, $3, $4)`,
        [randomUUID(), reportCatalogId, key, userId ?? null]
      );
      liked = true;
    }

    await this.syncMetricsFromFacts(reportCatalogId);
    return { liked };
  },

  async addComment(input: {
    reportCatalogId: string;
    actorKey: string;
    message: string;
    userId?: string | null;
    parentCommentId?: string | null;
  }): Promise<void> {
    const db = await getDbClient();
    const trimmed = input.message.trim();
    if (!trimmed) throw new Error('Comment cannot be empty');

    await db.query(
      `INSERT INTO report_comments (id, report_catalog_id, parent_comment_id, actor_key, user_id, message)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), input.reportCatalogId, input.parentCommentId ?? null, input.actorKey || 'anonymous', input.userId ?? null, trimmed]
    );

    await this.syncMetricsFromFacts(input.reportCatalogId);
  },

  async listCommentsTree(reportCatalogId: string, limit = 200): Promise<CommentTreeItem[]> {
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      message: string;
      actor_key: string;
      created_at: string;
      parent_comment_id: string | null;
    }>(
      `SELECT id, message, actor_key, created_at, parent_comment_id
       FROM report_comments
       WHERE report_catalog_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [reportCatalogId, limit]
    );

    const byId = new Map<string, CommentTreeItem>();
    const roots: CommentTreeItem[] = [];

    for (const row of result.rows) {
      byId.set(row.id, {
        id: row.id,
        message: row.message,
        actor_key: row.actor_key,
        created_at: row.created_at,
        parent_comment_id: row.parent_comment_id,
        replies: []
      });
    }

    for (const item of byId.values()) {
      if (item.parent_comment_id && byId.has(item.parent_comment_id)) {
        byId.get(item.parent_comment_id)?.replies.push(item);
      } else {
        roots.push(item);
      }
    }

    roots.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    return roots;
  },

  async listComments(reportCatalogId: string, limit = 50): Promise<Array<{ id: string; message: string; actor_key: string; created_at: string; parent_comment_id: string | null }>> {
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      message: string;
      actor_key: string;
      created_at: string;
      parent_comment_id: string | null;
    }>(
      `SELECT id, message, actor_key, created_at, parent_comment_id
       FROM report_comments
       WHERE report_catalog_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [reportCatalogId, limit]
    );
    return result.rows;
  },

  async shareReport(input: {
    reportCatalogId: string;
    actorKey: string;
    senderUserId?: string | null;
    recipients: Array<{ userId?: string | null; name?: string | null }>;
  }): Promise<{ created: number }> {
    const db = await getDbClient();
    const actorKey = input.actorKey.trim() || 'anonymous';
    const recipients = input.recipients.filter((r) => (r.userId && String(r.userId).trim()) || (r.name && String(r.name).trim()));
    if (recipients.length === 0) return { created: 0 };

    const [snapshot, sender] = await Promise.all([
      this.getCatalogSnapshot(input.reportCatalogId),
      input.senderUserId ? userManagementService.getUserById(input.senderUserId).catch(() => null) : Promise.resolve(null),
    ]);
    const senderLabel = sender?.full_name ?? 'Um usuário';

    let created = 0;
    for (const recipient of recipients) {
      const shareId = randomUUID();
      const recipientUser = recipient.userId
        ? await userManagementService.getUserById(recipient.userId).catch(() => null)
        : null;

      await db.query(
        `INSERT INTO report_shares (id, report_catalog_id, actor_key, sender_user_id, recipient_user_id, recipient_name)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [shareId, input.reportCatalogId, actorKey, input.senderUserId ?? null, recipient.userId ?? null, recipient.name ?? null]
      );

      await createShareMonitoringRecord({
        db,
        reportShareId: shareId,
        reportCatalogId: input.reportCatalogId,
        actorKey,
        snapshot,
        senderUserId: input.senderUserId ?? null,
        sender,
        recipient,
        recipientUser,
      });

      created += 1;

      if (recipient.userId && recipient.userId !== input.senderUserId) {
        await notificationService.create({
          recipientUserId: recipient.userId,
          type: 'report_shared',
          title: 'Relatório compartilhado com você',
          message: `${senderLabel} compartilhou o relatório ${snapshot?.reportName ?? 'selecionado'} com você.`,
          entityType: 'report_catalog',
          entityId: input.reportCatalogId,
          actionUrl: buildDashboardReportUrl(snapshot),
          metadata: {
            reportCatalogId: input.reportCatalogId,
            sourceReportId: snapshot?.sourceReportId,
            reportName: snapshot?.reportName,
            senderUserId: input.senderUserId ?? null,
            senderName: senderLabel,
          },
        });
      }
    }

    await this.syncMetricsFromFacts(input.reportCatalogId);
    return { created };
  },
  async listSharedReports(userId: string): Promise<{
    sharedWithMe: Array<{
      direction: 'incoming' | 'outgoing';
      report_catalog_id: string;
      source_report_id: string;
      report_name: string;
      report_description: string;
      report_date: string | null;
      report_size_label: string | null;
      report_url: string | null;
      company_id: string | null;
      company_name: string | null;
      superintendence_id: string | null;
      superintendence_name: string | null;
      management_id: string | null;
      management_name: string | null;
      project_id: string | null;
      project_name: string | null;
      path: string[];
      metrics: { views: number; likes: number; comments: number; shares: number };
      shared_at: string;
      counterparty_label: string;
      counterparty_count: number;
      action_url: string;
    }>;
    sharedByMe: Array<{
      direction: 'incoming' | 'outgoing';
      report_catalog_id: string;
      source_report_id: string;
      report_name: string;
      report_description: string;
      report_date: string | null;
      report_size_label: string | null;
      report_url: string | null;
      company_id: string | null;
      company_name: string | null;
      superintendence_id: string | null;
      superintendence_name: string | null;
      management_id: string | null;
      management_name: string | null;
      project_id: string | null;
      project_name: string | null;
      path: string[];
      metrics: { views: number; likes: number; comments: number; shares: number };
      shared_at: string;
      counterparty_label: string;
      counterparty_count: number;
      action_url: string;
    }>;
  }> {
    const db = await getDbClient();
    type SharedReportRow = {
      report_catalog_id: string;
      source_report_id: string;
      report_name: string;
      report_description: string | null;
      report_date: string | null;
      report_size_label: string | null;
      report_url: string | null;
      company_id: string | null;
      company_name: string | null;
      superintendence_id: string | null;
      superintendence_name: string | null;
      management_id: string | null;
      management_name: string | null;
      project_id: string | null;
      project_name: string | null;
      path: unknown;
      metric_views: number | null;
      metric_likes: number | null;
      metric_comments: number | null;
      metric_shares: number | null;
      views_count: number | null;
      likes_count: number | null;
      comments_count: number | null;
      shares_count: number | null;
      shared_at: string;
      counterparty_label: string | null;
      counterparty_count: number | null;
      action_url: string | null;
    };

    const mapRow = (row: SharedReportRow, direction: 'incoming' | 'outgoing') => {
      const computedActionUrl = buildDashboardReportUrl({
        companyId: row.company_id ?? undefined,
        superintendenceId: row.superintendence_id ?? undefined,
        managementId: row.management_id ?? undefined,
        projectId: row.project_id ?? undefined,
        sourceReportId: row.source_report_id ?? undefined,
        reportName: row.report_name ?? undefined,
      });

      return ({
      direction,
      report_catalog_id: row.report_catalog_id,
      source_report_id: row.source_report_id,
      report_name: row.report_name,
      report_description: row.report_description ?? '',
      report_date: row.report_date ?? null,
      report_size_label: row.report_size_label ?? null,
      report_url: row.report_url ?? null,
      company_id: row.company_id ?? null,
      company_name: row.company_name ?? null,
      superintendence_id: row.superintendence_id ?? null,
      superintendence_name: row.superintendence_name ?? null,
      management_id: row.management_id ?? null,
      management_name: row.management_name ?? null,
      project_id: row.project_id ?? null,
      project_name: row.project_name ?? null,
      path: parsePath(row.path),
      metrics: {
        views: Number(row.views_count ?? row.metric_views ?? 0),
        likes: Number(row.likes_count ?? row.metric_likes ?? 0),
        comments: Number(row.comments_count ?? row.metric_comments ?? 0),
        shares: Number(row.shares_count ?? row.metric_shares ?? 0),
      },
      shared_at: row.shared_at,
      counterparty_label: row.counterparty_label ?? '',
      counterparty_count: Number(row.counterparty_count ?? 0),
      action_url: computedActionUrl !== '/reports' ? computedActionUrl : row.action_url ?? computedActionUrl,
    });
    };

    const [incoming, outgoing] = await Promise.all([
      db.query<SharedReportRow>(
        `SELECT
           rc.id AS report_catalog_id,
           rc.source_report_id,
           rc.report_name,
           rc.report_description,
           rc.report_date,
           rc.report_size_label,
           rc.report_url,
           rc.company_id,
           rc.company_name,
           rc.superintendence_id,
           rc.superintendence_name,
           rc.management_id,
           rc.management_name,
           rc.project_id,
           rc.project_name,
           COALESCE(MAX(sm.report_path), rc.path) AS path,
           rc.metric_views,
           rc.metric_likes,
           rc.metric_comments,
           rc.metric_shares,
           rem.views_count,
           rem.likes_count,
           rem.comments_count,
           rem.shares_count,
           MAX(sm.created_at) AS shared_at,
           COALESCE(GROUP_CONCAT(DISTINCT COALESCE(sm.sender_name, 'Usuário')), 'Usuário') AS counterparty_label,
           COUNT(DISTINCT COALESCE(sm.sender_user_id, sm.sender_email, sm.actor_key, sm.sender_name)) AS counterparty_count,
           MAX(sm.action_url) AS action_url
         FROM report_share_monitoring sm
         INNER JOIN report_catalog rc ON rc.id = sm.report_catalog_id
         LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
         WHERE sm.recipient_user_id = $1
         GROUP BY
           rc.id, rc.source_report_id, rc.report_name, rc.report_description, rc.report_date, rc.report_size_label, rc.report_url,
           rc.company_id, rc.company_name, rc.superintendence_id, rc.superintendence_name, rc.management_id, rc.management_name,
           rc.project_id, rc.project_name, rc.path, rc.metric_views, rc.metric_likes, rc.metric_comments, rc.metric_shares,
           rem.views_count, rem.likes_count, rem.comments_count, rem.shares_count
         ORDER BY shared_at DESC`,
        [userId]
      ),
      db.query<SharedReportRow>(
        `SELECT
           rc.id AS report_catalog_id,
           rc.source_report_id,
           rc.report_name,
           rc.report_description,
           rc.report_date,
           rc.report_size_label,
           rc.report_url,
           rc.company_id,
           rc.company_name,
           rc.superintendence_id,
           rc.superintendence_name,
           rc.management_id,
           rc.management_name,
           rc.project_id,
           rc.project_name,
           COALESCE(MAX(sm.report_path), rc.path) AS path,
           rc.metric_views,
           rc.metric_likes,
           rc.metric_comments,
           rc.metric_shares,
           rem.views_count,
           rem.likes_count,
           rem.comments_count,
           rem.shares_count,
           MAX(sm.created_at) AS shared_at,
           COALESCE(GROUP_CONCAT(DISTINCT COALESCE(sm.recipient_name, 'Destinatario')), 'Destinatario') AS counterparty_label,
           COUNT(DISTINCT COALESCE(sm.recipient_user_id, sm.recipient_email, sm.recipient_name)) AS counterparty_count,
           MAX(sm.action_url) AS action_url
         FROM report_share_monitoring sm
         INNER JOIN report_catalog rc ON rc.id = sm.report_catalog_id
         LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
         WHERE sm.sender_user_id = $1
         GROUP BY
           rc.id, rc.source_report_id, rc.report_name, rc.report_description, rc.report_date, rc.report_size_label, rc.report_url,
           rc.company_id, rc.company_name, rc.superintendence_id, rc.superintendence_name, rc.management_id, rc.management_name,
           rc.project_id, rc.project_name, rc.path, rc.metric_views, rc.metric_likes, rc.metric_comments, rc.metric_shares,
           rem.views_count, rem.likes_count, rem.comments_count, rem.shares_count
         ORDER BY shared_at DESC`,
        [userId]
      )
    ]);

    return {
      sharedWithMe: incoming.rows.map((row) => mapRow(row, 'incoming')),
      sharedByMe: outgoing.rows.map((row) => mapRow(row, 'outgoing')),
    };
  },
  async listShareTargets(limit = 20): Promise<Array<{ id: string; name: string; email?: string }>> {
    const db = await getDbClient();
    const result = await db.query<{ id: string; name: string; email: string }>(
      `SELECT id, name, email
       FROM users
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    if (result.rows.length > 0) {
      return result.rows.map((row) => ({ id: row.id, name: row.name, email: row.email }));
    }

    return [
      { id: 'mock-user-1', name: 'Ana Silva' },
      { id: 'mock-user-2', name: 'Bruno Costa' },
      { id: 'mock-user-3', name: 'Carla Souza' },
      { id: 'mock-user-4', name: 'Diego Lima' }
    ];
  },

  async get(reportCatalogId: string): Promise<{ views: number; likes: number; comments: number; shares: number }> {
    const db = await getDbClient();
    await this.ensureMetricRow(reportCatalogId);
    const result = await db.query<{
      views_count: number;
      likes_count: number;
      comments_count: number;
      shares_count: number;
    }>(
      `SELECT views_count, likes_count, comments_count, shares_count
       FROM report_engagement_metrics
       WHERE report_catalog_id = $1
       LIMIT 1`,
      [reportCatalogId]
    );
    const row = result.rows[0];
    return {
      views: Number(row?.views_count ?? 0),
      likes: Number(row?.likes_count ?? 0),
      comments: Number(row?.comments_count ?? 0),
      shares: Number(row?.shares_count ?? 0)
    };
  },

  async increment(reportCatalogId: string, action: EngagementAction, amount = 1): Promise<void> {
    const db = await getDbClient();
    const safeAmount = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
    await this.ensureMetricRow(reportCatalogId);
    const metricCol =
      action === 'view' ? 'views_count' : action === 'like' ? 'likes_count' : action === 'comment' ? 'comments_count' : 'shares_count';
    const catalogCol =
      action === 'view' ? 'metric_views' : action === 'like' ? 'metric_likes' : action === 'comment' ? 'metric_comments' : 'metric_shares';
    await db.query(
      `UPDATE report_engagement_metrics SET ${metricCol} = ${metricCol} + $2, updated_at = NOW() WHERE report_catalog_id = $1`,
      [reportCatalogId, safeAmount]
    );
    await db.query(
      `UPDATE report_catalog SET ${catalogCol} = ${catalogCol} + $2, updated_at = NOW() WHERE id = $1`,
      [reportCatalogId, safeAmount]
    );
  },

  async upsertFromInitial(
    reportCatalogId: string,
    input: { views: number; likes: number; comments: number; shares: number },
    dbClient?: DbClient
  ) {
    const db = dbClient ?? await getDbClient();
    const snapshot = await this.getCatalogSnapshot(reportCatalogId);
    const sourceReportId = snapshot?.sourceReportId ?? '';
    const reportName = snapshot?.reportName ?? '';
    const reportPath = snapshot?.reportPath ?? [];
    const serializedPath = JSON.stringify(reportPath);
    const existing = await db.query<{ id: string }>(
      'SELECT id FROM report_engagement_metrics WHERE report_catalog_id = $1 LIMIT 1',
      [reportCatalogId]
    );

    if (existing.rows.length === 0) {
      await db.query(
        `INSERT INTO report_engagement_metrics (id, report_catalog_id, report_source_id, report_name, report_path, views_count, likes_count, comments_count, shares_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [randomUUID(), reportCatalogId, sourceReportId, reportName, serializedPath, input.views, input.likes, input.comments, input.shares]
      );
      return;
    }

    await db.query(
      `UPDATE report_engagement_metrics
       SET report_source_id = $2, report_name = $3, report_path = $4,
           views_count = $5, likes_count = $6, comments_count = $7, shares_count = $8,
           updated_at = NOW()
       WHERE report_catalog_id = $1`,
      [reportCatalogId, sourceReportId, reportName, serializedPath, input.views, input.likes, input.comments, input.shares]
    );
  }
};







