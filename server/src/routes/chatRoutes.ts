import { Router } from "express";
import { z } from "zod";
import { chatService } from "../services/chatService";
import { streamController } from "../streaming/streamController";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const pageContextSchema = z.object({
  page: z.enum(["register", "workspace", "reports", "approvals", "generic"]),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(4000),
  hints: z.array(z.string().min(1).max(400)).max(6).optional()
});

const bodySchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().uuid().optional(),
  pageContext: pageContextSchema.optional()
});

const sessionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional()
});

const sessionParamsSchema = z.object({
  sessionId: z.string().uuid()
});

export const chatRoutes = Router();

chatRoutes.get("/sessions", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = sessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query", details: parsed.error.flatten() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessions = await chatService.listSessions(req.user, parsed.data.limit);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: `Chat sessions failed: ${(error as Error).message}` });
  }
});

chatRoutes.get("/sessions/:sessionId", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const parsedParams = sessionParamsSchema.safeParse(req.params);
    const parsedQuery = sessionsQuerySchema.safeParse(req.query);
    if (!parsedParams.success || !parsedQuery.success) {
      res.status(400).json({
        error: "Invalid request",
        details: {
          params: parsedParams.success ? undefined : parsedParams.error.flatten(),
          query: parsedQuery.success ? undefined : parsedQuery.error.flatten()
        }
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const session = await chatService.getSession(parsedParams.data.sessionId, req.user);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: `Chat session load failed: ${(error as Error).message}` });
  }
});

chatRoutes.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const response = await chatService.ask(parsed.data.message, parsed.data.sessionId, req.user, parsed.data.pageContext);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: `Chat processing failed: ${(error as Error).message}` });
  }
});

chatRoutes.post("/stream", authMiddleware, streamController);
