import { Router } from "express";
import { z } from "zod";
import { getDbClient } from "../db/connection";
import { fromDbArray } from "../db/providerUtils";
import { AuthenticatedRequest, authMiddleware } from "../middleware/auth";
import { reportCatalogService } from "../services/reportCatalogService";
import { canUserAccessHierarchy } from "../services/reportVisibilityService";
import { rerankService } from "../services/rerankService";
import { userManagementService } from "../services/userManagementService";
import { vectorSearchService } from "../services/vectorSearchService";

const vectorSchema = z.object({
  query: z.string().min(1),
  topK: z.coerce.number().int().min(1).max(20).optional()
});

const catalogSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).optional()
});

type CatalogRow = {
  source_report_id: string;
  report_name: string;
  report_description: string | null;
  report_date: string | null;
  company_id: string;
  company_name: string;
  superintendence_id: string;
  superintendence_name: string;
  management_id: string;
  management_name: string;
  project_id: string;
  project_name: string;
  indicator_name: string | null;
  indicator_names: unknown;
  path: unknown;
};

const normalize = (value?: string | null) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const scoreText = (haystack: string, needle: string) => {
  if (!haystack || !needle) return 0;
  if (haystack === needle) return 100;
  if (haystack.startsWith(needle)) return 60;
  if (haystack.includes(needle)) return 30;
  return 0;
};

const buildFtsQuery = (value: string): string =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => `${token}*`)
    .join(" AND ");

export const searchRoutes = Router();

searchRoutes.post("/", authMiddleware, async (req, res) => {
  const parsed = vectorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  const { query, topK } = parsed.data;
  const search = await vectorSearchService.search(query, topK ?? 8);
  const reranked = rerankService.rerank(query, search.results);

  res.json({
    query,
    total: reranked.length,
    results: reranked
  });
});

searchRoutes.get("/catalog", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const parsed = catalogSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
    return;
  }

  const user = req.user ? await userManagementService.getUserById(req.user.userId).catch(() => null) : null;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const needle = normalize(parsed.data.q);
  const limit = parsed.data.limit ?? 8;
  const db = await getDbClient();
  const ftsQuery = buildFtsQuery(parsed.data.q);
  let rows: CatalogRow[] = [];

  if (ftsQuery) {
    try {
      const result = await db.query<CatalogRow & { rank: number }>(
        `SELECT
          rc.source_report_id,
          rc.report_name,
          rc.report_description,
          rc.report_date,
          rc.company_id,
          rc.company_name,
          rc.superintendence_id,
          rc.superintendence_name,
          rc.management_id,
          rc.management_name,
          rc.project_id,
          rc.project_name,
          rc.indicator_name,
          rc.indicator_names,
          rc.path,
          bm25(report_catalog_fts) AS rank
         FROM report_catalog_fts
         INNER JOIN report_catalog rc
           ON rc.source_report_id = report_catalog_fts.source_report_id
         WHERE report_catalog_fts MATCH $1
           AND rc.report_status = $2
         ORDER BY rank ASC, rc.report_date DESC, rc.updated_at DESC, rc.created_at DESC
         LIMIT $3`,
        [ftsQuery, "approved", Math.max(limit * 8, 40)]
      );
      rows = result.rows;
    } catch {
      rows = [];
    }
  }

  if (rows.length === 0) {
    const fallbackRows = await reportCatalogService.searchReportsByText(parsed.data.q, Math.max(limit * 6, 24));
    rows = fallbackRows.map((row) => ({
      source_report_id: row.source_report_id,
      report_name: row.report_name,
      report_description: row.report_description ?? "",
      report_date: row.report_date,
      company_id: row.company_id,
      company_name: row.company_name,
      superintendence_id: row.superintendence_id,
      superintendence_name: row.superintendence_name,
      management_id: row.management_id,
      management_name: row.management_name,
      project_id: row.project_id,
      project_name: row.project_name,
      indicator_name: row.indicator_names[0] ?? null,
      indicator_names: row.indicator_names,
      path: row.path
    }));
  }

  const visibleRows = rows.filter((row) =>
    canUserAccessHierarchy(user, {
      companyId: row.company_id,
      companyName: row.company_name,
      superintendenceId: row.superintendence_id,
      superintendenceName: row.superintendence_name,
      managementId: row.management_id,
      managementName: row.management_name,
      projectId: row.project_id,
      projectName: row.project_name
    })
  );

  const items = visibleRows
    .flatMap((row) => {
      const indicatorNames = fromDbArray(row.indicator_names);
      const path = fromDbArray(row.path);
      const reportSearchText = normalize(
        [
          row.report_name,
          row.report_description,
          row.company_name,
          row.superintendence_name,
          row.management_name,
          row.project_name,
          ...indicatorNames
        ].join(" ")
      );
      const reportScore = scoreText(reportSearchText, needle);
      const reportItems =
        reportScore > 0
          ? [
              {
                type: "report" as const,
                sourceReportId: row.source_report_id,
                reportName: row.report_name,
                reportDescription: row.report_description ?? "",
                reportDate: row.report_date,
                companyId: row.company_id,
                companyName: row.company_name,
                superintendenceId: row.superintendence_id,
                superintendenceName: row.superintendence_name,
                managementId: row.management_id,
                managementName: row.management_name,
                projectId: row.project_id,
                projectName: row.project_name,
                indicatorNames,
                path,
                score: reportScore
              }
            ]
          : [];

      const indicatorItems = indicatorNames
        .map((indicatorName) => {
          const indicatorScore = scoreText(normalize(indicatorName), needle);
          if (indicatorScore <= 0) return null;
          return {
            type: "indicator" as const,
            sourceReportId: row.source_report_id,
            reportName: row.report_name,
            reportDescription: row.report_description ?? "",
            reportDate: row.report_date,
            companyId: row.company_id,
            companyName: row.company_name,
            superintendenceId: row.superintendence_id,
            superintendenceName: row.superintendence_name,
            managementId: row.management_id,
            managementName: row.management_name,
            projectId: row.project_id,
            projectName: row.project_name,
            indicatorName,
            indicatorNames,
            path,
            score: indicatorScore + 20
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      return [...reportItems, ...indicatorItems];
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return String(right.reportDate ?? "").localeCompare(String(left.reportDate ?? ""));
    })
    .slice(0, limit);

  res.json({
    query: parsed.data.q,
    total: items.length,
    items
  });
});
