import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { notificationService } from "../services/notificationService";

export const notificationRoutes = Router();

notificationRoutes.get("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const limitRaw = Number(req.query["limit"] ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 20;
  const [items, unreadCount] = await Promise.all([
    notificationService.listForUser(userId, limit),
    notificationService.countUnread(userId),
  ]);

  res.json({ total: items.length, unreadCount, items });
});

notificationRoutes.post("/read-all", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const updated = await notificationService.markAllRead(userId);
  res.json({ success: true, updated });
});

notificationRoutes.post("/:id/read", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const success = await notificationService.markRead(userId, notificationId);
  if (!success) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({ success: true });
});


