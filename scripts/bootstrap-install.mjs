import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const installArgs = ["install", "--no-audit", "--no-fund"];
const commonEnv = {
  ...process.env,
  npm_config_audit: process.env.npm_config_audit || "false",
  npm_config_fund: process.env.npm_config_fund || "false",
};

const installIfMissing = (label, checkPath, args, cwd) => {
  if (existsSync(checkPath)) {
    console.log(`[bootstrap:install] ${label} ja presentes.`);
    return;
  }

  console.log(`[bootstrap:install] ${label} ausentes. Instalando...`);
  const result = spawnSync(`${npmCommand} ${args.join(" ")}`, [], {
    cwd,
    stdio: "inherit",
    shell: true,
    env: commonEnv,
  });

  if (result.error) {
    console.error(`[bootstrap:install] Falha ao instalar ${label.toLowerCase()}: ${result.error.message}`);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
};

installIfMissing(
  "Dependencias da raiz",
  path.join(projectRoot, "node_modules"),
  installArgs,
  projectRoot
);

installIfMissing(
  "Dependencias do backend",
  path.join(projectRoot, "server", "node_modules"),
  ["--prefix", "server", ...installArgs],
  projectRoot
);

console.log("[bootstrap:install] Dependencias prontas.");
