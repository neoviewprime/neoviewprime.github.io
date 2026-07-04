export interface HanaConnectionOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  schema: string;
  database?: string;
  encrypt?: boolean;
  validateCertificate?: boolean;
  connectTimeoutMs?: number;
}

interface HanaPreparedStatement {
  exec(params: unknown[], callback: (error: Error | null, result?: unknown) => void): void;
  drop?(callback: (error: Error | null) => void): void;
}

interface HanaConnection {
  connect(options: Record<string, unknown>, callback: (error: Error | null) => void): void;
  exec(sql: string, callback: (error: Error | null, rows?: unknown) => void): void;
  prepare(sql: string, callback: (error: Error | null, statement?: HanaPreparedStatement) => void): void;
  disconnect(callback: (error: Error | null) => void): void;
}

interface HanaDriver {
  createConnection(): HanaConnection;
}

export interface HanaClient {
  exec(sql: string): Promise<unknown>;
  query<T = Record<string, unknown>>(sql: string): Promise<T[]>;
  executePrepared(sql: string, params: unknown[]): Promise<unknown>;
  close(): Promise<void>;
}

const loadHanaDriver = (): HanaDriver => {
  const requireFn = eval("require") as NodeRequire;
  try {
    return requireFn("@sap/hana-client") as HanaDriver;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Driver opcional do SAP HANA nao encontrado. Instale com \`npm --prefix server install @sap/hana-client\`. Detalhe: ${message}`
    );
  }
};

const normalizeBoolean = (value: boolean | undefined, fallback: boolean): string => (value ?? fallback ? "true" : "false");

export const createHanaClient = async (options: HanaConnectionOptions): Promise<HanaClient> => {
  const driver = loadHanaDriver();
  const connection = driver.createConnection();

  const connectionOptions: Record<string, unknown> = {
    serverNode: `${options.host}:${options.port}`,
    uid: options.user,
    pwd: options.password,
    currentSchema: options.schema,
    encrypt: normalizeBoolean(options.encrypt, true),
    sslValidateCertificate: normalizeBoolean(options.validateCertificate, false),
    communicationTimeout: options.connectTimeoutMs ?? 30000
  };

  if (options.database) {
    connectionOptions.databaseName = options.database;
  }

  await new Promise<void>((resolve, reject) => {
    connection.connect(connectionOptions, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  const exec = (sql: string) =>
    new Promise<unknown>((resolve, reject) => {
      connection.exec(sql, (error, rows) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(rows);
      });
    });

  return {
    exec,
    query: async <T = Record<string, unknown>>(sql: string) => {
      const result = await exec(sql);
      return Array.isArray(result) ? (result as T[]) : [];
    },
    executePrepared: async (sql: string, params: unknown[]) => {
      const statement = await new Promise<HanaPreparedStatement>((resolve, reject) => {
        connection.prepare(sql, (error, prepared) => {
          if (error || !prepared) {
            reject(error ?? new Error("Falha ao preparar comando no SAP HANA"));
            return;
          }
          resolve(prepared);
        });
      });

      try {
        return await new Promise<unknown>((resolve, reject) => {
          statement.exec(params, (error, result) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(result);
          });
        });
      } finally {
        if (typeof statement.drop === "function") {
          await new Promise<void>((resolve) => {
            statement.drop?.(() => resolve());
          });
        }
      }
    },
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        connection.disconnect((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  };
};
