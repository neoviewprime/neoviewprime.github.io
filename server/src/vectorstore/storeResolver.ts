import { getDbClient } from "../db/connection";
import { env } from "../config/env";
import { chromaStore } from "./chromaStore";
import { sqliteVectorStore } from "./sqliteVectorStore";

export interface VectorStore {
  insertChunk: (input: {
    reportId: string;
    chunkText: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }) => Promise<void>;
  searchChunks: (embedding: number[], topK?: number) => Promise<Array<{
    id: string;
    report_id: string;
    chunk_text: string;
    metadata: Record<string, unknown>;
    score: number;
  }>>;
  searchCache: (embedding: number[], topK?: number) => Promise<Array<{
    id: string;
    query: string;
    response: {
      answer: string;
      sources: Array<Record<string, unknown>>;
    };
    score: number;
  }>>;
  saveCache: (
    query: string,
    embedding: number[],
    response: {
      answer: string;
      sources: Array<Record<string, unknown>>;
    }
  ) => Promise<void>;
  deleteChunksByReport?: (reportId: string) => Promise<void>;
}

export const resolveVectorStore = async (): Promise<VectorStore> => {
  if (env.VECTOR_PROVIDER === "chromadb") {
    return chromaStore;
  }

  const db = await getDbClient();
  if (db.provider !== "sqlite") {
    throw new Error("Unsupported database provider for the built-in vector store.");
  }

  return sqliteVectorStore;
};
