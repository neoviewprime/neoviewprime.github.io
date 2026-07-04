import { env } from "../config/env";
import { createSqliteConnection, SqliteLikeClient } from "../integrations/sqlite/sqliteConnection";

export type DbProvider = "sqlite";

export interface DbQueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  provider: DbProvider;
  query<T = unknown>(sql: string, params?: unknown[]): Promise<DbQueryResult<T>>;
  transaction<T>(callback: (client: DbClient) => Promise<T>): Promise<T>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

let clientPromise: Promise<DbClient> | null = null;

const mapSqliteClient = (sqlite: SqliteLikeClient): DbClient => {
  const client: DbClient = {
    provider: "sqlite",
    query: (sql, params) => sqlite.query(sql, params),
    transaction: (callback) => sqlite.transaction(() => callback(client)),
    ping: () => sqlite.ping(),
    close: () => sqlite.close()
  };

  return client;
};

const createClient = async (): Promise<DbClient> => {
  const sqlite = await createSqliteConnection();
  return mapSqliteClient(sqlite);
};

export const getDbClient = async (): Promise<DbClient> => {
  if (!clientPromise) {
    clientPromise = createClient();
  }
  return clientPromise;
};
