import { Response } from "express";
import { z } from "zod";
import { chatService } from "../services/chatService";
import type { AuthenticatedRequest } from "../middleware/auth";

const pageContextSchema = z.object({
  page: z.enum(["register", "workspace", "reports", "approvals", "generic"]),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(4000),
  hints: z.array(z.string().min(1).max(400)).max(6).optional()
});

const streamBodySchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().uuid().optional(),
  pageContext: pageContextSchema.optional()
});

export const streamController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const parsed = streamBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const response = await chatService.askStream(parsed.data.message, parsed.data.sessionId, req.user, parsed.data.pageContext);
    res.write(`event: session\ndata: ${JSON.stringify({ sessionId: response.sessionId })}\n\n`);

    for await (const token of response.stream) {
      res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    }

    res.write(
      `event: done\ndata: ${JSON.stringify({
        sources: response.sources,
        cached: response.cached,
        totalSources: response.totalSources
      })}\n\n`
    );
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
    res.end();
  }
};
