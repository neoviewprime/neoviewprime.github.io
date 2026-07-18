import { getDbClient } from "../db/connection";
import { randomUUID } from "crypto";

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  message: string;
  created_at: string;
}

export interface ChatSessionSummary {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview: string;
  is_active: boolean;
  message_count: number;
}

export interface ChatFeedbackPayload {
  sessionId?: string;
  messageId?: string;
  rating: "positive" | "negative";
  question?: string;
  answer?: string;
  intent?: string;
  retrievalMode?: string;
  sourceIds?: string[];
  metadata?: Record<string, unknown>;
}

export const memoryService = {
  async createSession(userId: string): Promise<string> {
    const db = await getDbClient();
    const id = randomUUID();
    await db.query("INSERT INTO chat_sessions (id, user_id) VALUES ($1, $2)", [id, userId]);
    return id;
  },

  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    const db = await getDbClient();
    const result = await db.query<ChatMessage>(
      `SELECT id, session_id, role, message, created_at
       FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );
    return result.rows;
  },

  async getSession(sessionId: string): Promise<{ session: ChatSessionSummary | null; messages: ChatMessage[] }> {
    const db = await getDbClient();
    const sessionResult = await db.query<{ id: string; user_id: string; created_at: string }>(
      `SELECT id, user_id, created_at
       FROM chat_sessions
       WHERE id = $1
       LIMIT 1`,
      [sessionId]
    );

    const baseSession = sessionResult.rows[0];
    if (!baseSession) {
      return { session: null, messages: [] };
    }

    const messages = await this.getSessionHistory(sessionId);
    const firstUserMessage = messages.find((message) => message.role === "user")?.message?.trim() ?? "";
    const lastMessage = messages[messages.length - 1];
    const title = firstUserMessage ? firstUserMessage.slice(0, 60) : "Nova conversa";

    return {
      session: {
        id: baseSession.id,
        user_id: baseSession.user_id,
        title,
        created_at: baseSession.created_at,
        updated_at: lastMessage?.created_at ?? baseSession.created_at,
        preview: lastMessage?.message?.slice(0, 120) ?? "",
        is_active: true,
        message_count: messages.length
      },
      messages
    };
  },

  async listSessions(userId: string, limit = 20): Promise<ChatSessionSummary[]> {
    const db = await getDbClient();
    const sessionRows = await db.query<{ id: string; user_id: string; created_at: string }>(
      `SELECT id, user_id, created_at
       FROM chat_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const sessions = await Promise.all(
      sessionRows.rows.map(async (sessionRow) => {
        const messages = await this.getSessionHistory(sessionRow.id);
        const firstUserMessage = messages.find((message) => message.role === "user")?.message?.trim() ?? "";
        const lastMessage = messages[messages.length - 1];

        return {
          id: sessionRow.id,
          user_id: sessionRow.user_id,
          title: firstUserMessage ? firstUserMessage.slice(0, 60) : "Nova conversa",
          created_at: sessionRow.created_at,
          updated_at: lastMessage?.created_at ?? sessionRow.created_at,
          preview: lastMessage?.message?.slice(0, 120) ?? "",
          is_active: true,
          message_count: messages.length
        } satisfies ChatSessionSummary;
      })
    );

    return sessions
      .sort((a, b) => {
        const left = Date.parse(a.updated_at);
        const right = Date.parse(b.updated_at);
        return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
      })
      .slice(0, Math.max(1, Math.min(50, limit)));
  },

  async storeMessage(sessionId: string, role: "user" | "assistant" | "system", message: string): Promise<void> {
    const db = await getDbClient();
    await db.query(
      "INSERT INTO chat_messages (id, session_id, role, message) VALUES ($1, $2, $3, $4)",
      [randomUUID(), sessionId, role, message]
    );
  },

  async storeFeedback(userId: string, payload: ChatFeedbackPayload) {
    const db = await getDbClient();
    const countResult = await db.query<{ total: number }>(
      "SELECT COUNT(*) AS total FROM chat_feedback WHERE user_id = $1",
      [userId]
    );
    const nextIndex = Number(countResult.rows[0]?.total ?? 0) + 1;
    const split = nextIndex % 5 === 0 ? "test" : "train";
    const id = randomUUID();

    await db.query(
      `INSERT INTO chat_feedback (
        id,
        user_id,
        session_id,
        message_id,
        rating,
        split,
        question,
        answer,
        intent,
        retrieval_mode,
        source_ids,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        userId,
        payload.sessionId ?? null,
        payload.messageId ?? null,
        payload.rating,
        split,
        payload.question ?? null,
        payload.answer ?? null,
        payload.intent ?? null,
        payload.retrievalMode ?? null,
        JSON.stringify(payload.sourceIds ?? []),
        JSON.stringify(payload.metadata ?? {})
      ]
    );

    return { id, split };
  },

  async getFeedbackSummary(userId: string) {
    const db = await getDbClient();
    const result = await db.query<{ rating: "positive" | "negative"; split: "train" | "test"; created_at: string }>(
      `SELECT rating, split, created_at
       FROM chat_feedback
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    const rows = result.rows;

    return {
      total: rows.length,
      train: rows.filter((entry) => entry.split === "train").length,
      test: rows.filter((entry) => entry.split === "test").length,
      positive: rows.filter((entry) => entry.rating === "positive").length,
      negative: rows.filter((entry) => entry.rating === "negative").length,
      recent: rows.slice(0, 10)
    };
  }
};
