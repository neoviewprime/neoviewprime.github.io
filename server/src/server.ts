import express from "express";
import cors from "cors";
import path from "node:path";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { authRoutes } from "./routes/authRoutes";
import { reportRoutes } from "./routes/reportRoutes";
import { searchRoutes } from "./routes/searchRoutes";
import { chatRoutes } from "./routes/chatRoutes";
import { userRoutes } from "./routes/userRoutes";
import { superadminRoutes } from "./routes/superadminRoutes";
import { notificationRoutes } from "./routes/notificationRoutes";
import { getDbClient } from "./db/connection";
import { runMigrations } from "./db/migrate";
import { reportCatalogService } from "./services/reportCatalogService";
import { reportIntegrityService } from "./services/reportIntegrityService";
import { reportCatalogSemanticSyncService } from "./services/reportCatalogSemanticSyncService";
import { superadminService } from "./services/superadminService";

const app = express();
const webDistPath = path.resolve(__dirname, "../../dist");

const privateOriginPattern =
  /^https?:\/\/(?:(?:localhost|127(?:\.\d{1,3}){3})|(?:10(?:\.\d{1,3}){3})|(?:192\.168(?:\.\d{1,3}){2})|(?:172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}))(?::\d+)?$/i;

const isAllowedOrigin = (origin: string): boolean => {
  const allowed = [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean);
  return allowed.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) || privateOriginPattern.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin ${origin}`));
    }
  })
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_req, res) => {
  const db = await getDbClient();
  const ok = await db.ping().catch(() => false);

  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "error",
    database: db.provider
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/chat", chatRoutes);

app.use(express.static(webDistPath));

app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(webDistPath, "index.html"));
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error", { message: error.message });
  res.status(500).json({ error: "Internal server error" });
});

const bootstrap = async (): Promise<void> => {
  await runMigrations();
  await superadminService.ensureDefaultSuperadmins();

  const rebuild = await reportCatalogService.rebuildJsonFilesFromCatalog();
  logger.info("Catalog rebuild from database completed", rebuild);

  const sync = await reportCatalogService.syncCatalogFilesToDatabase();
  logger.info("Catalog sync on startup completed", sync);

  const semanticSync = await reportCatalogSemanticSyncService.syncAllCatalogDocuments();
  logger.info("Catalog semantic sync on startup completed", semanticSync);

  const demoPending = await reportCatalogService.ensureDemoPendingReports();
  logger.info("Demo pending reports ensured", demoPending);

  const integrityRepair = await reportIntegrityService.repairCatalogIntegrity();
  logger.info("Catalog integrity snapshot after startup repair", integrityRepair.after);

  app.listen(env.PORT, env.HOST, () => {
    logger.info(`Server running on http://${env.HOST}:${env.PORT}`);
  });
};

bootstrap().catch((error) => {
  logger.error("Bootstrap failure; server will not start", { error: (error as Error).message });
  process.exit(1);
});



