import path from "node:path";
import { existsSync } from "node:fs";
import dotenv from "dotenv";
import { z } from "zod";
import { hanaSyncService } from "../services/hanaSyncService";

const loadOptionalSyncEnv = () => {
  const explicitPath = process.env.HANA_SYNC_ENV_FILE?.trim();
  const candidate = explicitPath
    ? path.resolve(process.cwd(), explicitPath)
    : path.resolve(process.cwd(), ".env.hana-sync");

  if (existsSync(candidate)) {
    dotenv.config({ path: candidate, override: false });
  }
};

loadOptionalSyncEnv();

const args = process.argv.slice(2);

const getArgValue = (name: string): string | undefined => {
  const prefix = `--${name}=`;
  const direct = args.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = args.findIndex((arg) => arg === `--${name}`);
  if (index >= 0) return args[index + 1];
  return undefined;
};

const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const configSchema = z.object({
  HANA_HOST: z.string().min(1),
  HANA_PORT: z.coerce.number().int().positive().default(443),
  HANA_USER: z.string().min(1),
  HANA_PASSWORD: z.string().min(1),
  HANA_SCHEMA: z.string().min(1).default("NEOVIEW"),
  HANA_DATABASE: z.string().optional(),
  HANA_ENCRYPT: z.string().optional(),
  HANA_VALIDATE_CERTIFICATE: z.string().optional()
});

const parsedConfig = configSchema.safeParse(process.env);

if (!parsedConfig.success) {
  const issues = parsedConfig.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(
    `Configuracao do sync SAP HANA invalida.\n${issues}\n` +
      "Defina as variaveis HANA_HOST, HANA_PORT, HANA_USER, HANA_PASSWORD e HANA_SCHEMA " +
      "no shell atual ou em server/.env.hana-sync."
  );
}

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const mode = getArgValue("mode") === "full" ? "full" : "incremental";
const batchSize = Math.max(1, Number.parseInt(getArgValue("batch") ?? "500", 10) || 500);
const ensureTables = hasFlag("ensure-tables");
const includeSensitive = hasFlag("include-sensitive");
const rawTables = getArgValue("tables");
const tables = rawTables ? rawTables.split(",").map((item) => item.trim()).filter(Boolean) : undefined;

const connection = {
  host: parsedConfig.data.HANA_HOST,
  port: parsedConfig.data.HANA_PORT,
  user: parsedConfig.data.HANA_USER,
  password: parsedConfig.data.HANA_PASSWORD,
  schema: getArgValue("schema") ?? parsedConfig.data.HANA_SCHEMA,
  database: parsedConfig.data.HANA_DATABASE,
  encrypt: parseBoolean(parsedConfig.data.HANA_ENCRYPT, true),
  validateCertificate: parseBoolean(parsedConfig.data.HANA_VALIDATE_CERTIFICATE, false)
};

const run = async () => {
  const summary = await hanaSyncService.syncToHana({
    connection,
    mode,
    batchSize,
    tables,
    ensureTables,
    includeSensitive
  });

  console.log(JSON.stringify(summary, null, 2));
};

run().catch((error) => {
  console.error("[push:hana] Falha no sync SQLite -> HANA");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
