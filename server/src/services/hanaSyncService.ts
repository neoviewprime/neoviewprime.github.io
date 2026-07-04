import { getDbClient } from "../db/connection";
import { createHanaClient, type HanaClient, type HanaConnectionOptions } from "../integrations/sap-hana/hanaClient";
import {
  buildCreateColumnTableSql,
  buildMergeStatement,
  buildQualifiedHanaName,
  chunkArray,
  quoteHanaIdentifier,
  type SqliteTableColumnInfo
} from "../integrations/sap-hana/sqlBuilders";

type SyncMode = "full" | "incremental";

interface HanaSyncPlan {
  tableName: string;
  keyColumns: string[];
  cursorColumn?: string;
  enabledByDefault?: boolean;
  incrementalSafe?: boolean;
}

export interface HanaSyncOptions {
  connection: HanaConnectionOptions;
  mode: SyncMode;
  batchSize: number;
  tables?: string[];
  ensureTables?: boolean;
  includeSensitive?: boolean;
}

export interface HanaTableSyncSummary {
  tableName: string;
  status: "synced" | "skipped" | "failed";
  rowsRead: number;
  rowsWritten: number;
  cursorValue: string | null;
  reason?: string;
}

export interface HanaSyncSummary {
  startedAt: string;
  finishedAt: string;
  mode: SyncMode;
  schema: string;
  batchSize: number;
  tables: HanaTableSyncSummary[];
}

const SYNC_META_TABLE = "NEOVIEW_SYNC_META";

const syncPlans: HanaSyncPlan[] = [
  { tableName: "roles", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "users", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "user_roles", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "user_preferences", keyColumns: ["user_id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_catalog", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "reports", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_submissions", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "utd_submission_drafts", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "utd_flow_reports", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_approvals", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "approval_delegations", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_engagement_metrics", keyColumns: ["id"], cursorColumn: "updated_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_engagement_events", keyColumns: ["id"], cursorColumn: "occurred_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_comments", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_likes", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_shares", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "report_share_monitoring", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "notifications", keyColumns: ["id"], enabledByDefault: true, incrementalSafe: false },
  { tableName: "chat_sessions", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "chat_messages", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "audit_logs", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: true, incrementalSafe: true },
  { tableName: "semantic_cache", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: false, incrementalSafe: true },
  { tableName: "report_chunks", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: false, incrementalSafe: true },
  { tableName: "auth_sessions", keyColumns: ["id"], cursorColumn: "created_at", enabledByDefault: false, incrementalSafe: true },
  { tableName: "user_credentials", keyColumns: ["user_id"], cursorColumn: "updated_at", enabledByDefault: false, incrementalSafe: true }
];

const quoteSqliteIdentifier = (value: string): string => `"${value.replace(/"/g, "\"\"")}"`;

const normalizeTableFilter = (tables?: string[]) =>
  new Set((tables ?? []).map((table) => table.trim().toLowerCase()).filter(Boolean));

const sanitizeValue = (value: unknown): string | number | null => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return JSON.stringify(value);
};

const coerceCursorValue = (value: unknown): string | null => {
  if (value == null) return null;
  return String(value);
};

const ensureSchemaExists = async (hana: HanaClient, schema: string) => {
  const escapedSchema = schema.replace(/'/g, "''").toUpperCase();
  const rows = await hana.query<{ COUNT?: number; count?: number }>(
    `SELECT COUNT(*) AS COUNT FROM SYS.SCHEMAS WHERE SCHEMA_NAME = '${escapedSchema}'`
  );
  const count = Number(rows[0]?.COUNT ?? rows[0]?.count ?? 0);
  if (count === 0) {
    await hana.exec(`CREATE SCHEMA ${quoteHanaIdentifier(schema)}`);
  }
};

const ensureSyncMetaTable = async (hana: HanaClient, schema: string) => {
  await ensureSchemaExists(hana, schema);
  const escapedSchema = schema.replace(/'/g, "''").toUpperCase();
  const escapedTable = SYNC_META_TABLE.replace(/'/g, "''").toUpperCase();
  const rows = await hana.query<{ COUNT?: number; count?: number }>(
    `SELECT COUNT(*) AS COUNT FROM SYS.TABLES WHERE SCHEMA_NAME = '${escapedSchema}' AND TABLE_NAME = '${escapedTable}'`
  );
  const count = Number(rows[0]?.COUNT ?? rows[0]?.count ?? 0);
  if (count > 0) return;

  await hana.exec(
    `CREATE COLUMN TABLE ${buildQualifiedHanaName(schema, SYNC_META_TABLE)} (
      ${quoteHanaIdentifier("table_name")} NVARCHAR(255) NOT NULL,
      ${quoteHanaIdentifier("last_success_at")} NVARCHAR(40) NULL,
      ${quoteHanaIdentifier("last_cursor_value")} NVARCHAR(5000) NULL,
      ${quoteHanaIdentifier("last_row_count")} BIGINT NULL,
      ${quoteHanaIdentifier("last_error")} NCLOB NULL,
      PRIMARY KEY (${quoteHanaIdentifier("table_name")})
    )`
  );
};

const getSyncMeta = async (hana: HanaClient, schema: string, tableName: string) => {
  const escapedTableName = tableName.replace(/'/g, "''");
  const rows = await hana.query<{
    last_success_at?: string | null;
    last_cursor_value?: string | null;
    last_row_count?: number | null;
    last_error?: string | null;
  }>(
    `SELECT last_success_at, last_cursor_value, last_row_count, last_error
     FROM ${buildQualifiedHanaName(schema, SYNC_META_TABLE)}
     WHERE table_name = '${escapedTableName}'`
  );
  return rows[0] ?? null;
};

const upsertSyncMeta = async (
  hana: HanaClient,
  schema: string,
  tableName: string,
  values: { lastSuccessAt: string; lastCursorValue: string | null; lastRowCount: number; lastError: string | null }
) => {
  const columns = ["table_name", "last_success_at", "last_cursor_value", "last_row_count", "last_error"];
  const sql = buildMergeStatement({
    schema,
    table: SYNC_META_TABLE,
    columns,
    keyColumns: ["table_name"]
  });

  await hana.executePrepared(sql, [
    tableName,
    values.lastSuccessAt,
    values.lastCursorValue,
    values.lastRowCount,
    values.lastError
  ]);
};

const listSourceColumns = async (tableName: string): Promise<SqliteTableColumnInfo[]> => {
  const db = await getDbClient();
  const result = await db.query<SqliteTableColumnInfo>(`PRAGMA table_info(${quoteSqliteIdentifier(tableName)})`);
  return result.rows;
};

const destinationTableExists = async (hana: HanaClient, schema: string, tableName: string): Promise<boolean> => {
  const escapedSchema = schema.replace(/'/g, "''").toUpperCase();
  const escapedTable = tableName.replace(/'/g, "''").toUpperCase();
  const rows = await hana.query<{ COUNT?: number; count?: number }>(
    `SELECT COUNT(*) AS COUNT FROM SYS.TABLES WHERE SCHEMA_NAME = '${escapedSchema}' AND TABLE_NAME = '${escapedTable}'`
  );
  return Number(rows[0]?.COUNT ?? rows[0]?.count ?? 0) > 0;
};

const ensureDestinationTable = async (hana: HanaClient, schema: string, tableName: string, ensureTables: boolean) => {
  const exists = await destinationTableExists(hana, schema, tableName);
  if (exists) return;

  if (!ensureTables) {
    throw new Error(
      `Tabela de destino ${schema}.${tableName} nao existe no HANA. Rode novamente com --ensure-tables para criar a estrutura base automaticamente.`
    );
  }

  const columns = await listSourceColumns(tableName);
  if (columns.length === 0) {
    throw new Error(`Tabela de origem ${tableName} nao encontrada no SQLite.`);
  }

  const sql = buildCreateColumnTableSql(schema, tableName, columns);
  await hana.exec(sql);
};

const buildSourceQuery = (
  plan: HanaSyncPlan,
  mode: SyncMode,
  lastCursorValue: string | null,
  limit: number,
  offset: number
) => {
  const cursorEnabled = mode === "incremental" && plan.incrementalSafe !== false && Boolean(plan.cursorColumn);
  const orderColumns = [plan.cursorColumn, ...plan.keyColumns].filter(Boolean) as string[];
  const params: unknown[] = [];
  const whereClauses: string[] = [];

  if (cursorEnabled && lastCursorValue) {
    params.push(lastCursorValue);
    whereClauses.push(`${quoteSqliteIdentifier(plan.cursorColumn!)} > $${params.length}`);
  }

  params.push(limit);
  const limitPlaceholder = `$${params.length}`;
  params.push(offset);
  const offsetPlaceholder = `$${params.length}`;

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const orderClause = orderColumns.length > 0
    ? `ORDER BY ${orderColumns.map((column) => quoteSqliteIdentifier(column)).join(", ")}`
    : "";

  return {
    sql: `SELECT * FROM ${quoteSqliteIdentifier(plan.tableName)} ${whereClause} ${orderClause} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    params
  };
};

const readSourceBatch = async (
  plan: HanaSyncPlan,
  mode: SyncMode,
  lastCursorValue: string | null,
  limit: number,
  offset: number
) => {
  const db = await getDbClient();
  const query = buildSourceQuery(plan, mode, lastCursorValue, limit, offset);
  const result = await db.query<Record<string, unknown>>(query.sql, query.params);
  return result.rows;
};

const resolvePlans = (options: HanaSyncOptions): HanaSyncPlan[] => {
  const tableFilter = normalizeTableFilter(options.tables);
  const includeSensitive = options.includeSensitive ?? false;

  return syncPlans.filter((plan) => {
    if (tableFilter.size > 0 && !tableFilter.has(plan.tableName.toLowerCase())) {
      return false;
    }

    const sensitive = plan.tableName === "user_credentials" || plan.tableName === "auth_sessions";
    if (sensitive && !includeSensitive) {
      return false;
    }

    if (tableFilter.size === 0) {
      return plan.enabledByDefault !== false;
    }

    return true;
  });
};

const syncTable = async (
  hana: HanaClient,
  schema: string,
  plan: HanaSyncPlan,
  options: HanaSyncOptions
): Promise<HanaTableSyncSummary> => {
  const meta = await getSyncMeta(hana, schema, plan.tableName);
  const startingCursor =
    options.mode === "incremental" && plan.incrementalSafe !== false ? (meta?.last_cursor_value ?? null) : null;

  await ensureDestinationTable(hana, schema, plan.tableName, options.ensureTables ?? false);

  let offset = 0;
  let rowsRead = 0;
  let rowsWritten = 0;
  let latestCursorValue = startingCursor;

  while (true) {
    const rows = await readSourceBatch(plan, options.mode, startingCursor, options.batchSize, offset);
    if (rows.length === 0) break;

    const columnNames = Object.keys(rows[0]);
    const mergeSql = buildMergeStatement({
      schema,
      table: plan.tableName,
      columns: columnNames,
      keyColumns: plan.keyColumns
    });

    for (const chunk of chunkArray(rows, Math.max(1, Math.min(options.batchSize, 250)))) {
      for (const row of chunk) {
        const params = columnNames.map((column) => sanitizeValue(row[column]));
        await hana.executePrepared(mergeSql, params);
        rowsWritten += 1;
        if (plan.cursorColumn) {
          latestCursorValue = coerceCursorValue(row[plan.cursorColumn]);
        }
      }
    }

    rowsRead += rows.length;
    offset += rows.length;
  }

  return {
    tableName: plan.tableName,
    status: "synced",
    rowsRead,
    rowsWritten,
    cursorValue: latestCursorValue
  };
};

export const hanaSyncService = {
  listPlans() {
    return syncPlans.map((plan) => ({
      tableName: plan.tableName,
      keyColumns: plan.keyColumns,
      cursorColumn: plan.cursorColumn ?? null,
      enabledByDefault: plan.enabledByDefault !== false,
      incrementalSafe: plan.incrementalSafe !== false
    }));
  },

  async syncToHana(options: HanaSyncOptions): Promise<HanaSyncSummary> {
    const startedAt = new Date().toISOString();
    const plans = resolvePlans(options);
    const hana = await createHanaClient(options.connection);

    try {
      await ensureSyncMetaTable(hana, options.connection.schema);
      const tableSummaries: HanaTableSyncSummary[] = [];

      for (const plan of plans) {
        try {
          const summary = await syncTable(hana, options.connection.schema, plan, options);
          tableSummaries.push(summary);
          await upsertSyncMeta(hana, options.connection.schema, plan.tableName, {
            lastSuccessAt: new Date().toISOString(),
            lastCursorValue: summary.cursorValue,
            lastRowCount: summary.rowsWritten,
            lastError: null
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const failedSummary: HanaTableSyncSummary = {
            tableName: plan.tableName,
            status: "failed",
            rowsRead: 0,
            rowsWritten: 0,
            cursorValue: null,
            reason: message
          };
          tableSummaries.push(failedSummary);
          await upsertSyncMeta(hana, options.connection.schema, plan.tableName, {
            lastSuccessAt: new Date().toISOString(),
            lastCursorValue: null,
            lastRowCount: 0,
            lastError: message
          });
        }
      }

      return {
        startedAt,
        finishedAt: new Date().toISOString(),
        mode: options.mode,
        schema: options.connection.schema,
        batchSize: options.batchSize,
        tables: tableSummaries
      };
    } finally {
      await hana.close();
    }
  }
};
