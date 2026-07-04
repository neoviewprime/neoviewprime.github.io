const path = require("path");
const fs = require("fs/promises");
const vm = require("vm");

const ROOT_DIR = path.resolve(__dirname, "../..");
const MOCK_FILE = path.resolve(ROOT_DIR, "src/data/mockData.ts");
const OUT_DIR = path.resolve(__dirname, "../data/reports/catalog");

const sanitize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

const parseSizeToBytes = (sizeLabel) => {
  const match = String(sizeLabel || "").trim().match(/^([\d.,]+)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  const value = Number(match[1].replace(",", "."));
  const unit = match[2].toUpperCase();
  const map = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return Number.isNaN(value) ? 0 : Math.round(value * (map[unit] || 1));
};

const parseDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const extractCompaniesLiteral = (source) => {
  const marker = "export const companies";
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("Could not find companies export in mockData.ts");

  const equalSign = source.indexOf("=", start);
  if (equalSign < 0) throw new Error("Could not find assignment for companies export");

  const firstBracket = source.indexOf("[", equalSign);
  if (firstBracket < 0) throw new Error("Could not find companies array start");

  let depth = 0;
  let end = -1;
  for (let i = firstBracket; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) throw new Error("Could not find companies array end");
  return source.slice(firstBracket, end + 1);
};

const run = async () => {
  const raw = await fs.readFile(MOCK_FILE, "utf8");
  const literal = extractCompaniesLiteral(raw);
  const companies = vm.runInNewContext(literal, {});
  await fs.mkdir(OUT_DIR, { recursive: true });

  let generated = 0;
  for (const company of companies) {
    for (const sup of company.superintendences || []) {
      for (const management of sup.managements || []) {
        for (const project of management.projects || []) {
          for (const indicator of project.indicators || []) {
            for (const report of indicator.reports || []) {
              const sourceReportId = `mock-${report.id}`;
              const payload = {
                schema: "neoview.report.v1",
                source_report_id: sourceReportId,
                report: {
                  name: report.name,
                  description: report.description || "",
                  date: parseDate(report.date),
                  size_label: report.size || "",
                  size_bytes: parseSizeToBytes(report.size || ""),
                  url: report.url || null
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
                    trend: indicator.trend
                  }
                ],
                metrics: {
                  views: report.metrics?.views || 0,
                  comments: report.metrics?.comments || 0,
                  likes: report.metrics?.likes || 0,
                  shares: report.metrics?.shares || 0
                },
                path: [company.name, sup.name, management.name, project.name, indicator.name, report.name],
                raw_json: { company, superintendence: sup, management, project, indicator, report },
                generated_at: new Date().toISOString()
              };

              const filename = `${sanitize(sourceReportId)}--${sanitize(report.name)}.json`;
              const fullPath = path.join(OUT_DIR, filename);
              await fs.writeFile(fullPath, JSON.stringify(payload, null, 2), "utf8");
              generated += 1;
            }
          }
        }
      }
    }
  }

  console.log(`Generated ${generated} JSON files in ${OUT_DIR}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
