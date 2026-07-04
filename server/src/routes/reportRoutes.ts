import express, { Router } from "express";
import { ZodError, z } from "zod";
import { reportIngestionService } from "../services/reportIngestionService";
import { AuthenticatedRequest, authMiddleware, tryGetAuthenticatedUser } from "../middleware/auth";
import { frontReportStructureService } from "../services/frontReportStructureService";
import { reportCatalogService } from "../services/reportCatalogService";
import { reportEngagementService } from "../services/reportEngagementService";
import { reportCatalogFileQueryService } from "../services/reportCatalogFileQueryService";
import { reportApprovalService } from "../services/reportApprovalService";
import { reportCatalogSemanticSyncService } from "../services/reportCatalogSemanticSyncService";
import { isSuperadminEmail, superadminService } from "../services/superadminService";
import { canDeleteReportsByJobTitle, userManagementService } from "../services/userManagementService";
import { getDbClient } from "../db/connection";
import { utdFlowService } from "../services/utdFlowService";

export const reportRoutes = Router();

const toHeaderString = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? value.join("; ") : value ?? null;

const resolveActorKey = (
  req: AuthenticatedRequest | express.Request,
  authenticatedUser?: { userId?: string | null } | null,
  payload?: { userId?: string; clientId?: string }
): string => {
  const explicitUserId = payload?.userId?.trim();
  if (authenticatedUser?.userId?.trim()) return authenticatedUser.userId.trim();
  if (explicitUserId) return explicitUserId;
  if (payload?.clientId?.trim()) return payload.clientId.trim();

  const requestIp = req.ip?.trim() || "unknown-ip";
  const userAgent = toHeaderString(req.headers["user-agent"])?.trim() || "unknown-agent";
  return `guest:${requestIp}:${userAgent}`;
};

const engagementSchema = z.object({
  action: z.enum(["view", "share", "comment"]),
  count: z.coerce.number().int().min(1).max(100).optional(),
  clientId: z.string().min(1).max(200).optional(),
  userId: z.string().uuid().optional(),
  reportName: z.string().min(1).max(500).optional()
});

const createCommentSchema = z.object({
  message: z.string().min(1).max(2000),
  parentCommentId: z.string().uuid().optional(),
  clientId: z.string().min(1).max(200).optional(),
  userId: z.string().uuid().optional()
});

const likeToggleSchema = z.object({
  clientId: z.string().min(1).max(200).optional(),
  userId: z.string().uuid().optional(),
  reportName: z.string().min(1).max(500).optional()
});

const shareSchema = z.object({
  clientId: z.string().min(1).max(200).optional(),
  userId: z.string().uuid().optional(),
  reportName: z.string().min(1).max(500).optional(),
  recipients: z
    .array(
      z.object({
        userId: z.string().optional(),
        name: z.string().optional()
      })
    )
    .min(1)
    .max(50)
});

const utdDraftSchema = z.object({
  companyId: z.string().min(1),
  superintendenceId: z.string().min(1),
  managementId: z.string().min(1),
  projectId: z.string().min(1),
  reportName: z.string().optional(),
  reportDescription: z.string().optional(),
  reportUrl: z.string().optional(),
  reportDate: z.string().optional(),
  indicatorsText: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional()
});

const analyticsMetricSchema = z.enum(["views", "likes", "comments", "shares"]);
const analyticsPeriodSchema = z.enum(["day", "week", "month", "6months", "year", "custom"]);

type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;
type AnalyticsPeriod = z.infer<typeof analyticsPeriodSchema>;

const normalizeDateStart = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const normalizeDateEnd = (value: Date): Date => {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
};

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
};

const addMonths = (value: Date, months: number): Date => {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
};

const parseValidDate = (value: string | undefined, fallback: Date): Date => {
  if (!value) return new Date(fallback);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(fallback) : parsed;
};

const formatDateKey = (value: Date): string => normalizeDateStart(value).toISOString().slice(0, 10);

const formatMonthKey = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatLabel = (value: Date, period: AnalyticsPeriod): string => {
  if (period === "6months" || period === "year") {
    return value.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  }
  return value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const getRangeBounds = (period: AnalyticsPeriod, endDate: Date, customStart?: string, customEnd?: string) => {
  if (period === "custom") {
    const rawStart = parseValidDate(customStart, endDate);
    const rawEnd = parseValidDate(customEnd, endDate);
    return {
      start: normalizeDateStart(rawStart),
      end: normalizeDateEnd(rawEnd < rawStart ? rawStart : rawEnd)
    };
  }

  switch (period) {
    case "day":
      return { start: normalizeDateStart(endDate), end: normalizeDateEnd(endDate) };
    case "week":
      return { start: normalizeDateStart(addDays(endDate, -6)), end: normalizeDateEnd(endDate) };
    case "month":
      return { start: normalizeDateStart(addDays(endDate, -29)), end: normalizeDateEnd(endDate) };
    case "6months":
      return { start: normalizeDateStart(addMonths(endDate, -5)), end: normalizeDateEnd(endDate) };
    case "year":
      return { start: normalizeDateStart(addMonths(endDate, -11)), end: normalizeDateEnd(endDate) };
  }
};

const enumerateBuckets = (period: AnalyticsPeriod, start: Date, end: Date) => {
  const buckets: Array<{ key: string; label: string; start: Date; end: Date }> = [];

  if (period === "6months" || period === "year" || (period === "custom" && Math.ceil((end.getTime() - start.getTime()) / 86400000) > 31)) {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endCursor) {
      const bucketStart = normalizeDateStart(cursor);
      const bucketEnd = normalizeDateEnd(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
      buckets.push({
        key: formatMonthKey(cursor),
        label: formatLabel(cursor, "year"),
        start: bucketStart,
        end: bucketEnd
      });
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return buckets;
  }

  let cursor = normalizeDateStart(start);
  while (cursor <= end) {
    const bucketStart = normalizeDateStart(cursor);
    const bucketEnd = normalizeDateEnd(cursor);
    buckets.push({
      key: formatDateKey(cursor),
      label: formatLabel(cursor, period),
      start: bucketStart,
      end: bucketEnd
    });
    cursor = addDays(cursor, 1);
  }
  return buckets;
};

const getBucketKey = (period: AnalyticsPeriod, start: Date, end: Date, value: Date): string => {
  const useMonthBuckets =
    period === "6months" ||
    period === "year" ||
    (period === "custom" && Math.ceil((end.getTime() - start.getTime()) / 86400000) > 31);
  return useMonthBuckets ? formatMonthKey(value) : formatDateKey(value);
};

const resolveCatalogIdWithSync = async (sourceId: string, reportName?: string): Promise<string | null> => {
  let catalogId = await reportCatalogService.resolveCatalogIdBySourceId(sourceId);
  if (catalogId) return catalogId;
  if (reportName) {
    catalogId = await reportCatalogService.resolveCatalogIdByReportName(reportName);
    if (catalogId) return catalogId;
  }
  const sourceFromFiles = await reportCatalogService.resolveSourceIdFromCatalogFiles(sourceId, reportName);
  if (sourceFromFiles) {
    catalogId = await reportCatalogService.resolveCatalogIdBySourceId(sourceFromFiles);
    if (catalogId) return catalogId;
  }
  await reportCatalogService.syncCatalogFilesToDatabase().catch(() => undefined);
  catalogId = await reportCatalogService.resolveCatalogIdBySourceId(sourceId);
  if (!catalogId && reportName) {
    catalogId = await reportCatalogService.resolveCatalogIdByReportName(reportName);
  }
  if (!catalogId) {
    const sourceAfterSync = await reportCatalogService.resolveSourceIdFromCatalogFiles(sourceId, reportName);
    if (sourceAfterSync) {
      catalogId = await reportCatalogService.resolveCatalogIdBySourceId(sourceAfterSync);
    }
  }
  return catalogId;
};

const buildEmptyAnalyticsResponse = (
  companyId: string,
  companyName: string,
  period: AnalyticsPeriod,
  metrics: AnalyticsMetric[],
  start: Date,
  end: Date,
) => ({
  companyId,
  companyName,
  period,
  metrics,
  range: {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10)
  },
  totals: { views: 0, likes: 0, comments: 0, shares: 0, reports: 0 },
  points: [] as Array<{
    key: string;
    label: string;
    startDate: string;
    endDate: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    reports: number;
    total: number;
  }>
});

const buildReportAnalytics = async ({
  catalogId,
  companyId,
  period,
  metrics,
  start,
  end
}: {
  catalogId: string;
  companyId: string;
  period: AnalyticsPeriod;
  metrics: AnalyticsMetric[];
  start: Date;
  end: Date;
}) => {
  const db = await getDbClient();
  const catalog = await db.query<{
    report_name: string;
    company_name: string;
    metric_views: number;
    metric_likes: number;
    metric_comments: number;
    metric_shares: number;
    views_count: number | null;
    likes_count: number | null;
    comments_count: number | null;
    shares_count: number | null;
  }>(
    `SELECT
       rc.report_name,
       rc.company_name,
       rc.metric_views,
       rc.metric_likes,
       rc.metric_comments,
       rc.metric_shares,
       rem.views_count,
       rem.likes_count,
       rem.comments_count,
       rem.shares_count
     FROM report_catalog rc
     LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
     WHERE rc.id = $1
     LIMIT 1`,
    [catalogId]
  );

  const reportRow = catalog.rows[0];
  if (!reportRow) {
    return buildEmptyAnalyticsResponse(companyId, companyId, period, metrics, start, end);
  }

  const buckets = enumerateBuckets(period, start, end).map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    startDate: bucket.start.toISOString().slice(0, 10),
    endDate: bucket.end.toISOString().slice(0, 10),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    reports: 0,
    total: 0
  }));
  const pointsByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  const activityRows = await db.query<{ occurred_at: string; metric: AnalyticsMetric; count: number }>(
    `SELECT occurred_at, 'views' AS metric, COUNT(*) AS count
       FROM report_engagement_events
      WHERE report_catalog_id = $1 AND action = 'view' AND occurred_at >= $2 AND occurred_at <= $3
      GROUP BY occurred_at
     UNION ALL
     SELECT created_at AS occurred_at, 'likes' AS metric, COUNT(*) AS count
       FROM report_likes
      WHERE report_catalog_id = $1 AND created_at >= $2 AND created_at <= $3
      GROUP BY created_at
     UNION ALL
     SELECT created_at AS occurred_at, 'comments' AS metric, COUNT(*) AS count
       FROM report_comments
      WHERE report_catalog_id = $1 AND created_at >= $2 AND created_at <= $3
      GROUP BY created_at
     UNION ALL
     SELECT created_at AS occurred_at, 'shares' AS metric, COUNT(*) AS count
       FROM report_shares
      WHERE report_catalog_id = $1 AND created_at >= $2 AND created_at <= $3
      GROUP BY created_at`,
    [catalogId, start.toISOString(), end.toISOString()]
  );

  for (const row of activityRows.rows) {
    const occurredAt = new Date(row.occurred_at);
    if (Number.isNaN(occurredAt.getTime())) continue;
    const bucketKey = getBucketKey(period, start, end, occurredAt);
    const point = pointsByKey.get(bucketKey);
    if (!point) continue;
    point[row.metric] += Number(row.count ?? 0);
    point.reports = 1;
  }

  const points = Array.from(pointsByKey.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const hasActivity = activityRows.rows.length > 0;

  if (hasActivity) {
    const running = { views: 0, likes: 0, comments: 0, shares: 0 };
    for (const point of points) {
      running.views += point.views;
      running.likes += point.likes;
      running.comments += point.comments;
      running.shares += point.shares;
      point.views = running.views;
      point.likes = running.likes;
      point.comments = running.comments;
      point.shares = running.shares;
      point.total = point.views + point.likes + point.comments + point.shares;
    }
  }

  const currentTotals = {
    views: Number(reportRow.views_count ?? reportRow.metric_views ?? 0),
    likes: Number(reportRow.likes_count ?? reportRow.metric_likes ?? 0),
    comments: Number(reportRow.comments_count ?? reportRow.metric_comments ?? 0),
    shares: Number(reportRow.shares_count ?? reportRow.metric_shares ?? 0)
  };

  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (hasActivity) {
      lastPoint.views = Math.max(lastPoint.views, currentTotals.views);
      lastPoint.likes = Math.max(lastPoint.likes, currentTotals.likes);
      lastPoint.comments = Math.max(lastPoint.comments, currentTotals.comments);
      lastPoint.shares = Math.max(lastPoint.shares, currentTotals.shares);
      lastPoint.total = lastPoint.views + lastPoint.likes + lastPoint.comments + lastPoint.shares;
      lastPoint.reports = 1;
    } else {
      lastPoint.views = currentTotals.views;
      lastPoint.likes = currentTotals.likes;
      lastPoint.comments = currentTotals.comments;
      lastPoint.shares = currentTotals.shares;
      lastPoint.total = lastPoint.views + lastPoint.likes + lastPoint.comments + lastPoint.shares;
      lastPoint.reports = 1;
    }
  }

  return {
    companyId,
    companyName: reportRow.company_name ?? companyId,
    period,
    metrics,
    range: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    },
    totals: {
      ...currentTotals,
      reports: 1
    },
    points
  };
};

const buildCompanyAnalytics = async ({
  companyId,
  period,
  metrics,
  start,
  end
}: {
  companyId: string;
  period: AnalyticsPeriod;
  metrics: AnalyticsMetric[];
  start: Date;
  end: Date;
}) => {
  const db = await getDbClient();
  const catalog = await db.query<{
    id: string;
    company_name: string;
    metric_views: number;
    metric_likes: number;
    metric_comments: number;
    metric_shares: number;
    views_count: number | null;
    likes_count: number | null;
    comments_count: number | null;
    shares_count: number | null;
  }>(
    `SELECT
       rc.id,
       rc.company_name,
       rc.metric_views,
       rc.metric_likes,
       rc.metric_comments,
       rc.metric_shares,
       rem.views_count,
       rem.likes_count,
       rem.comments_count,
       rem.shares_count
     FROM report_catalog rc
     LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
     WHERE rc.company_id = $1`,
    [companyId]
  );

  const companyRows = catalog.rows;
  const companyName = companyRows[0]?.company_name ?? companyId;
  if (!companyRows.length) {
    return buildEmptyAnalyticsResponse(companyId, companyName, period, metrics, start, end);
  }

  const buckets = enumerateBuckets(period, start, end).map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    startDate: bucket.start.toISOString().slice(0, 10),
    endDate: bucket.end.toISOString().slice(0, 10),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    reports: 0,
    total: 0
  }));
  const pointsByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const touchedReportsByBucket = new Map<string, Set<string>>();

  const activityRows = await db.query<{ occurred_at: string; metric: AnalyticsMetric; count: number; report_id: string }>(
    `SELECT occurred_at, 'views' AS metric, COUNT(*) AS count, report_catalog_id AS report_id
       FROM report_engagement_events
      WHERE action = 'view'
        AND occurred_at >= $1
        AND occurred_at <= $2
        AND report_catalog_id IN (SELECT id FROM report_catalog WHERE company_id = $3)
      GROUP BY occurred_at, report_catalog_id
     UNION ALL
     SELECT created_at AS occurred_at, 'likes' AS metric, COUNT(*) AS count, report_catalog_id AS report_id
       FROM report_likes
      WHERE created_at >= $1
        AND created_at <= $2
        AND report_catalog_id IN (SELECT id FROM report_catalog WHERE company_id = $3)
      GROUP BY created_at, report_catalog_id
     UNION ALL
     SELECT created_at AS occurred_at, 'comments' AS metric, COUNT(*) AS count, report_catalog_id AS report_id
       FROM report_comments
      WHERE created_at >= $1
        AND created_at <= $2
        AND report_catalog_id IN (SELECT id FROM report_catalog WHERE company_id = $3)
      GROUP BY created_at, report_catalog_id
     UNION ALL
     SELECT created_at AS occurred_at, 'shares' AS metric, COUNT(*) AS count, report_catalog_id AS report_id
       FROM report_shares
      WHERE created_at >= $1
        AND created_at <= $2
        AND report_catalog_id IN (SELECT id FROM report_catalog WHERE company_id = $3)
      GROUP BY created_at, report_catalog_id`,
    [start.toISOString(), end.toISOString(), companyId]
  );

  for (const row of activityRows.rows) {
    const occurredAt = new Date(row.occurred_at);
    if (Number.isNaN(occurredAt.getTime())) continue;
    const bucketKey = getBucketKey(period, start, end, occurredAt);
    const point = pointsByKey.get(bucketKey);
    if (!point) continue;
    point[row.metric] += Number(row.count ?? 0);

    const touched = touchedReportsByBucket.get(bucketKey) ?? new Set<string>();
    touched.add(row.report_id);
    touchedReportsByBucket.set(bucketKey, touched);
    point.reports = touched.size;
  }

  const points = Array.from(pointsByKey.values()).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const hasActivity = activityRows.rows.length > 0;

  if (hasActivity) {
    const running = { views: 0, likes: 0, comments: 0, shares: 0 };
    for (const point of points) {
      running.views += point.views;
      running.likes += point.likes;
      running.comments += point.comments;
      running.shares += point.shares;
      point.views = running.views;
      point.likes = running.likes;
      point.comments = running.comments;
      point.shares = running.shares;
      point.total = point.views + point.likes + point.comments + point.shares;
    }
  }

  const currentTotals = companyRows.reduce(
    (acc, row) => ({
      views: acc.views + Number(row.views_count ?? row.metric_views ?? 0),
      likes: acc.likes + Number(row.likes_count ?? row.metric_likes ?? 0),
      comments: acc.comments + Number(row.comments_count ?? row.metric_comments ?? 0),
      shares: acc.shares + Number(row.shares_count ?? row.metric_shares ?? 0),
      reports: acc.reports + 1
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, reports: 0 }
  );

  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (hasActivity) {
      lastPoint.views = Math.max(lastPoint.views, currentTotals.views);
      lastPoint.likes = Math.max(lastPoint.likes, currentTotals.likes);
      lastPoint.comments = Math.max(lastPoint.comments, currentTotals.comments);
      lastPoint.shares = Math.max(lastPoint.shares, currentTotals.shares);
      lastPoint.total = lastPoint.views + lastPoint.likes + lastPoint.comments + lastPoint.shares;
      lastPoint.reports = Math.max(lastPoint.reports, currentTotals.reports);
    } else {
      lastPoint.views = currentTotals.views;
      lastPoint.likes = currentTotals.likes;
      lastPoint.comments = currentTotals.comments;
      lastPoint.shares = currentTotals.shares;
      lastPoint.total = lastPoint.views + lastPoint.likes + lastPoint.comments + lastPoint.shares;
      lastPoint.reports = currentTotals.reports;
    }
  }

  return {
    companyId,
    companyName,
    period,
    metrics,
    range: {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10)
    },
    totals: currentTotals,
    points
  };
};

reportRoutes.post("/ingest", authMiddleware, async (_req, res) => {
  const summary = await reportIngestionService.ingestAll();
  res.json(summary);
});

reportRoutes.get("/", authMiddleware, async (_req, res) => {
  const reports = await reportIngestionService.listReports();
  res.json({ reports });
});

reportRoutes.post("/structure/preview", authMiddleware, async (req, res) => {
  try {
    const rows = frontReportStructureService.buildStructuredJson(req.body);
    res.json({ total: rows.length, rows });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid payload", details: error.flatten() });
      return;
    }
    throw error;
  }
});

reportRoutes.post("/structure/sync", authMiddleware, async (req, res) => {
  try {
    const result = await frontReportStructureService.syncToDatabase(req.body);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid payload", details: error.flatten() });
      return;
    }
    throw error;
  }
});

reportRoutes.get("/structure/catalog/list", async (_req, res) => {
  const items = await frontReportStructureService.listCatalog(200);
  res.json({ total: items.length, items });
});

reportRoutes.get("/mine", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await reportCatalogService.listReportsSubmittedByUser(userId, 1000);
  res.json({ total: items.length, items });
});

reportRoutes.get("/shared", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const shared = await reportEngagementService.listSharedReports(userId);
  res.json(shared);
});

reportRoutes.get("/structure/catalog/by-hierarchy", async (req, res) => {
  const items = await frontReportStructureService.listCatalogByHierarchy({
    companyId: typeof req.query["companyId"] === "string" ? req.query["companyId"] : undefined,
    superintendenceId: typeof req.query["superintendenceId"] === "string" ? req.query["superintendenceId"] : undefined,
    managementId: typeof req.query["managementId"] === "string" ? req.query["managementId"] : undefined,
    projectId: typeof req.query["projectId"] === "string" ? req.query["projectId"] : undefined,
    indicatorTerm: typeof req.query["indicatorTerm"] === "string" ? req.query["indicatorTerm"] : undefined,
    limit: typeof req.query["limit"] === "string" ? Number(req.query["limit"]) : undefined
  });
  res.json({ total: items.length, items });
});

const approvalDecisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  comments: z.string().optional(),
  approverId: z.string().min(1),
  approverName: z.string().min(1)
});

reportRoutes.get("/catalog/search-files", async (req, res) => {
  const companyId = typeof req.query["companyId"] === "string" ? req.query["companyId"] : undefined;
  if (!companyId) {
    res.status(400).json({ error: "companyId is required" });
    return;
  }

  const query = typeof req.query["q"] === "string" ? req.query["q"] : "";
  const rawLimit = typeof req.query["limit"] === "string" ? Number(req.query["limit"]) : 3;
  const limit = Number.isFinite(rawLimit) ? rawLimit : 3;

  const items = await reportCatalogFileQueryService.searchByCompany({
    companyId,
    query,
    limit
  });

  res.json({ total: items.length, items });
});

reportRoutes.get("/upload-form/config", async (_req, res) => {
  const indicators = await reportCatalogService.listKnownIndicators();
  res.json({
    fields: [
      { key: "reportName", required: true, type: "text" },
      { key: "reportDescription", required: false, type: "text" },
      { key: "reportDate", required: false, type: "date" },
      { key: "reportSizeLabel", required: false, type: "text" },
      { key: "reportUrl", required: true, type: "url" },
      { key: "companyId", required: true, type: "text" },
      { key: "companyName", required: true, type: "text" },
      { key: "superintendenceId", required: true, type: "text" },
      { key: "superintendenceName", required: true, type: "text" },
      { key: "managementId", required: false, type: "text" },
      { key: "managementName", required: false, type: "text" },
      { key: "projectId", required: false, type: "text" },
      { key: "projectName", required: false, type: "text" },
      { key: "indicators", required: true, type: "array<object>" }
    ],
    suggestions: { indicators }
  });
});

reportRoutes.get("/utd/drafts/current", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const projectId = typeof req.query["projectId"] === "string" ? req.query["projectId"] : undefined;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const draft = await utdFlowService.getDraft({ userId, projectId });
  res.json({ item: draft });
});

reportRoutes.put("/utd/drafts/current", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const parsed = utdDraftSchema.parse(req.body);
    await utdFlowService.upsertDraft({
      userId,
      ...parsed,
    });
    res.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid payload", details: error.flatten() });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

reportRoutes.delete("/utd/drafts/current", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  const projectId = typeof req.query["projectId"] === "string" ? req.query["projectId"] : undefined;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await utdFlowService.deleteDraft({ userId, projectId });
  res.json({ success: true });
});

reportRoutes.post("/submit", async (req: AuthenticatedRequest, res) => {
  try {
    const optionalUser = tryGetAuthenticatedUser(req);
    const created = await reportCatalogService.submitReport(req.body, optionalUser?.userId);
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid payload", details: error.flatten() });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

reportRoutes.get("/approvals/pending", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const approverId = req.user?.userId;
  if (!approverId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const items = await reportApprovalService.listPending({ approverId });
  res.json({ total: items.length, items });
});

reportRoutes.get("/approvals/history", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const approverId = req.user?.userId;
  if (!approverId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const limitRaw = Number(req.query["limit"] ?? 100);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(300, Math.floor(limitRaw))) : 100;
  const items = await reportApprovalService.listHistory(limit, approverId);
  res.json({ total: items.length, items });
});

reportRoutes.get("/approvals/stats", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const approverId = req.user?.userId;
  if (!approverId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const stats = await reportApprovalService.getStats(approverId);
  res.json(stats);
});

reportRoutes.post("/approvals/:id/decision", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const actor = req.user;
  if (!actor?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params as { id: string };
  const parsed = approvalDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  try {
    const actorRecord = await userManagementService.getUserById(actor.userId).catch(() => null);
    const actorName = actorRecord?.full_name ?? parsed.data.approverName;

    await reportApprovalService.decide({
      reportId: id,
      status: parsed.data.status,
      comments: parsed.data.comments,
      approverId: actor.userId,
      approverName: actorName
    });

    await superadminService.logAudit({
      userId: actor.userId,
      action: parsed.data.status === "approved" ? "approve" : "reject",
      entityType: "report_catalog",
      entityId: id,
      newValues: {
        ...parsed.data,
        approverId: actor.userId,
        approverName: actorName
      } as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    const stats = await reportApprovalService.getStats(actor.userId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(404).json({ error: (error as Error).message });
  }
});

reportRoutes.get("/workspace/manager", async (req, res) => {
  const summary = await reportApprovalService.getManagerSummary({
    approverId: typeof req.query["approverId"] === "string" ? req.query["approverId"] : undefined,
    actorKey: typeof req.query["actorKey"] === "string" ? req.query["actorKey"] : undefined
  });
  res.json(summary);
});

reportRoutes.post("/json/rebuild", async (_req, res) => {
  const result = await reportCatalogService.rebuildJsonFilesFromCatalog();
  const semantic = await reportCatalogSemanticSyncService.syncAllCatalogDocuments();
  res.json({ ...result, semantic });
});

reportRoutes.post("/catalog/sync-from-files", async (_req, res) => {
  const result = await reportCatalogService.syncCatalogFilesToDatabase();
  const semantic = await reportCatalogSemanticSyncService.syncAllCatalogDocuments();
  res.json({ ...result, semantic });
});

reportRoutes.post("/catalog/:id/engagement", async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = engagementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  if (parsed.data.action === "view") {
    const authenticatedUser = tryGetAuthenticatedUser(req);
    const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
    const gate = await reportEngagementService.maybeIncrementView(id, actorKey);
    const metrics = await reportEngagementService.get(id);
    res.json({ reportCatalogId: id, metrics, incremented: gate.incremented, reason: gate.reason ?? null });
    return;
  }
  if (parsed.data.action === "comment") {
    res.status(400).json({ error: "Use /api/reports/catalog/:id/comments to add comments with text." });
    return;
  }

  await reportEngagementService.increment(id, parsed.data.action, parsed.data.count ?? 1);
  const metrics = await reportEngagementService.get(id);
  res.json({ reportCatalogId: id, metrics });
});

reportRoutes.get("/analytics", async (req, res) => {
  const periodParsed = analyticsPeriodSchema.safeParse(req.query["periodo"] ?? req.query["period"] ?? "month");
  if (!periodParsed.success) {
    res.status(400).json({ error: "Invalid period" });
    return;
  }

  const rawMetrics = String(req.query["metrics"] ?? "views").split(",").map((item) => item.trim()).filter(Boolean);
  const metrics = rawMetrics
    .map((metric) => analyticsMetricSchema.safeParse(metric))
    .filter((result): result is { success: true; data: AnalyticsMetric } => result.success)
    .map((result) => result.data);

  if (!metrics.length) {
    res.status(400).json({ error: "Select at least one valid metric" });
    return;
  }

  const companyId = typeof req.query["empresa"] === "string"
    ? req.query["empresa"]
    : typeof req.query["companyId"] === "string"
      ? req.query["companyId"]
      : "";

  if (!companyId) {
    res.status(400).json({ error: "Company is required" });
    return;
  }

  const sourceReportId = typeof req.query["sourceReportId"] === "string" ? req.query["sourceReportId"] : undefined;
  const reportName = typeof req.query["reportName"] === "string" ? req.query["reportName"] : undefined;

  const requestedEndDate = typeof req.query["endDate"] === "string" ? req.query["endDate"] : undefined;
  const anchorDate = parseValidDate(requestedEndDate, new Date());
  const period = periodParsed.data;
  const { start, end } = getRangeBounds(
    period,
    anchorDate,
    typeof req.query["startDate"] === "string" ? req.query["startDate"] : undefined,
    requestedEndDate
  );

  if (sourceReportId) {
    const catalogId = await resolveCatalogIdWithSync(sourceReportId, reportName);
    if (!catalogId) {
      res.status(404).json({ error: "Report source not found" });
      return;
    }

    const response = await buildReportAnalytics({
      catalogId,
      companyId,
      period,
      metrics,
      start,
      end
    });
    res.json(response);
    return;
  }

  const response = await buildCompanyAnalytics({
    companyId,
    period,
    metrics,
    start,
    end
  });

  res.json(response);
});

reportRoutes.get("/catalog/:id/engagement", async (req, res) => {
  const { id } = req.params as { id: string };
  const metrics = await reportEngagementService.get(id);
  res.json({ reportCatalogId: id, metrics });
});

reportRoutes.post("/catalog/by-source/:sourceId/engagement", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const parsed = engagementSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const catalogId = await resolveCatalogIdWithSync(sourceId, parsed.data.reportName);
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  if (parsed.data.action === "view") {
    const authenticatedUser = tryGetAuthenticatedUser(req);
    const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
    const gate = await reportEngagementService.maybeIncrementView(catalogId, actorKey);
    const metrics = await reportEngagementService.get(catalogId);
    res.json({ reportCatalogId: catalogId, sourceReportId: sourceId, metrics, incremented: gate.incremented, reason: gate.reason ?? null });
    return;
  }
  if (parsed.data.action === "comment") {
    res.status(400).json({ error: "Use /api/reports/catalog/by-source/:sourceId/comments to add comments with text." });
    return;
  }
  await reportEngagementService.increment(catalogId, parsed.data.action, parsed.data.count ?? 1);
  const metrics = await reportEngagementService.get(catalogId);
  res.json({ reportCatalogId: catalogId, sourceReportId: sourceId, metrics });
});

reportRoutes.get("/catalog/by-source/:sourceId/engagement", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const reportName = typeof req.query["reportName"] === "string" ? req.query["reportName"] : undefined;
  const catalogId = await resolveCatalogIdWithSync(sourceId, reportName);
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  const metrics = await reportEngagementService.get(catalogId);
  res.json({ reportCatalogId: catalogId, sourceReportId: sourceId, metrics });
});

reportRoutes.post("/catalog/:id/comments", async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const authenticatedUser = tryGetAuthenticatedUser(req);
  const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
  await reportEngagementService.addComment({
    reportCatalogId: id,
    actorKey,
    message: parsed.data.message,
    userId: authenticatedUser?.userId ?? parsed.data.userId,
    parentCommentId: parsed.data.parentCommentId
  });
  const metrics = await reportEngagementService.get(id);
  res.status(201).json({ reportCatalogId: id, metrics });
});

reportRoutes.get("/catalog/:id/comments/tree", async (req, res) => {
  const { id } = req.params as { id: string };
  const limitRaw = Number(req.query["limit"] ?? 200);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 200;
  const comments = await reportEngagementService.listCommentsTree(id, limit);
  res.json({ reportCatalogId: id, total: comments.length, comments });
});

reportRoutes.get("/catalog/:id/comments", async (req, res) => {
  const { id } = req.params as { id: string };
  const limitRaw = Number(req.query["limit"] ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 50;
  const comments = await reportEngagementService.listComments(id, limit);
  res.json({ reportCatalogId: id, total: comments.length, comments });
});

reportRoutes.post("/catalog/:id/likes/toggle", async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = likeToggleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const authenticatedUser = tryGetAuthenticatedUser(req);
  const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
  const result = await reportEngagementService.toggleLike(id, actorKey, authenticatedUser?.userId ?? parsed.data.userId ?? null);
  const metrics = await reportEngagementService.get(id);
  res.json({ reportCatalogId: id, liked: result.liked, metrics });
});

reportRoutes.get("/catalog/share-targets", authMiddleware, async (req, res) => {
  const limitRaw = Number(req.query["limit"] ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;
  const users = await reportEngagementService.listShareTargets(limit);
  res.json({ total: users.length, users });
});

reportRoutes.post("/catalog/:id/shares", async (req, res) => {
  const { id } = req.params as { id: string };
  const parsed = shareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const authenticatedUser = tryGetAuthenticatedUser(req);
  const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
  const created = await reportEngagementService.shareReport({
    reportCatalogId: id,
    actorKey,
    senderUserId: authenticatedUser?.userId ?? parsed.data.userId ?? null,
    recipients: parsed.data.recipients
  });
  const metrics = await reportEngagementService.get(id);
  res.status(201).json({ reportCatalogId: id, created: created.created, metrics });
});

reportRoutes.post("/catalog/by-source/:sourceId/comments", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const catalogId = await resolveCatalogIdWithSync(sourceId, String((req.body as Record<string, unknown>)["reportName"] ?? ""));
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  const authenticatedUser = tryGetAuthenticatedUser(req);
  const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
  await reportEngagementService.addComment({
    reportCatalogId: catalogId,
    actorKey,
    message: parsed.data.message,
    userId: authenticatedUser?.userId ?? parsed.data.userId,
    parentCommentId: parsed.data.parentCommentId
  });
  const metrics = await reportEngagementService.get(catalogId);
  res.status(201).json({ reportCatalogId: catalogId, sourceReportId: sourceId, metrics });
});

reportRoutes.get("/catalog/by-source/:sourceId/comments", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const reportName = typeof req.query["reportName"] === "string" ? req.query["reportName"] : undefined;
  const catalogId = await resolveCatalogIdWithSync(sourceId, reportName);
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  const limitRaw = Number(req.query["limit"] ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 50;
  const comments = await reportEngagementService.listComments(catalogId, limit);
  res.json({ reportCatalogId: catalogId, sourceReportId: sourceId, total: comments.length, comments });
});

reportRoutes.get("/catalog/by-source/:sourceId/comments/tree", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const reportName = typeof req.query["reportName"] === "string" ? req.query["reportName"] : undefined;
  const catalogId = await resolveCatalogIdWithSync(sourceId, reportName);
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  const limitRaw = Number(req.query["limit"] ?? 200);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, Math.floor(limitRaw))) : 200;
  const comments = await reportEngagementService.listCommentsTree(catalogId, limit);
  res.json({ reportCatalogId: catalogId, sourceReportId: sourceId, total: comments.length, comments });
});

reportRoutes.post("/catalog/by-source/:sourceId/likes/toggle", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const parsed = likeToggleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const catalogId = await resolveCatalogIdWithSync(sourceId, parsed.data.reportName);
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  const authenticatedUser = tryGetAuthenticatedUser(req);
  const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
  const result = await reportEngagementService.toggleLike(catalogId, actorKey, authenticatedUser?.userId ?? parsed.data.userId ?? null);
  const metrics = await reportEngagementService.get(catalogId);
  res.json({ reportCatalogId: catalogId, sourceReportId: sourceId, liked: result.liked, metrics });
});

reportRoutes.post("/catalog/by-source/:sourceId/shares", async (req, res) => {
  const { sourceId } = req.params as { sourceId: string };
  const parsed = shareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }
  const catalogId = await resolveCatalogIdWithSync(sourceId, parsed.data.reportName);
  if (!catalogId) {
    res.status(404).json({ error: "Report source not found" });
    return;
  }
  const authenticatedUser = tryGetAuthenticatedUser(req);
  const actorKey = resolveActorKey(req, authenticatedUser, parsed.data);
  const created = await reportEngagementService.shareReport({
    reportCatalogId: catalogId,
    actorKey,
    senderUserId: authenticatedUser?.userId ?? parsed.data.userId ?? null,
    recipients: parsed.data.recipients
  });
  const metrics = await reportEngagementService.get(catalogId);
  res.status(201).json({ reportCatalogId: catalogId, sourceReportId: sourceId, created: created.created, metrics });
});

reportRoutes.delete("/catalog/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const actor = req.user;
    if (!actor?.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const currentUser = await userManagementService.getUserById(actor.userId);
    const canDelete =
      isSuperadminEmail(actor.email) ||
      Boolean(currentUser?.roles?.includes("superadmin")) ||
      canDeleteReportsByJobTitle(currentUser?.job_title);

    if (!canDelete) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!reportId) {
      res.status(400).json({ error: "Report id is required" });
      return;
    }

    const deleted = await superadminService.deleteReportByCatalogId(reportId);
    await superadminService.logAudit({
      userId: actor.userId,
      action: "delete",
      entityType: "report_catalog",
      entityId: deleted.id,
      oldValues: deleted,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    res.json({ success: true, deleted });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

reportRoutes.get("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params as { id: string };
  const report = await reportIngestionService.getReportById(id);
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json({ report });
});


