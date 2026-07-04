import { Router } from "express";
import { z } from "zod";
import { AuthenticatedRequest, superadminMiddleware } from "../middleware/auth";
import { reportIntegrityService } from "../services/reportIntegrityService";
import { superadminService } from "../services/superadminService";

export const superadminRoutes = Router();

const toHeaderString = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? value.join("; ") : value ?? null;

const bulkDeleteSchema = z.object({
  reportIds: z.array(z.string().uuid()).optional(),
  companyId: z.string().optional(),
  status: z.string().optional()
});

superadminRoutes.use(superadminMiddleware);

superadminRoutes.get("/overview", async (_req, res) => {
  const overview = await superadminService.getOverview();
  res.json(overview);
});

superadminRoutes.get("/activities", async (req, res) => {
  const limit = Math.max(1, Math.min(500, Number(req.query["limit"] ?? 100)));
  const items = await superadminService.listActivities(limit);
  res.json({ total: items.length, items });
});

superadminRoutes.get("/reports", async (req, res) => {
  const limit = Math.max(1, Math.min(5000, Number(req.query["limit"] ?? 1000)));
  const items = await superadminService.listReports(limit);
  res.json({ total: items.length, items });
});

superadminRoutes.get("/integrity/report", async (_req, res) => {
  const report = await reportIntegrityService.auditCatalogIntegrity();
  res.json(report);
});

superadminRoutes.post("/integrity/repair", async (req: AuthenticatedRequest, res) => {
  try {
    const result = await reportIntegrityService.repairCatalogIntegrity();
    await superadminService.logAudit({
      userId: req.user?.userId,
      action: "repair",
      entityType: "report_catalog_integrity",
      newValues: result.repaired,
      oldValues: result.before as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

superadminRoutes.delete("/reports/:id", async (req: AuthenticatedRequest, res) => {
  try {
    const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!reportId) {
      res.status(400).json({ error: "Report id is required" });
      return;
    }
    const deleted = await superadminService.deleteReportByCatalogId(reportId);
    await superadminService.logAudit({
      userId: req.user?.userId,
      action: "delete",
      entityType: "report_catalog",
      entityId: deleted.id,
      oldValues: deleted,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });
    res.json({ success: true, deleted });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

superadminRoutes.post("/reports/bulk-delete", async (req: AuthenticatedRequest, res) => {
  const parsed = bulkDeleteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await superadminService.bulkDeleteReports(parsed.data);
    await superadminService.logAudit({
      userId: req.user?.userId,
      action: "delete",
      entityType: "report_catalog_bulk",
      newValues: parsed.data,
      oldValues: result,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

superadminRoutes.post("/reset-data", async (req: AuthenticatedRequest, res) => {
  const result = await superadminService.resetBackendDataOnly();
  await superadminService.logAudit({
    userId: req.user?.userId,
    action: "reset",
    entityType: "backend_data",
    oldValues: result,
    ipAddress: req.ip,
    userAgent: toHeaderString(req.headers["user-agent"])
  });
  res.json({ success: true, ...result });
});
