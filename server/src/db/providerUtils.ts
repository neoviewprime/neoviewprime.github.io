import { DbClient } from "./connection";

export const toDbArray = (db: DbClient, values: string[]): string[] | string =>
  JSON.stringify(values);

export const fromDbArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

export const fromDbJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return fallback;
};

export const readInsertedId = async (
  db: DbClient,
  table: string,
  keyColumn: string,
  keyValue: string
): Promise<string | null> => {
  const result = await db.query<{ id: string }>(
    `SELECT id FROM ${table} WHERE ${keyColumn} = $1 LIMIT 1`,
    [keyValue]
  );
  return result.rows[0]?.id ?? null;
};
