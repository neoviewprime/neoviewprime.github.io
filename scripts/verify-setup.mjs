import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRecommendedEnvDefaults, normalizeEnvValue, parseEnvFile } from "./env-file-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const [nodeMajor] = process.versions.node.split(".").map((value) => Number.parseInt(value, 10));
const recommended = buildRecommendedEnvDefaults();
const rootEnvPath = path.join(projectRoot, ".env");
const serverEnvPath = path.join(projectRoot, "server", ".env");

const readEnvMap = (filePath) => parseEnvFile(readFileSync(filePath, "utf8"));

const isPositivePort = (value) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return false;
  }

  const port = Number.parseInt(normalized, 10);
  return Number.isInteger(port) && port > 0 && port <= 65535;
};

const isValidHttpUrl = (value) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return false;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isValidApiUrl = (value) => {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return false;
  }

  return normalized.startsWith("/") || isValidHttpUrl(normalized);
};

const rootEnv = existsSync(rootEnvPath) ? readEnvMap(rootEnvPath) : new Map();
const serverEnv = existsSync(serverEnvPath) ? readEnvMap(serverEnvPath) : new Map();

const checks = [
  {
    ok: Number.isFinite(nodeMajor) && nodeMajor >= 20,
    fix: `Versao do Node incompativel (${process.versions.node}). Use Node 20 ou superior para instalar dependencias e subir o projeto.`,
  },
  {
    ok: existsSync(path.join(projectRoot, "node_modules")),
    fix: "Dependencias do frontend/raiz ausentes. Rode `npm install` na raiz do projeto.",
  },
  {
    ok: existsSync(path.join(projectRoot, "server", "node_modules")),
    fix: "Backend sem dependencias instaladas. Rode `npm --prefix server install`.",
  },
  {
    ok: existsSync(path.join(projectRoot, "server", "src", "generated", "prisma", "client.ts")),
    fix: "Prisma Client gerado nao encontrado em `server/src/generated/prisma`. Rode `npm --prefix server run prisma:generate` se esse diretorio nao veio no ZIP.",
  },
  {
    ok: existsSync(rootEnvPath),
    fix: "Arquivo `.env` ausente. Rode `npm run setup:env` ou copie `.env.example` para `.env`.",
  },
  {
    ok: existsSync(serverEnvPath),
    fix: "Arquivo `server/.env` ausente. Rode `npm run setup:env` ou copie `server/.env.example` para `server/.env`.",
  },
  {
    ok: !existsSync(rootEnvPath) || isPositivePort(rootEnv.get("VITE_PORT")),
    fix: `\`.env\` com \`VITE_PORT\` ausente ou invalido. Rode \`npm run setup:env\` para restaurar a porta ${recommended.frontendPort}.`,
  },
  {
    ok: !existsSync(rootEnvPath) || isPositivePort(rootEnv.get("PORT")),
    fix: `\`.env\` com \`PORT\` ausente ou invalido. Rode \`npm run setup:env\` para restaurar a porta ${recommended.backendPort}.`,
  },
  {
    ok: !existsSync(rootEnvPath) || isValidApiUrl(rootEnv.get("VITE_API_URL")),
    fix: "`.env` com `VITE_API_URL` vazio, `null` ou invalido. Use `/api` ou uma URL HTTP valida.",
  },
  {
    ok: !existsSync(rootEnvPath) || isValidHttpUrl(rootEnv.get("VITE_API_PROXY_TARGET")),
    fix: `\`.env\` com \`VITE_API_PROXY_TARGET\` vazio, \`null\` ou invalido. Rode \`npm run setup:env\` para restaurar \`http://127.0.0.1:${recommended.backendPort}\`.`,
  },
  {
    ok: !existsSync(serverEnvPath) || normalizeEnvValue(serverEnv.get("HOST")) !== null,
    fix: "Arquivo `server/.env` com `HOST` vazio, `null` ou `undefined`. Use `0.0.0.0` para acesso local e na rede.",
  },
  {
    ok: !existsSync(serverEnvPath) || isPositivePort(serverEnv.get("PORT")),
    fix: `\`server/.env\` com \`PORT\` ausente ou invalido. Rode \`npm run setup:env\` para restaurar a porta ${recommended.backendPort}.`,
  },
  {
    ok: !existsSync(serverEnvPath) || isValidHttpUrl(serverEnv.get("CLIENT_URL")),
    fix: "Arquivo `server/.env` com `CLIENT_URL` vazio, `null` ou invalido. Rode `npm run setup:env` para recalcular a URL local.",
  },
];

const failures = checks.filter((item) => !item.ok);

if (failures.length > 0) {
  console.error("[verify:setup] O ambiente local nao esta pronto:");
  for (const failure of failures) {
    console.error(`- ${failure.fix}`);
  }
  process.exit(1);
}

console.log("[verify:setup] Ambiente local validado.");
