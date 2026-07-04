import { generateEmbedding } from "./embeddingService";
import { vectorStore } from "../vectorstore/vectorStore";
import { getDbClient } from "../db/connection";

const CACHE_THRESHOLD = 0.93;

export interface CachedAnswer {
  answer: string;
  sources: Array<Record<string, unknown>>;
}

export const cacheService = {
  async getCachedAnswer(query: string): Promise<{ cached: CachedAnswer | null; embedding: number[] }> {
    const embedding = await generateEmbedding(query);
    const top = await vectorStore.searchCache(embedding, 1).catch(() => []);
    if (!top[0] || top[0].score < CACHE_THRESHOLD) {
      return { cached: null, embedding };
    }
    return { cached: top[0].response, embedding };
  },

  async save(query: string, embedding: number[], answer: CachedAnswer): Promise<void> {
    await vectorStore.saveCache(query, embedding, answer).catch(() => undefined);
  },

  async clear(): Promise<void> {
    const db = await getDbClient();
    await db.query("DELETE FROM semantic_cache");
  }
};
