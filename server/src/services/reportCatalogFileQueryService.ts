import path from "path";
import { promises as fs } from "fs";
import { clearCorporateHierarchyChildren, normalizeCoelbaHierarchy } from "../data/coelbaHierarchyRules";

const CATALOG_DIR = path.resolve(process.cwd(), "data/reports/catalog");
const DOC_CACHE_TTL_MS = 30_000;

export interface CatalogJsonDoc {
  source_report_id: string;
  report: {
    name: string;
    description: string;
    date: string | null;
  };
  hierarchy: {
    company: { id: string; name: string };
    superintendence: { id: string; name: string };
    management: { id: string; name: string };
    project: { id: string; name: string };
  };
  indicators: Array<{ id?: string; name: string }>;
  metrics: { views: number; comments: number; likes: number; shares: number };
  path?: string[];
}

export interface CatalogSearchResult {
  sourceReportId: string;
  reportName: string;
  reportDescription: string;
  reportDate: string | null;
  companyId: string;
  companyName: string;
  superintendenceName: string;
  managementName: string;
  projectName: string;
  indicatorNames: string[];
  score: number;
}

interface CachedDocsState {
  expiresAt: number;
  docs: CatalogJsonDoc[];
}

const indicatorAliases: Record<string, string[]> = {
  iar: ["iar", "i a r"],
  ipce: ["ipce", "i p c e"],
  dce: ["dce", "d c e"],
  dec: ["dec", "duracao equivalente por consumidor"],
  fec: ["fec", "frequencia equivalente por consumidor"],
  gd: ["gd", "geracao distribuida"],
  sla: ["sla", "nivel de servico", "service level agreement"],
  isqp: ["isqp", "indice de satisfacao", "indice de satisfacao com a qualidade percebida"],
  tma: ["tma", "tempo medio de atendimento"],
  mtbf: ["mtbf", "tempo medio entre falhas"],
  mttr: ["mttr", "tempo medio de reparo"]
};

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const safeParse = (raw: string): CatalogJsonDoc | null => {
  try {
    const parsed = JSON.parse(raw) as CatalogJsonDoc;
    if (!parsed?.source_report_id || !parsed?.report?.name) return null;
    const normalized = clearCorporateHierarchyChildren(
      normalizeCoelbaHierarchy({
        companyId: parsed.hierarchy?.company?.id ?? null,
        companyName: parsed.hierarchy?.company?.name ?? null,
        superintendenceId: parsed.hierarchy?.superintendence?.id ?? null,
        superintendenceName: parsed.hierarchy?.superintendence?.name ?? null,
        managementId: parsed.hierarchy?.management?.id ?? null,
        managementName: parsed.hierarchy?.management?.name ?? null,
        projectId: parsed.hierarchy?.project?.id ?? null,
        projectName: parsed.hierarchy?.project?.name ?? null,
      })
    );
    parsed.hierarchy.company.id = normalized.companyId ?? parsed.hierarchy.company.id;
    parsed.hierarchy.company.name = normalized.companyName ?? parsed.hierarchy.company.name;
    parsed.hierarchy.superintendence.id =
      normalized.superintendenceId ?? parsed.hierarchy.superintendence.id;
    parsed.hierarchy.superintendence.name =
      normalized.superintendenceName ?? parsed.hierarchy.superintendence.name;
    parsed.hierarchy.management.id = normalized.managementId ?? parsed.hierarchy.management.id;
    parsed.hierarchy.management.name = normalized.managementName ?? parsed.hierarchy.management.name;
    parsed.hierarchy.project.id = normalized.projectId ?? parsed.hierarchy.project.id;
    parsed.hierarchy.project.name = normalized.projectName ?? parsed.hierarchy.project.name;
    parsed.path = [
      parsed.hierarchy.company.name,
      parsed.hierarchy.superintendence.name,
      parsed.hierarchy.management.name,
      parsed.hierarchy.project.name,
      parsed.report.name,
    ].filter(Boolean);
    return parsed;
  } catch {
    return null;
  }
};

const compact = (text: string): string => normalize(text).replace(/[^a-z0-9]+/g, "");

const indicatorVariants = (name?: string, id?: string): Set<string> => {
  const variants = new Set<string>();
  const normalizedName = normalize(name ?? "").trim();
  const normalizedId = normalize(id ?? "").trim();

  if (normalizedName) {
    variants.add(normalizedName);
    variants.add(compact(normalizedName));
  }

  if (normalizedId) {
    variants.add(normalizedId);
    variants.add(compact(normalizedId));
  }

  Object.entries(indicatorAliases).forEach(([canonical, aliases]) => {
    if (
      normalizedName === canonical ||
      normalizedId === canonical ||
      aliases.some((alias) => normalize(alias) === normalizedName || normalize(alias) === normalizedId)
    ) {
      variants.add(canonical);
      aliases.forEach((alias) => {
        variants.add(normalize(alias));
        variants.add(compact(alias));
      });
    }
  });

  return variants;
};

const docMatchesIndicatorTerms = (doc: CatalogJsonDoc, terms: string[]): boolean => {
  if (terms.length === 0) return false;

  const normalizedTerms = terms
    .map((term) => normalize(term).trim())
    .filter(Boolean)
    .flatMap((term) => [term, compact(term)]);

  return normalizedTerms.some((term) =>
    (doc.indicators ?? []).some((indicator) => indicatorVariants(indicator.name, indicator.id).has(term))
  );
};

const scoreDoc = (doc: CatalogJsonDoc, query: string): number => {
  const q = normalize(query);
  const qTokens = new Set(q.split(/\s+/).filter(Boolean));
  if (qTokens.size === 0) return 0;

  const indicatorNames = (doc.indicators ?? []).map((x) => x.name);
  const indicatorIds = (doc.indicators ?? []).map((x) => String(x.id ?? "")).filter(Boolean);

  const blob = normalize(
    [
      doc.source_report_id,
      doc.report.name,
      doc.report.description ?? "",
      doc.hierarchy.company.name,
      doc.hierarchy.superintendence.name,
      doc.hierarchy.management.name,
      doc.hierarchy.project.name,
      ...indicatorNames,
      ...indicatorIds
    ].join(" ")
  );

  let hits = 0;
  qTokens.forEach((token) => {
    if (blob.includes(token)) hits += 1;
  });
  return hits / qTokens.size;
};

let cachedDocsState: CachedDocsState | null = null;

const listJsonFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFilesRecursive(full);
      return entry.name.toLowerCase().endsWith(".json") ? [full] : [];
    })
  );
  return files.flat();
};

export const reportCatalogFileQueryService = {
  async listAll(): Promise<CatalogJsonDoc[]> {
    if (cachedDocsState && cachedDocsState.expiresAt > Date.now()) {
      return cachedDocsState.docs;
    }

    const exists = await fs
      .access(CATALOG_DIR)
      .then(() => true)
      .catch(() => false);
    if (!exists) return [];

    const files = await listJsonFilesRecursive(CATALOG_DIR);
    const docs: CatalogJsonDoc[] = [];

    for (const full of files) {
      const raw = await fs.readFile(full, "utf8");
      const parsed = safeParse(raw);
      if (parsed) docs.push(parsed);
    }

    cachedDocsState = {
      docs,
      expiresAt: Date.now() + DOC_CACHE_TTL_MS
    };

    return docs;
  },

  invalidateCache(): void {
    cachedDocsState = null;
  },

  async search(query: string, limit = 10): Promise<Array<{ doc: CatalogJsonDoc; score: number }>> {
    const docs = await this.listAll();
    const ranked = docs
      .map((doc) => ({ doc, score: scoreDoc(doc, query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return ranked;
  },

  async searchByIndicatorsStrict(terms: string[], limit = 10): Promise<Array<{ doc: CatalogJsonDoc; score: number }>> {
    const docs = await this.listAll();
    const filtered = docs
      .filter((doc) => docMatchesIndicatorTerms(doc, terms))
      .map((doc) => ({ doc, score: 1 }))
      .slice(0, limit);
    return filtered;
  },

  async searchByCompany(params: {
    companyId: string;
    query?: string;
    limit?: number;
  }): Promise<CatalogSearchResult[]> {
    const docs = await this.listAll();
    const limit = Math.max(1, Math.min(20, Math.floor(params.limit ?? 3)));
    const needle = normalize(params.query ?? "");

    const filtered = docs.filter((doc) => doc.hierarchy?.company?.id === params.companyId);

    const ranked = filtered
      .map((doc) => ({
        doc,
        score: needle ? scoreDoc(doc, needle) : 1
      }))
      .filter((entry) => !needle || entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(b.doc.report.date ?? "").localeCompare(String(a.doc.report.date ?? ""));
      });

    const uniqueByName = new Map<string, CatalogSearchResult>();
    for (const entry of ranked) {
      const reportName = entry.doc.report.name;
      const uniqueKey = normalize(`${entry.doc.hierarchy.company.id}::${reportName}`);
      if (uniqueByName.has(uniqueKey)) continue;
      uniqueByName.set(uniqueKey, {
        sourceReportId: entry.doc.source_report_id,
        reportName,
        reportDescription: entry.doc.report.description ?? "",
        reportDate: entry.doc.report.date ?? null,
        companyId: entry.doc.hierarchy.company.id,
        companyName: entry.doc.hierarchy.company.name,
        superintendenceName: entry.doc.hierarchy.superintendence?.name ?? "",
        managementName: entry.doc.hierarchy.management?.name ?? "",
        projectName: entry.doc.hierarchy.project?.name ?? "",
        indicatorNames: (entry.doc.indicators ?? []).map((indicator) => indicator.name).filter(Boolean),
        score: entry.score
      });
      if (uniqueByName.size >= limit) break;
    }

    return Array.from(uniqueByName.values());
  }
};
