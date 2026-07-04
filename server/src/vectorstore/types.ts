export interface ChunkSearchResult {
  id: string;
  report_id: string;
  chunk_text: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface CachePayload {
  answer: string;
  sources: Array<Record<string, unknown>>;
}

export interface CacheSearchResult {
  id: string;
  query: string;
  response: CachePayload;
  score: number;
}

