import path from "node:path";
import { mkdirSync } from "node:fs";
import Database from "better-sqlite3";
import { env } from "../../config/env";

export interface SqliteLikeClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  transaction<T>(callback: (client: SqliteLikeClient) => Promise<T>): Promise<T>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

const ensureDirectory = (filePath: string) => {
  const directory = path.dirname(filePath);
  mkdirSync(directory, { recursive: true });
};

const adaptSqlForSqlite = (sql: string): string =>
  sql
    .replace(/::jsonb/gi, "")
    .replace(/::vector/gi, "")
    .replace(/::text\[\]/gi, "")
    .replace(/\bCURRENT_UTCTIMESTAMP\b/gi, "CURRENT_TIMESTAMP")
    .replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP")
    .replace(/\bILIKE\b/gi, "LIKE")
    .replace(/\bNULLS\s+LAST\b/gi, "")
    .replace(/\bTRUE\b/gi, "1")
    .replace(/\bFALSE\b/gi, "0")
    .replace(/\bNEWUID\(\)/gi, "lower(hex(randomblob(16)))");

const mapParamsForSqlite = (sql: string, params: unknown[] = []): { sql: string; params: unknown[] } => {
  const positions = Array.from(sql.matchAll(/\$(\d+)/g)).map((match) => Number(match[1]));
  if (positions.length === 0) {
    return { sql: adaptSqlForSqlite(sql), params };
  }

  const ordered = positions.map((index) => params[index - 1]);
  const rewritten = adaptSqlForSqlite(sql).replace(/\$(\d+)/g, "?");
  return { sql: rewritten, params: ordered };
};

export const createSqliteConnection = async (): Promise<SqliteLikeClient> => {
  const filePath = path.resolve(process.cwd(), env.SQLITE_PATH);
  ensureDirectory(filePath);
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  let transactionDepth = 0;

  const client: SqliteLikeClient = {
    query: async <T>(sql: string, params?: unknown[]) => {
      const mapped = mapParamsForSqlite(sql, params);
      const trimmed = mapped.sql.trim().toLowerCase();
      if (trimmed.startsWith("select") || trimmed.startsWith("pragma")) {
        const statement = db.prepare(mapped.sql);
        const rows = statement.all(...mapped.params) as T[];
        return { rows, rowCount: rows.length };
      }

      const statement = db.prepare(mapped.sql);
      const result = statement.run(...mapped.params);
      return { rows: [], rowCount: result.changes ?? 0 };
    },
    transaction: async <T>(callback: (activeClient: SqliteLikeClient) => Promise<T>) => {
      const ownsTransaction = transactionDepth === 0;
      if (ownsTransaction) {
        db.exec("BEGIN IMMEDIATE");
      }

      transactionDepth += 1;

      try {
        const result = await callback(client);
        transactionDepth -= 1;
        if (ownsTransaction) {
          db.exec("COMMIT");
        }
        return result;
      } catch (error) {
        transactionDepth = Math.max(0, transactionDepth - 1);
        if (ownsTransaction) {
          try {
            db.exec("ROLLBACK");
          } catch {
            // If SQLite already rolled back due to an internal error, keep the original failure.
          }
        }
        throw error;
      }
    },
    ping: async () => {
      const row = db.prepare("SELECT 1 AS ok").get() as { ok?: number } | undefined;
      return row?.ok === 1;
    },
    close: async () => {
      db.close();
    }
  };

  return client;
};
