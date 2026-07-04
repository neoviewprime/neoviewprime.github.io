export interface HanaMergeStatementOptions {
  schema: string;
  table: string;
  columns: string[];
  keyColumns: string[];
}

export interface SqliteTableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

const LARGE_TEXT_COLUMN_NAMES = new Set([
  "dashboard_layout",
  "favorite_reports",
  "analytics_workspaces",
  "json_content",
  "raw_json",
  "payload",
  "metadata",
  "embedding",
  "query_embedding",
  "response",
  "chunk_text",
  "old_values",
  "new_values",
  "message",
  "comments"
]);

export const quoteHanaIdentifier = (value: string): string => `"${value.replace(/"/g, "\"\"")}"`;

export const buildQualifiedHanaName = (schema: string, table: string): string =>
  `${quoteHanaIdentifier(schema)}.${quoteHanaIdentifier(table)}`;

export const buildMergeStatement = (options: HanaMergeStatementOptions): string => {
  const { schema, table, columns, keyColumns } = options;
  const qualifiedName = buildQualifiedHanaName(schema, table);
  const aliases = columns.map((column) => `? AS ${quoteHanaIdentifier(column)}`).join(", ");
  const joinClause = keyColumns
    .map((column) => `T.${quoteHanaIdentifier(column)} = S.${quoteHanaIdentifier(column)}`)
    .join(" AND ");
  const updateColumns = columns.filter((column) => !keyColumns.includes(column));
  const effectiveUpdateColumns = updateColumns.length > 0 ? updateColumns : keyColumns;
  const updateClause = effectiveUpdateColumns
    .map((column) => `T.${quoteHanaIdentifier(column)} = S.${quoteHanaIdentifier(column)}`)
    .join(", ");
  const insertColumns = columns.map((column) => quoteHanaIdentifier(column)).join(", ");
  const insertValues = columns.map((column) => `S.${quoteHanaIdentifier(column)}`).join(", ");

  return [
    `MERGE INTO ${qualifiedName} AS T`,
    `USING (SELECT ${aliases} FROM DUMMY) AS S`,
    `ON ${joinClause}`,
    `WHEN MATCHED THEN UPDATE SET ${updateClause}`,
    `WHEN NOT MATCHED THEN INSERT (${insertColumns}) VALUES (${insertValues})`
  ].join(" ");
};

const mapSqliteTypeToHana = (column: SqliteTableColumnInfo): string => {
  const rawType = (column.type || "TEXT").toUpperCase();
  const columnName = column.name.toLowerCase();

  if (rawType.includes("INT")) return "BIGINT";
  if (rawType.includes("REAL") || rawType.includes("FLOA") || rawType.includes("DOUB")) return "DOUBLE";
  if (rawType.includes("DEC") || rawType.includes("NUM")) return "DECIMAL(18, 6)";
  if (rawType.includes("BLOB")) return "BLOB";
  if (rawType.includes("CLOB")) return "NCLOB";
  if (LARGE_TEXT_COLUMN_NAMES.has(columnName)) return "NCLOB";
  return "NVARCHAR(5000)";
};

export const buildCreateColumnTableSql = (schema: string, table: string, columns: SqliteTableColumnInfo[]): string => {
  const qualifiedName = buildQualifiedHanaName(schema, table);
  const primaryKeys = [...columns]
    .filter((column) => column.pk > 0)
    .sort((left, right) => left.pk - right.pk)
    .map((column) => quoteHanaIdentifier(column.name));

  const columnDefinitions = columns.map((column) => {
    const definition = [
      quoteHanaIdentifier(column.name),
      mapSqliteTypeToHana(column),
      column.notnull ? "NOT NULL" : "NULL"
    ];
    return definition.join(" ");
  });

  if (primaryKeys.length > 0) {
    columnDefinitions.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);
  }

  return `CREATE COLUMN TABLE ${qualifiedName} (${columnDefinitions.join(", ")})`;
};

export const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};
