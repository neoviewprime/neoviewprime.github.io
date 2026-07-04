import path from "path";
import { promises as fs } from "fs";

const CATALOG_DIR = path.resolve(process.cwd(), "data/reports/catalog");

export interface ReportJsonPayload {
  sourceReportId: string;
  reportName: string;
  reportDescription?: string;
  reportDate?: string | null;
  reportSizeLabel?: string;
  reportSizeBytes?: number;
  reportUrl?: string | null;
  companyId: string;
  companyName: string;
  superintendenceId: string;
  superintendenceName: string;
  managementId?: string;
  managementName?: string;
  projectId?: string;
  projectName?: string;
  indicators: Array<{
    id?: string;
    name: string;
    value?: string;
    unit?: string;
    trend?: string;
  }>;
  metrics?: {
    views?: number;
    comments?: number;
    likes?: number;
    shares?: number;
  };
  path?: string[];
  reportStatus?: string;
  rawJson?: Record<string, unknown>;
}

const sanitize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildFilename = (sourceReportId: string, reportName: string): string => {
  const idPart = sanitize(sourceReportId || "report");
  const namePart = sanitize(reportName || "arquivo");
  return `${idPart}--${namePart}.json`;
};

const buildHierarchyDir = (payload: ReportJsonPayload): string =>
  path.join(
    CATALOG_DIR,
    sanitize(payload.companyId || payload.companyName || 'empresa'),
    sanitize(payload.superintendenceId || payload.superintendenceName || 'superintendencia'),
    sanitize(payload.managementId || payload.managementName || 'gerencia'),
    sanitize(payload.projectId || payload.projectName || 'unidade')
  );

const listJsonFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFilesRecursive(fullPath);
      return entry.name.toLowerCase().endsWith(".json") ? [fullPath] : [];
    })
  );
  return files.flat();
};

export const reportJsonFileService = {
  async ensureDir(): Promise<void> {
    await fs.mkdir(CATALOG_DIR, { recursive: true });
  },

  async writeReportJson(payload: ReportJsonPayload): Promise<string> {
    await this.ensureDir();
    await this.deleteReportJson(payload.sourceReportId, payload.reportName);
    const fileName = buildFilename(payload.sourceReportId, payload.reportName);
    const hierarchyDir = buildHierarchyDir(payload);
    await fs.mkdir(hierarchyDir, { recursive: true });
    const fullPath = path.join(hierarchyDir, fileName);

    const document = {
      schema: "neoview.report.v1",
      source_report_id: payload.sourceReportId,
      report_status: payload.reportStatus ?? 'approved',
      report: {
        name: payload.reportName,
        description: payload.reportDescription ?? "",
        date: payload.reportDate ?? null,
        size_label: payload.reportSizeLabel ?? "",
        size_bytes: payload.reportSizeBytes ?? 0,
        url: payload.reportUrl ?? null
      },
      hierarchy: {
        company: { id: payload.companyId, name: payload.companyName },
        superintendence: { id: payload.superintendenceId, name: payload.superintendenceName },
        management: { id: payload.managementId ?? "", name: payload.managementName ?? "" },
        project: { id: payload.projectId ?? "", name: payload.projectName ?? "" }
      },
      indicators: payload.indicators,
      metrics: {
        views: payload.metrics?.views ?? 0,
        comments: payload.metrics?.comments ?? 0,
        likes: payload.metrics?.likes ?? 0,
        shares: payload.metrics?.shares ?? 0
      },
      path: payload.path ?? [],
      raw_json: payload.rawJson ?? {},
      generated_at: new Date().toISOString()
    };

    await fs.writeFile(fullPath, JSON.stringify(document, null, 2), "utf8");
    return fullPath;
  },

  async deleteReportJson(sourceReportId: string, reportName?: string): Promise<number> {
    const exists = await fs
      .access(CATALOG_DIR)
      .then(() => true)
      .catch(() => false);
    if (!exists) return 0;

    const files = await listJsonFilesRecursive(CATALOG_DIR);

    const targetId = sanitize(sourceReportId || "report");
    const targetName = sanitize(reportName || "");
    let deleted = 0;

    for (const fullPath of files) {
      const base = path.basename(fullPath).toLowerCase();
      const matchesId = base.startsWith(`${targetId}--`);
      const matchesName = targetName ? base.endsWith(`--${targetName}.json`) : false;
      if (!matchesId && !matchesName) continue;
      await fs.unlink(fullPath).catch(() => undefined);
      deleted += 1;
    }

    return deleted;
  }
};

