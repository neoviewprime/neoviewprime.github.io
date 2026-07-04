import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const codespacesEnv = {
  ...process.env,
  CODESPACES: process.env.CODESPACES || "true",
  HOST: "0.0.0.0",
  PORT: process.env.PORT || "3390",
  VITE_PORT: process.env.VITE_PORT || "8080",
  CLIENT_URL: process.env.CLIENT_URL || "http://127.0.0.1:8080",
  VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3390",
  DB_PROVIDER: "sqlite",
  DB_CLIENT: "sqlite",
  SQLITE_PATH: process.env.SQLITE_PATH || "data/neoview.sqlite",
  VECTOR_PROVIDER: "sqlite",
};

const processes = [
  {
    name: "server",
    command: npmCommand,
    args: ["run", "dev"],
    cwd: path.join(projectRoot, "server"),
  },
  {
    name: "client",
    command: npmCommand,
    args: ["run", "dev:client"],
    cwd: projectRoot,
  },
];

const children = processes.map((proc) =>
  spawn(proc.command, proc.args, {
    stdio: "inherit",
    env: codespacesEnv,
    cwd: proc.cwd,
    shell: process.platform === "win32",
  })
);

const shutdown = (signal = "SIGTERM") => {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

for (const [index, child] of children.entries()) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${processes[index].name}] exited with code ${code}`);
      shutdown();
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});
