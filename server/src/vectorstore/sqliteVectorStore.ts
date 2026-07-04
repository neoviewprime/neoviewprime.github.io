import { randomUUID } from "crypto";
import { getDbClient } from "../db/connection";
import { fromDbJson } from "../db/providerUtils";
import { CachePayload, CacheSearchResult, ChunkSearchResult } from "./types";

const serializeEmbedding = (embedding: number[]): string => JSON.stringify(embedding);

const parseEmbedding = (value: unknown): number[] => {
  const parsed = fromDbJson<unknown>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));
};

const cosineSimilarity = (left: number[], right: number[]): number => {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let i = 0; i < left.length; i += 1) {
    const a = left[i];
    const b = right[i];
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  return denominator > 0 ? Math.max(0, Math.min(1, dot / denominator)) : 0;
};

const createId = () => randomUUID();

export const sqliteVectorStore = {
  async insertChunk(input: {
    reportId: string;
    chunkText: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const db = await getDbClient();
    await db.query(
      `INSERT INTO report_chunks (id, report_id, chunk_text, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [createId(), input.reportId, input.chunkText, serializeEmbedding(input.embedding), JSON.stringify(input.metadata)]
    );
  },

  async searchChunks(embedding: number[], topK = 8): Promise<ChunkSearchResult[]> {
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      report_id: string;
      chunk_text: string;
      embedding: unknown;
      metadata: unknown;
    }>(
      `SELECT id, report_id, chunk_text, embedding, metadata
       FROM report_chunks`
    );

    return result.rows
      .map((row) => ({
        id: row.id,
        report_id: row.report_id,
        chunk_text: row.chunk_text,
        metadata: fromDbJson<Record<string, unknown>>(row.metadata, {}),
        score: cosineSimilarity(parseEmbedding(row.embedding), embedding)
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  async deleteChunksByReport(reportId: string): Promise<void> {
    const db = await getDbClient();
    await db.query("DELETE FROM report_chunks WHERE report_id = $1", [reportId]);
  },

  async searchCache(embedding: number[], topK = 1): Promise<CacheSearchResult[]> {
    const db = await getDbClient();
    const result = await db.query<{
      id: string;
      query: string;
      query_embedding: unknown;
      response: unknown;
    }>(
      `SELECT id, query, query_embedding, response
       FROM semantic_cache`
    );

    return result.rows
      .map((row) => ({
        id: row.id,
        query: row.query,
        response: fromDbJson<CachePayload>(row.response, { answer: "", sources: [] }),
        score: cosineSimilarity(parseEmbedding(row.query_embedding), embedding)
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  async saveCache(query: string, embedding: number[], response: CachePayload): Promise<void> {
    const db = await getDbClient();
    await db.query(
      `INSERT INTO semantic_cache (id, query, query_embedding, response)
       VALUES ($1, $2, $3, $4)`,
      [createId(), query, serializeEmbedding(embedding), JSON.stringify(response)]
    );
  }
};
