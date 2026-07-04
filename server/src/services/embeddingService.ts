import { env } from "../config/env";
import { tokenize } from "../utils/tokenizer";

const EMBEDDING_SIZE = 1536;

const hashToken = (token: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash *= 16777619;
  }
  return Math.abs(hash);
};

const normalize = (vector: number[]): number[] => {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / norm);
};

const localEmbedding = (text: string): number[] => {
  const vector = new Array<number>(EMBEDDING_SIZE).fill(0);
  const tokens = tokenize(text);

  for (const token of tokens) {
    const idx = hashToken(token) % EMBEDDING_SIZE;
    vector[idx] += 1;
  }

  return normalize(vector);
};

const openAiEmbedding = async (text: string): Promise<number[]> => {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_EMBED_MODEL,
      input: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
  };

  return payload.data[0]?.embedding ?? localEmbedding(text);
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text.trim()) {
    return new Array<number>(EMBEDDING_SIZE).fill(0);
  }

  if (env.EMBEDDING_PROVIDER !== "openai" || !env.OPENAI_API_KEY) {
    return localEmbedding(text);
  }

  try {
    return await openAiEmbedding(text);
  } catch {
    return localEmbedding(text);
  }
};

export const generateBatchEmbeddings = async (texts: string[]): Promise<number[][]> =>
  Promise.all(texts.map((text) => generateEmbedding(text)));
