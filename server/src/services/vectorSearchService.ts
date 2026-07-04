import { generateEmbedding } from "./embeddingService";
import { vectorStore } from "../vectorstore/vectorStore";

export const vectorSearchService = {
  async search(query: string, topK = 8) {
    const embedding = await generateEmbedding(query);
    const results = await vectorStore.searchChunks(embedding, topK).catch(() => []);
    return { embedding, results };
  }
};
