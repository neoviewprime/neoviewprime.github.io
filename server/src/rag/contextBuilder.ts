import { ChunkSearchResult } from "../vectorstore/types";

export const buildContext = (results: ChunkSearchResult[], maxItems = 6): string => {
  if (results.length === 0) return "";
  return results
    .slice(0, maxItems)
    .map(
      (item, index) =>
        `Fonte ${index + 1} (${String(item.metadata?.["title"] ?? "Relatorio")}): ${item.chunk_text}`
    )
    .join("\n\n");
};
