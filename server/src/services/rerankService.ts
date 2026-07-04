import { tokenize } from "../utils/tokenizer";
import { ChunkSearchResult } from "../vectorstore/types";

const lexicalOverlap = (query: string, text: string): number => {
  const qTokens = new Set(tokenize(query));
  if (qTokens.size === 0) return 0;
  const tTokens = new Set(tokenize(text));
  let hits = 0;
  qTokens.forEach((token) => {
    if (tTokens.has(token)) hits += 1;
  });
  return hits / qTokens.size;
};

export const rerankService = {
  rerank(query: string, results: ChunkSearchResult[]): ChunkSearchResult[] {
    return [...results].sort((a, b) => {
      const aLex = lexicalOverlap(query, a.chunk_text);
      const bLex = lexicalOverlap(query, b.chunk_text);
      const aScore = a.score * 0.7 + aLex * 0.3;
      const bScore = b.score * 0.7 + bLex * 0.3;
      return bScore - aScore;
    });
  }
};
