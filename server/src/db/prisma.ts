import { env } from "../config/env";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  `file:${String(env.SQLITE_PATH || "data/neoview.sqlite")
    .replace(/\\/g, "/")
    .replace(/^(?!\.\/)/, "./")}`;

const adapter = new PrismaBetterSqlite3({
  url: databaseUrl
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
