import { tokenize } from "./tokenizer";

export const chunkText = (text: string, chunkSize = 220, overlap = 40): string[] => {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const chunks: string[] = [];
  let index = 0;

  while (index < tokens.length) {
    const slice = tokens.slice(index, index + chunkSize);
    if (slice.length === 0) break;
    chunks.push(slice.join(" "));
    index += Math.max(1, chunkSize - overlap);
  }

  return chunks;
};

