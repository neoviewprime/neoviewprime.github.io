import { resolveVectorStore } from "./storeResolver";

export const vectorStore = {
  insertChunk: async (input: { reportId: string; chunkText: string; embedding: number[]; metadata: Record<string, unknown> }) =>
    (await resolveVectorStore()).insertChunk(input),
  searchChunks: async (embedding: number[], topK = 8) =>
    (await resolveVectorStore()).searchChunks(embedding, topK),
  searchCache: async (embedding: number[], topK = 1) =>
    (await resolveVectorStore()).searchCache(embedding, topK),
  saveCache: async (
    query: string,
    embedding: number[],
    response: { answer: string; sources: Array<Record<string, unknown>> }
  ) => (await resolveVectorStore()).saveCache(query, embedding, response),
  deleteChunksByReport: async (reportId: string) => {
    const store = await resolveVectorStore();
    if (store.deleteChunksByReport) {
      await store.deleteChunksByReport(reportId);
    }
  }
};
