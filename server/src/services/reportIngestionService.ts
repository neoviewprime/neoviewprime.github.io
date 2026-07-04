import path from "path";
import { promises as fs } from "fs";
import { chunkText } from "../utils/chunker";
import { generateBatchEmbeddings } from "./embeddingService";
import { getDbClient } from "../db/connection";
import { vectorStore } from "../vectorstore/vectorStore";
import { randomUUID } from "crypto";
import { readInsertedId } from "../db/providerUtils";

const REPORTS_DIR = path.resolve(process.cwd(), "data/reports");

const extractText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(extractText).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(extractText).join(" ");
  return "";
};

const parseReportTitle = (filename: string, parsedJson: unknown): string => {
  if (parsedJson && typeof parsedJson === "object" && "title" in parsedJson) {
    const title = (parsedJson as Record<string, unknown>).title;
    if (typeof title === "string" && title.trim().length > 0) return title.trim();
  }
  return filename.replace(/\.json$/i, "");
};

export interface IngestionSummary {
  ingestedReports: number;
  ingestedChunks: number;
}

export const reportIngestionService = {
  async ingestAll(): Promise<IngestionSummary> {
    const db = await getDbClient();
    const files = (await fs.readdir(REPORTS_DIR)).filter((file) => file.toLowerCase().endsWith(".json"));
    let ingestedReports = 0;
    let ingestedChunks = 0;

    for (const file of files) {
      const fullPath = path.join(REPORTS_DIR, file);
      const raw = await fs.readFile(fullPath, "utf8");
      const jsonContent = JSON.parse(raw) as unknown;
      const title = parseReportTitle(file, jsonContent);
      const fullText = extractText(jsonContent);
      const chunks = chunkText(fullText);
      if (chunks.length === 0) continue;

      let reportId: string;
      const existing = await db.query<{ id: string }>("SELECT id FROM reports WHERE source_file = $1 LIMIT 1", [file]);
      if (existing.rows[0]) {
        reportId = existing.rows[0].id;
        await db.query("UPDATE reports SET title = $2, json_content = $3 WHERE id = $1", [
          reportId,
          title,
          JSON.stringify(jsonContent)
        ]);
      } else {
        reportId = randomUUID();
        await db.query("INSERT INTO reports (id, title, source_file, json_content) VALUES ($1, $2, $3, $4)", [
          reportId,
          title,
          file,
          JSON.stringify(jsonContent)
        ]);
        reportId = (await readInsertedId(db, "reports", "source_file", file)) ?? reportId;
      }
      await vectorStore.deleteChunksByReport(reportId);

      const embeddings = await generateBatchEmbeddings(chunks);
      for (let i = 0; i < chunks.length; i += 1) {
        await vectorStore.insertChunk({
          reportId,
          chunkText: chunks[i],
          embedding: embeddings[i],
          metadata: { sourceFile: file, chunkIndex: i, title }
        });
      }

      ingestedReports += 1;
      ingestedChunks += chunks.length;
    }

    return { ingestedReports, ingestedChunks };
  },

  async listReports(): Promise<Array<Record<string, unknown>>> {
    const db = await getDbClient();
    const result = await db.query(
      "SELECT id, title, source_file, created_at FROM reports ORDER BY created_at DESC"
    );
    return result.rows as Array<Record<string, unknown>>;
  },

  async getReportById(id: string): Promise<Record<string, unknown> | null> {
    const db = await getDbClient();
    const result = await db.query("SELECT * FROM reports WHERE id = $1 LIMIT 1", [id]);
    return (result.rows[0] as Record<string, unknown>) ?? null;
  }
};
