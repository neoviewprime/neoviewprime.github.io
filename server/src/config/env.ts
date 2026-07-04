import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

if (!process.env.DB_PROVIDER && process.env.DB_CLIENT) {
  process.env.DB_PROVIDER = process.env.DB_CLIENT;
}

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(3389),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().default("http://localhost:3389"),
  DB_PROVIDER: z.literal("sqlite").default("sqlite"),
  DB_SCHEMA: z.string().default("neoview_schema"),
  DB_CLIENT: z.literal("sqlite").default("sqlite"),
  VECTOR_PROVIDER: z.enum(["chromadb", "sqlite"]).default("sqlite"),
  CHROMA_URL: z.string().default("http://localhost:8000"),
  CHROMA_TENANT: z.string().default("default_tenant"),
  CHROMA_DATABASE: z.string().default("default_database"),
  CHROMA_REPORT_COLLECTION: z.string().default("reports_chunks"),
  CHROMA_CACHE_COLLECTION: z.string().default("semantic_cache"),
  LLM_PROVIDER: z.enum(["auto", "local", "openai", "ollama"]).default("auto"),
  OLLAMA_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("phi3:mini"),
  OPENAI_API_KEY: z.string().optional(),
  EMBEDDING_PROVIDER: z.enum(["local", "openai"]).default("local"),
  OPENAI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_CHAT_MODEL: z.string().default("gpt-4o-mini"),
  SQLITE_PATH: z.string().default("data/neoview.sqlite")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment variables:\n${errors.join("\n")}`);
}

export const env = parsed.data;
