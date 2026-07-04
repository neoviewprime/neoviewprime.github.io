import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const commonEnv = {
  ...process.env,
  npm_config_audit: process.env.npm_config_audit || "false",
  npm_config_fund: process.env.npm_config_fund || "false",
};

const runStep = (label, command, args, cwd = projectRoot, useShell = false) => {
  console.log(`[workflow] ${label}`);

  const invocation = useShell ? `${command} ${args.join(" ")}`.trim() : command;
  const result = spawnSync(invocation, useShell ? [] : args, {
    cwd,
    stdio: "inherit",
    shell: useShell,
    env: commonEnv,
  });

  if (result.error) {
    console.error(`[workflow] Falha ao executar ${label}: ${result.error.message}`);
    process.exit(1);
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
};

const runNodeScript = (label, scriptName) => {
  runStep(label, process.execPath, [path.join(projectRoot, "scripts", scriptName)]);
};

const runNpmScript = (label, scriptName, cwd = projectRoot) => {
  runStep(label, npmCommand, ["run", scriptName], cwd, true);
};

const workflows = {
  setup: () => {
    runNodeScript("Instalando dependencias necessarias", "bootstrap-install.mjs");
    runNodeScript("Ajustando arquivos .env", "setup-env.mjs");
    runNodeScript("Validando ambiente local", "verify-setup.mjs");
  },
  build: () => {
    runNpmScript("Build do frontend", "build:client");
    runNpmScript("Build do backend", "build:server");
  },
  "prepare-dev": () => {
    workflows.setup();
  },
  "prepare-start": () => {
    workflows.setup();
    workflows.build();
  },
};

const workflowName = process.argv[2];

if (!workflowName || !(workflowName in workflows)) {
  console.error("[workflow] Informe um fluxo valido: setup, build, prepare-dev ou prepare-start.");
  process.exit(1);
}

workflows[workflowName]();
