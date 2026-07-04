import { env } from "../config/env";
import { CachePayload, CacheSearchResult, ChunkSearchResult } from "./types";

interface ChromaCollection {
  id: string;
  name: string;
}

const baseUrl = `${env.CHROMA_URL.replace(/\/$/, "")}/api/v1`;

const headers = { "Content-Type": "application/json" };

const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Chroma request failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
};

const ensureCollection = async (name: string): Promise<ChromaCollection> => {
  const response = await postJson<ChromaCollection>("/collections", {
    name,
    get_or_create: true,
    tenant: env.CHROMA_TENANT,
    database: env.CHROMA_DATABASE
  });
  return response;
};

const safeParseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const toScore = (distance: number): number => Math.max(0, 1 - distance);

export const chromaStore = {
  async insertChunk(input: {
    reportId: string;
    chunkText: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }): Promise<void> {
    const collection = await ensureCollection(env.CHROMA_REPORT_COLLECTION);
    const chunkIndex = Number(input.metadata.chunkIndex ?? 0);
    const id = `${input.reportId}:${chunkIndex}`;
    await postJson(`/collections/${collection.id}/upsert`, {
      ids: [id],
      embeddings: [input.embedding],
      documents: [input.chunkText],
      metadatas: [{ ...input.metadata, report_id: input.reportId }]
    });
  },

  async deleteChunksByReport(reportId: string): Promise<void> {
    const collection = await ensureCollection(env.CHROMA_REPORT_COLLECTION);
    await postJson(`/collections/${collection.id}/delete`, {
      where: { report_id: reportId }
    }).catch(() => undefined);
  },

  async searchChunks(embedding: number[], topK = 8): Promise<ChunkSearchResult[]> {
    const collection = await ensureCollection(env.CHROMA_REPORT_COLLECTION);
    const result = await postJson<{
      ids?: string[][];
      documents?: string[][];
      metadatas?: Array<Array<Record<string, unknown>>>;
      distances?: number[][];
    }>(`/collections/${collection.id}/query`, {
      query_embeddings: [embedding],
      n_results: topK,
      include: ["documents", "metadatas", "distances"]
    });

    const ids = result.ids?.[0] ?? [];
    const docs = result.documents?.[0] ?? [];
    const metas = result.metadatas?.[0] ?? [];
    const distances = result.distances?.[0] ?? [];

    return ids.map((id, index) => {
      const metadata = metas[index] ?? {};
      return {
        id,
        report_id: String(metadata.report_id ?? ""),
        chunk_text: docs[index] ?? "",
        metadata,
        score: toScore(distances[index] ?? 1)
      };
    });
  },

  async searchCache(embedding: number[], topK = 1): Promise<CacheSearchResult[]> {
    const collection = await ensureCollection(env.CHROMA_CACHE_COLLECTION);
    const result = await postJson<{
      ids?: string[][];
      documents?: string[][];
      metadatas?: Array<Array<Record<string, unknown>>>;
      distances?: number[][];
    }>(`/collections/${collection.id}/query`, {
      query_embeddings: [embedding],
      n_results: topK,
      include: ["documents", "metadatas", "distances"]
    });

    const ids = result.ids?.[0] ?? [];
    const docs = result.documents?.[0] ?? [];
    const metas = result.metadatas?.[0] ?? [];
    const distances = result.distances?.[0] ?? [];

    return ids.map((id, index) => {
      const metadata = metas[index] ?? {};
      const response: CachePayload = {
        answer: docs[index] ?? "",
        sources: safeParseJson<Array<Record<string, unknown>>>(metadata.sources_json, [])
      };
      return {
        id,
        query: String(metadata.query ?? ""),
        response,
        score: toScore(distances[index] ?? 1)
      };
    });
  },

  async saveCache(query: string, embedding: number[], response: CachePayload): Promise<void> {
    const collection = await ensureCollection(env.CHROMA_CACHE_COLLECTION);
    const id = `cache:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    await postJson(`/collections/${collection.id}/upsert`, {
      ids: [id],
      embeddings: [embedding],
      documents: [response.answer],
      metadatas: [{ query, sources_json: JSON.stringify(response.sources) }]
    });
  }
};

