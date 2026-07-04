import { z } from "zod";
import { randomUUID } from "crypto";
import { getDbClient } from "../db/connection";
import { clearCorporateHierarchyChildren, normalizeCoelbaHierarchy } from "../data/coelbaHierarchyRules";
import { fromDbArray, toDbArray } from "../db/providerUtils";
import { reportJsonFileService } from "./reportJsonFileService";
import { reportEngagementService } from "./reportEngagementService";
import { cacheService } from "./cacheService";
import { reportCatalogSemanticSyncService } from "./reportCatalogSemanticSyncService";

const metricsSchema = z.object({
  views: z.number().int().nonnegative().default(0),
  comments: z.number().int().nonnegative().default(0),
  likes: z.number().int().nonnegative().default(0),
  shares: z.number().int().nonnegative().default(0)
});

const reportSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  date: z.string().optional().default(""),
  size: z.string().optional().default(""),
  description: z.string().optional().default(""),
  url: z.string().optional(),
  metrics: metricsSchema.default({ views: 0, comments: 0, likes: 0, shares: 0 })
});

const indicatorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  value: z.string().optional().default(""),
  unit: z.string().optional().default(""),
  trend: z.string().optional().default("stable"),
  reports: z.array(reportSchema).default([])
});

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  indicators: z.array(indicatorSchema).default([])
});

const managementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  projects: z.array(projectSchema).default([])
});

const superintendenceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  managements: z.array(managementSchema).default([])
});

const companySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  superintendences: z.array(superintendenceSchema).default([])
});

const payloadSchema = z.object({
  companies: z.array(companySchema).min(1)
});

const parseSizeToBytes = (sizeLabel: string): number => {
  const match = sizeLabel.trim().match(/^([\d.,]+)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  const value = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();
  if (Number.isNaN(value)) return 0;
  const map: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024
  };
  return Math.round(value * (map[unit] ?? 1));
};

const normalizeDate = (date: string): string | null => {
  if (!date?.trim()) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export interface StructuredReportRow {
  sourceReportId: string;
  reportName: string;
  reportDescription: string;
  reportDate: string | null;
  reportSizeLabel: string;
  reportSizeBytes: number;
  reportUrl: string | null;
  companyId: string;
  companyName: string;
  superintendenceId: string;
  superintendenceName: string;
  managementId: string;
  managementName: string;
  projectId: string;
  projectName: string;
  indicatorId: string;
  indicatorName: string;
  indicatorValue: string;
  indicatorUnit: string;
  indicatorTrend: string;
  metricViews: number;
  metricComments: number;
  metricLikes: number;
  metricShares: number;
  path: string[];
  rawJson: Record<string, unknown>;
}

const flatten = (payload: z.infer<typeof payloadSchema>): StructuredReportRow[] => {
  const rows: StructuredReportRow[] = [];
  payload.companies.forEach((company) => {
    company.superintendences.forEach((sup) => {
      sup.managements.forEach((management) => {
        management.projects.forEach((project) => {
          project.indicators.forEach((indicator) => {
            indicator.reports.forEach((report) => {
              rows.push({
                sourceReportId: report.id,
                reportName: report.name,
                reportDescription: report.description ?? "",
                reportDate: normalizeDate(report.date ?? ""),
                reportSizeLabel: report.size ?? "",
                reportSizeBytes: parseSizeToBytes(report.size ?? ""),
                reportUrl: report.url ?? null,
                companyId: company.id,
                companyName: company.name,
                superintendenceId: sup.id,
                superintendenceName: sup.name,
                managementId: management.id,
                managementName: management.name,
                projectId: project.id,
                projectName: project.name,
                indicatorId: indicator.id,
                indicatorName: indicator.name,
                indicatorValue: indicator.value ?? "",
                indicatorUnit: indicator.unit ?? "",
                indicatorTrend: indicator.trend ?? "stable",
                metricViews: report.metrics.views ?? 0,
                metricComments: report.metrics.comments ?? 0,
                metricLikes: report.metrics.likes ?? 0,
                metricShares: report.metrics.shares ?? 0,
                path: [company.name, sup.name, management.name, project.name, indicator.name, report.name],
                rawJson: report as Record<string, unknown>
              });
            });
          });
        });
      });
    });
  });
  return rows;
};

export const frontReportStructureService = {
  validatePayload(payload: unknown) {
    return payloadSchema.parse(payload);
  },

  buildStructuredJson(payload: unknown): StructuredReportRow[] {
    const parsed = this.validatePayload(payload);
    return flatten(parsed);
  },

  async syncToDatabase(payload: unknown): Promise<{ upserted: number }> {
    const db = await getDbClient();
    const rows = this.buildStructuredJson(payload);
    const semanticFiles: Array<{ fullPath: string; reportCatalogId?: string }> = [];

    for (const row of rows) {
      let reportCatalogId: string | undefined;
      const existing = await db.query<{ id: string }>(
        "SELECT id FROM report_catalog WHERE source_report_id = $1 LIMIT 1",
        [row.sourceReportId]
      );
      if (existing.rows[0]) {
        reportCatalogId = existing.rows[0].id;
        await db.query(
          `UPDATE report_catalog
           SET report_name = $2, report_description = $3, report_date = $4, report_size_label = $5, report_size_bytes = $6, report_url = $7,
               company_id = $8, company_name = $9, superintendence_id = $10, superintendence_name = $11, management_id = $12, management_name = $13,
               project_id = $14, project_name = $15, indicator_id = $16, indicator_name = $17, indicator_ids = $18, indicator_names = $19,
               indicator_value = $20, indicator_unit = $21, indicator_trend = $22, report_status = $23, path = $24, raw_json = $25, updated_at = NOW()
           WHERE id = $1`,
          [
            reportCatalogId,
            row.reportName,
            row.reportDescription,
            row.reportDate,
            row.reportSizeLabel,
            row.reportSizeBytes,
            row.reportUrl,
            row.companyId,
            row.companyName,
            row.superintendenceId,
            row.superintendenceName,
            row.managementId,
            row.managementName,
            row.projectId,
            row.projectName,
            row.indicatorId,
            row.indicatorName,
            toDbArray(db, [row.indicatorId]),
            toDbArray(db, [row.indicatorName]),
            row.indicatorValue,
            row.indicatorUnit,
            row.indicatorTrend,
            "approved",
            toDbArray(db, row.path),
            JSON.stringify(row.rawJson)
          ]
        );
      } else {
        reportCatalogId = randomUUID();
        await db.query(
          `INSERT INTO report_catalog (
            id, source_report_id, report_status, report_name, report_description, report_date, report_size_label, report_size_bytes, report_url,
            company_id, company_name, superintendence_id, superintendence_name, management_id, management_name,
            project_id, project_name, indicator_id, indicator_name, indicator_ids, indicator_names, indicator_value, indicator_unit, indicator_trend,
            metric_views, metric_comments, metric_likes, metric_shares, path, raw_json, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24,
            $25, $26, $27, $28, $29, $30, NOW()
          )`,
          [
            reportCatalogId,
            row.sourceReportId,
            "approved",
            row.reportName,
            row.reportDescription,
            row.reportDate,
            row.reportSizeLabel,
            row.reportSizeBytes,
            row.reportUrl,
            row.companyId,
            row.companyName,
            row.superintendenceId,
            row.superintendenceName,
            row.managementId,
            row.managementName,
            row.projectId,
            row.projectName,
            row.indicatorId,
            row.indicatorName,
            toDbArray(db, [row.indicatorId]),
            toDbArray(db, [row.indicatorName]),
            row.indicatorValue,
            row.indicatorUnit,
            row.indicatorTrend,
            row.metricViews,
            row.metricComments,
            row.metricLikes,
            row.metricShares,
            toDbArray(db, row.path),
            JSON.stringify(row.rawJson)
          ]
        );
      }
      if (reportCatalogId) {
        await reportEngagementService.upsertFromInitial(reportCatalogId, {
          views: row.metricViews,
          likes: row.metricLikes,
          comments: row.metricComments,
          shares: row.metricShares
        });
      }

      const fullPath = await reportJsonFileService.writeReportJson({
        sourceReportId: row.sourceReportId,
        reportName: row.reportName,
        reportDescription: row.reportDescription,
        reportDate: row.reportDate,
        reportSizeLabel: row.reportSizeLabel,
        reportSizeBytes: row.reportSizeBytes,
        reportUrl: row.reportUrl,
        companyId: row.companyId,
        companyName: row.companyName,
        superintendenceId: row.superintendenceId,
        superintendenceName: row.superintendenceName,
        managementId: row.managementId,
        managementName: row.managementName,
        projectId: row.projectId,
        projectName: row.projectName,
        indicators: [
          {
            id: row.indicatorId,
            name: row.indicatorName,
            value: row.indicatorValue,
            unit: row.indicatorUnit,
            trend: row.indicatorTrend
          }
        ],
        metrics: {
          views: row.metricViews,
          comments: row.metricComments,
          likes: row.metricLikes,
          shares: row.metricShares
        },
        path: row.path,
        rawJson: row.rawJson
      });
      if (reportCatalogId) {
        semanticFiles.push({ fullPath, reportCatalogId });
      }
    }

    for (const item of semanticFiles) {
      await reportCatalogSemanticSyncService.syncCatalogDocumentFile({
        fullPath: item.fullPath,
        reportCatalogId: item.reportCatalogId,
        clearSemanticCache: false,
      });
    }

    if (semanticFiles.length > 0) {
      await cacheService.clear();
    }
    return { upserted: rows.length };
  },

  async listCatalog(limit = 100): Promise<Array<Record<string, unknown>>> {
    const db = await getDbClient();
    const result = await db.query(
      `SELECT
         rc.id,
         rc.source_report_id,
         rc.report_status,
         rc.report_name,
         rc.report_description,
         rc.report_date,
         rc.company_name,
         rc.indicator_names,
         rc.report_size_label,
         rc.report_url,
         COALESCE(rem.views_count, rc.metric_views) AS metric_views,
         COALESCE(rem.likes_count, rc.metric_likes) AS metric_likes,
         COALESCE(rem.comments_count, rc.metric_comments) AS metric_comments,
         COALESCE(rem.shares_count, rc.metric_shares) AS metric_shares
       FROM report_catalog rc
       LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
       ORDER BY rc.report_date DESC NULLS LAST, rc.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows as Array<Record<string, unknown>>;
  },

  async listCatalogByHierarchy(filters: {
    companyId?: string;
    superintendenceId?: string;
    managementId?: string;
    projectId?: string;
    indicatorTerm?: string;
    limit?: number;
  }): Promise<Array<Record<string, unknown>>> {
    const db = await getDbClient();
    const rawLimit = Number(filters.limit ?? 200);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, Math.floor(rawLimit))) : 200;

    const result = await db.query(
       `SELECT
         rc.id,
         rc.source_report_id,
         rc.report_status,
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
         rc.indicator_value,
         rc.indicator_unit,
         rc.indicator_trend,
         rc.indicator_ids,
         rc.indicator_names,
         rc.path,
         COALESCE(rem.views_count, rc.metric_views) AS metric_views,
         COALESCE(rem.likes_count, rc.metric_likes) AS metric_likes,
         COALESCE(rem.comments_count, rc.metric_comments) AS metric_comments,
         COALESCE(rem.shares_count, rc.metric_shares) AS metric_shares
       FROM report_catalog rc
       LEFT JOIN report_engagement_metrics rem ON rem.report_catalog_id = rc.id
       ORDER BY rc.report_date DESC NULLS LAST, rc.created_at DESC
       LIMIT $1`,
      [limit]
    );

    const n = (value: unknown): string =>
      String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const indicatorNeedle = n(filters.indicatorTerm);
    const normalizedRows: Array<Record<string, unknown>> = (result.rows as Array<Record<string, unknown>>).map((row) => {
      const normalized = clearCorporateHierarchyChildren(
        normalizeCoelbaHierarchy({
          companyId: String(row.company_id ?? ""),
          companyName: String(row.company_name ?? ""),
          superintendenceId: String(row.superintendence_id ?? ""),
          superintendenceName: String(row.superintendence_name ?? ""),
          managementId: String(row.management_id ?? ""),
          managementName: String(row.management_name ?? ""),
          projectId: String(row.project_id ?? ""),
          projectName: String(row.project_name ?? ""),
        })
      );

      const path = [
        normalized.companyName ?? row.company_name,
        normalized.superintendenceName ?? row.superintendence_name,
        normalized.managementName ?? row.management_name,
        normalized.projectName ?? row.project_name,
        row.report_name,
      ].filter(Boolean);

      return {
        ...row,
        company_id: normalized.companyId ?? row.company_id,
        company_name: normalized.companyName ?? row.company_name,
        superintendence_id: normalized.superintendenceId ?? row.superintendence_id,
        superintendence_name: normalized.superintendenceName ?? row.superintendence_name,
        management_id: normalized.managementId ?? row.management_id,
        management_name: normalized.managementName ?? row.management_name,
        project_id: normalized.projectId ?? row.project_id,
        project_name: normalized.projectName ?? row.project_name,
        path,
      };
    });

    const filtered = normalizedRows.filter((row) => {
      const companyOk = !filters.companyId || String(row.company_id) === filters.companyId;
      const supOk = !filters.superintendenceId || String(row.superintendence_id) === filters.superintendenceId;
      const mgmtOk = !filters.managementId || String(row.management_id ?? "") === filters.managementId;
      const projectOk = !filters.projectId || String(row.project_id ?? "") === filters.projectId;
      if (!companyOk || !supOk || !mgmtOk || !projectOk) return false;

      if (!indicatorNeedle) return true;
      const namesRaw = row.indicator_names;
      const names = Array.isArray(namesRaw)
        ? namesRaw.map((x) => String(x))
        : typeof namesRaw === "string"
          ? (() => {
              try {
                const parsed = JSON.parse(namesRaw);
                return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [String(namesRaw)];
              } catch {
                return [String(namesRaw)];
              }
            })()
          : [];
      return names.some((name) => n(name).includes(indicatorNeedle));
    });

    return filtered;
  }
};
