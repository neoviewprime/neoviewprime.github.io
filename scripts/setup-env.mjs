import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildRecommendedEnvDefaults, normalizeEnvValue, parseEnvFile, upsertEnvValue } from "./env-file-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const recommended = buildRecommendedEnvDefaults();

const targets = [
  {
    label: "frontend env",
    source: path.join(projectRoot, ".env.example"),
    target: path.join(projectRoot, ".env"),
    defaults: recommended.root,
  },
  {
    label: "backend env",
    source: path.join(projectRoot, "server", ".env.example"),
    target: path.join(projectRoot, "server", ".env"),
    defaults: recommended.server,
  },
];

for (const item of targets) {
  if (existsSync(item.target)) {
    console.log(`[setup:env] Revisando ${item.label}: ${path.relative(projectRoot, item.target)} ja existe.`);
  } else {
    copyFileSync(item.source, item.target);
    console.log(`[setup:env] Criado ${path.relative(projectRoot, item.target)} a partir do arquivo de exemplo.`);
  }

  let content = readFileSync(item.target, "utf8");
  const envValues = parseEnvFile(content);
  const repairedKeys = [];

  for (const [key, value] of Object.entries(item.defaults)) {
    if (normalizeEnvValue(envValues.get(key)) !== null) {
      continue;
    }

    content = upsertEnvValue(content, key, value);
    repairedKeys.push(key);
  }

  if (repairedKeys.length > 0) {
    writeFileSync(item.target, content, "utf8");
    console.log(`[setup:env] Corrigido ${path.relative(projectRoot, item.target)}: ${repairedKeys.join(", ")}.`);
  }
}

if (recommended.lanAddress) {
  console.log(`[setup:env] URL sugerida para acesso na rede interna: http://${recommended.lanAddress}:${recommended.frontendPort}`);
}

console.log("[setup:env] Revise as portas, URLs e segredos locais antes de subir o projeto.");
