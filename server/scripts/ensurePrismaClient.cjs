const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const serverRoot = path.resolve(__dirname, "..");
const generatedClientPath = path.join(serverRoot, "src", "generated", "prisma", "client.ts");

if (fs.existsSync(generatedClientPath)) {
  console.log("[prisma] Prisma Client already present in src/generated/prisma.");
  process.exit(0);
}

console.log("[prisma] Prisma Client not found. Running prisma generate...");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["prisma", "generate"], {
  cwd: serverRoot,
  stdio: "inherit",
  shell: false
});

if (result.status !== 0) {
  console.error(
    "[prisma] Failed to generate Prisma Client automatically. " +
      "Run `npm --prefix server run prisma:generate` after confirming Prisma can access its engine."
  );
  process.exit(result.status ?? 1);
}

