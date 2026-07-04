import path from "path";
import { promises as fs } from "fs";
import { companies } from "../../src/data/mockData";

type Trend = "up" | "down" | "stable";

const OUT_DIR = path.resolve(process.cwd(), "data/reports/catalog");

const sanitize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

const parseSizeToBytes = (sizeLabel: string): number => {
  const match = sizeLabel.trim().match(/^([\d.,]+)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  const value = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();
  const map: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return Number.isNaN(value) ? 0 : Math.round(value * (map[unit] ?? 1));
};

const parseDate = (value: string): string | null => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const ensureOutDir = async (): Promise<void> => {
  await fs.mkdir(OUT_DIR, { recursive: true });
};

const writeCatalogJson = async (
  payload: Record<string, unknown>,
  sourceReportId: string,
  reportName: string
): Promise<void> => {
  const filename = `${sanitize(sourceReportId)}--${sanitize(reportName)}.json`;
  const fullPath = path.join(OUT_DIR, filename);
  await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
};

const run = async (): Promise<void> => {
  await ensureOutDir();
  let generated = 0;

  for (const company of companies) {
    for (const sup of company.superintendences) {
      for (const management of sup.managements) {
        for (const project of management.projects) {
          for (const indicator of project.indicators) {
            for (const report of indicator.reports) {
              const sourceReportId = `mock-${report.id}`;
              const payload = {
                schema: "neoview.report.v1",
                source_report_id: sourceReportId,
                report: {
                  name: report.name,
                  description: report.description ?? "",
                  date: parseDate(report.date),
                  size_label: report.size ?? "",
                  size_bytes: parseSizeToBytes(report.size ?? ""),
                  url: report.url ?? null
                },
                hierarchy: {
                  company: { id: company.id, name: company.name },
                  superintendence: { id: sup.id, name: sup.name },
                  management: { id: management.id, name: management.name },
                  project: { id: project.id, name: project.name }
                },
                indicators: [
                  {
                    id: indicator.id,
                    name: indicator.name,
                    value: indicator.value,
                    unit: indicator.unit,
                    trend: indicator.trend as Trend
                  }
                ],
                metrics: {
                  views: report.metrics.views ?? 0,
                  comments: report.metrics.comments ?? 0,
                  likes: report.metrics.likes ?? 0,
                  shares: report.metrics.shares ?? 0
                },
                path: [company.name, sup.name, management.name, project.name, indicator.name, report.name],
                raw_json: {
                  company,
                  superintendence: sup,
                  management,
                  project,
                  indicator,
                  report
                },
                generated_at: new Date().toISOString()
              };

              await writeCatalogJson(payload, sourceReportId, report.name);
              generated += 1;
            }
          }
        }
      }
    }
  }

  console.log(`Generated ${generated} catalog report JSON files in ${OUT_DIR}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

