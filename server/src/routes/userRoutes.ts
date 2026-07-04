import { Router } from "express";
import { ZodError, z } from "zod";
import { userManagementService } from "../services/userManagementService";
import { authMiddleware, AuthenticatedRequest, tryGetAuthenticatedUser } from "../middleware/auth";
import { superadminService } from "../services/superadminService";
import { approvalDelegationService } from "../services/approvalDelegationService";
import { userPreferenceService } from "../services/userPreferenceService";

export const userRoutes = Router();

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(120)
});

const approvalDelegationSchema = z.object({
  delegateUserId: z.string().uuid(),
  validFrom: z.string().optional(),
  validUntil: z.string().min(1),
  notes: z.string().max(1000).optional()
});

const reportMetricsSchema = z.object({
  visualizacoes: z.number().nonnegative(),
  comentarios: z.number().nonnegative(),
  curtidas: z.number().nonnegative(),
  compartilhamentos: z.number().nonnegative()
});

const favoriteReportSchema = z.object({
  report: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    date: z.string().min(1),
    size: z.string().min(1),
    description: z.string().optional(),
    url: z.string().optional(),
    metrics: reportMetricsSchema
  }),
  path: z.array(z.string()).default([]),
  companyId: z.string().optional(),
  userId: z.string().optional()
});

const analyticsWorkspaceSchema = z.object({
  id: z.string().min(1),
  actorKey: z.string().min(1),
  companyId: z.string().min(1),
  companyName: z.string().min(1),
  title: z.string().min(1),
  reportName: z.string().min(1),
  chartType: z.string().min(1),
  metrics: z.array(z.string().min(1)),
  period: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sourceReportId: z.string().optional(),
  dataMode: z.string().optional(),
  updatedAt: z.string().min(1)
});

const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(255).optional(),
  department: z.string().max(100).optional().nullable(),
  phone: z.string().max(40).optional().nullable()
}).refine((value) => value.full_name !== undefined || value.department !== undefined || value.phone !== undefined, {
  message: "At least one profile field is required"
});

const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["pt-BR", "en-US", "es-ES"]).optional(),
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
  dashboard_layout: z.record(z.string(), z.unknown()).optional(),
  favorite_reports: z.array(favoriteReportSchema).optional(),
  analytics_workspaces: z.array(analyticsWorkspaceSchema).optional()
});

const toHeaderString = (value: string | string[] | undefined): string | null =>
  Array.isArray(value) ? value.join("; ") : value ?? null;

userRoutes.get("/options", async (_req, res) => {
  const options = await userManagementService.listHierarchyOptions();
  res.json(options);
});

userRoutes.get("/", async (req, res) => {
  const users = await userManagementService.listUsers({
    companyId: typeof req.query["companyId"] === "string" ? req.query["companyId"] : undefined,
    superintendenceId: typeof req.query["superintendenceId"] === "string" ? req.query["superintendenceId"] : undefined,
    managementId: typeof req.query["managementId"] === "string" ? req.query["managementId"] : undefined,
    projectId: typeof req.query["projectId"] === "string" ? req.query["projectId"] : undefined,
    approvalOnly: req.query["approvalOnly"] === "true",
    activeOnly: req.query["activeOnly"] !== "false"
  });
  res.json({ total: users.length, items: users });
});

userRoutes.get("/:id", async (req, res) => {
  const user = await userManagementService.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

userRoutes.post("/", async (req, res) => {
  try {
    const created = await userManagementService.createUser(req.body);
    const actor = tryGetAuthenticatedUser(req);
    await superadminService.logAudit({
      userId: actor?.userId,
      action: "create",
      entityType: "user",
      entityId: created.id,
      newValues: req.body as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });
    res.status(201).json(created);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Invalid payload", details: error.flatten() });
      return;
    }
    res.status(400).json({ error: (error as Error).message });
  }
});

userRoutes.post("/me/password", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await userManagementService.updatePassword({
      userId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword
    });

    await superadminService.logAudit({
      userId,
      action: "update",
      entityType: "user_password",
      entityId: userId,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

userRoutes.patch("/me/profile", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  try {
    const updated = await userManagementService.updateOwnProfile(userId, parsed.data);

    await superadminService.logAudit({
      userId,
      action: "update",
      entityType: "user_profile",
      entityId: userId,
      newValues: parsed.data as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

userRoutes.get("/me/preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const preferences = await userPreferenceService.getUserPreferences(userId);
  res.json(preferences);
});

userRoutes.put("/me/preferences", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = updatePreferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  try {
    const updated = await userPreferenceService.updateUserPreferences(userId, parsed.data);

    await superadminService.logAudit({
      userId,
      action: "update",
      entityType: "user_preferences",
      entityId: userId,
      newValues: parsed.data as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

userRoutes.get("/me/approval-delegations", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const delegations = await approvalDelegationService.listForUser(userId);
  res.json(delegations);
});

userRoutes.post("/me/approval-delegations", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = approvalDelegationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  try {
    const created = await approvalDelegationService.createDelegation({
      delegatorUserId: userId,
      delegateUserId: parsed.data.delegateUserId,
      validFrom: parsed.data.validFrom,
      validUntil: parsed.data.validUntil,
      notes: parsed.data.notes
    });

    await superadminService.logAudit({
      userId,
      action: "update",
      entityType: "approval_delegation",
      entityId: created.id,
      newValues: parsed.data as unknown as Record<string, unknown>,
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

userRoutes.post("/me/approval-delegations/:id/revoke", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const delegationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const revoked = await approvalDelegationService.revokeDelegation({
      delegationId,
      actorUserId: userId
    });

    await superadminService.logAudit({
      userId,
      action: "update",
      entityType: "approval_delegation",
      entityId: revoked.id,
      newValues: { revoked: true },
      ipAddress: req.ip,
      userAgent: toHeaderString(req.headers["user-agent"])
    });

    res.json({ success: true, delegation: revoked });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});


