import { spawn } from "node:child_process";
import { networkInterfaces } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const serverRoot = path.join(projectRoot, "server");

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "3389";

const resolveLanAddresses = () => {
  const nets = networkInterfaces();
  const addresses = [];

  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      addresses.push(entry.address);
    }
  }

  return addresses;
};

const lanAddresses = resolveLanAddresses();

console.log(`Starting NeoView on ${host}:${port}`);
if (lanAddresses.length > 0) {
  console.log("Available network URLs:");
  for (const address of lanAddresses) {
    console.log(`  http://${address}:${port}`);
  }
}

const child = spawn(npmCommand, ["run", "start"], {
  cwd: serverRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    HOST: host,
    PORT: port,
    NODE_ENV: process.env.NODE_ENV || "production",
    CLIENT_URL: process.env.CLIENT_URL || `http://localhost:${port}`,
  },
  shell: process.platform === "win32",
});

const shutdown = (signal = "SIGTERM") => {
  if (!child.killed) {
    child.kill(signal);
  }
};

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});
