import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { chunkText } from "../utils/chunker";
import { generateBatchEmbeddings } from "./embeddingService";
import { cacheService } from "./cacheService";
import { getDbClient } from "../db/connection";
import { readInsertedId } from "../db/providerUtils";
import { vectorStore } from "../vectorstore/vectorStore";

const CATALOG_DIR = path.resolve(process.cwd(), "data/reports/catalog");
const DATA_DIR = path.resolve(process.cwd(), "data");

type CatalogSemanticDoc = {
  source_report_id: string;
  report_status?: string;
  report?: {
    name?: string;
  };
};

const extractText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(extractText).join(" ");
  }
  return "";
};

const listJsonFilesRecursive = async (dir: string): Promise<string[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listJsonFilesRecursive(fullPath);
      return entry.name.toLowerCase().endsWith(".json") ? [fullPath] : [];
    })
  );
  return nested.flat();
};

const parseCatalogDoc = async (fullPath: string): Promise<CatalogSemanticDoc | null> => {
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = JSON.parse(raw) as CatalogSemanticDoc;
    if (!parsed?.source_report_id || !parsed?.report?.name) return null;
    return parsed;
  } catch {
    return null;
  }
};

const toSourceFile = (fullPath: string): string => path.relative(DATA_DIR, fullPath).replace(/\\/g, "/");

const upsertCatalogIndex = async (input: {
  fullPath: string;
  reportCatalogId?: string | null;
}): Promise<{ indexed: boolean; chunks: number }> => {
  const parsed = await parseCatalogDoc(input.fullPath);
  if (!parsed) return { indexed: false, chunks: 0 };
  if (String(parsed.report_status ?? "approved") !== "approved") return { indexed: false, chunks: 0 };
  const title = parsed.report?.name?.trim();
  if (!title) return { indexed: false, chunks: 0 };

  const db = await getDbClient();
  const sourceFile = toSourceFile(input.fullPath);
  const fullText = extractText(parsed);
  const chunks = chunkText(fullText);

  const resolvedCatalogId =
    input.reportCatalogId ??
    (
      await db.query<{ id: string }>(
        "SELECT id FROM report_catalog WHERE source_report_id = $1 LIMIT 1",
        [parsed.source_report_id]
      )
    ).rows[0]?.id ??
    null;

  let reportId =
    (
      await db.query<{ id: string }>(
        `SELECT id
         FROM reports
         WHERE source_file = $1
            OR source_report_id = $2
            OR (report_catalog_id IS NOT NULL AND report_catalog_id = $3)
         LIMIT 1`,
        [sourceFile, parsed.source_report_id, resolvedCatalogId]
      )
    ).rows[0]?.id ?? null;

  if (reportId) {
    await db.query(
      `UPDATE reports
       SET report_catalog_id = $2,
           source_report_id = $3,
           original_filename = $4,
           title = $5,
           source_file = $6,
           json_content = $7
       WHERE id = $1`,
      [
        reportId,
        resolvedCatalogId,
        parsed.source_report_id,
        title,
        title,
        sourceFile,
        JSON.stringify(parsed),
      ]
    );
  } else {
    reportId = randomUUID();
    await db.query(
      `INSERT INTO reports (
        id, report_catalog_id, source_report_id, original_filename, title, source_file, json_content
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )`,
      [
        reportId,
        resolvedCatalogId,
        parsed.source_report_id,
        title,
        title,
        sourceFile,
        JSON.stringify(parsed),
      ]
    );
    reportId = (await readInsertedId(db, "reports", "source_file", sourceFile)) ?? reportId;
  }

  await vectorStore.deleteChunksByReport(reportId);

  if (chunks.length > 0) {
    const embeddings = await generateBatchEmbeddings(chunks);
    for (let index = 0; index < chunks.length; index += 1) {
      await vectorStore.insertChunk({
        reportId,
        chunkText: chunks[index],
        embedding: embeddings[index],
        metadata: {
          sourceFile,
          sourceReportId: parsed.source_report_id,
          reportCatalogId: resolvedCatalogId,
          title,
          chunkIndex: index,
        },
      });
    }
  }

  return { indexed: true, chunks: chunks.length };
};

export const reportCatalogSemanticSyncService = {
  async syncCatalogDocumentFile(input: {
    fullPath: string;
    reportCatalogId?: string | null;
    clearSemanticCache?: boolean;
  }): Promise<{ indexed: boolean; chunks: number }> {
    const result = await upsertCatalogIndex(input);
    if (result.indexed && input.clearSemanticCache !== false) {
      await cacheService.clear();
    }
    return result;
  },

  async syncAllCatalogDocuments(): Promise<{ indexed: number; chunks: number }> {
    const exists = await fs
      .access(CATALOG_DIR)
      .then(() => true)
      .catch(() => false);
    if (!exists) return { indexed: 0, chunks: 0 };

    const files = await listJsonFilesRecursive(CATALOG_DIR);
    let indexed = 0;
    let chunks = 0;

    for (const fullPath of files) {
      const result = await upsertCatalogIndex({ fullPath });
      if (!result.indexed) continue;
      indexed += 1;
      chunks += result.chunks;
    }

    if (indexed > 0) {
      await cacheService.clear();
    }

    return { indexed, chunks };
  },
};
