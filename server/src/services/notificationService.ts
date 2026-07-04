import { randomUUID } from "crypto";
import { DbClient, getDbClient } from "../db/connection";

export type NotificationType =
  | "report_shared"
  | "approval_request"
  | "approval_delegated"
  | "approval_delegation_revoked"
  | "approval_decision"
  | "delegated_approval_decision";

type NotificationRow = {
  id: string;
  recipient_user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  metadata: string | null;
  is_read: number | null;
  read_at: string | null;
  created_at: string;
};

const BROKEN_TEXT_PATTERN = /(?:[\u00C2\u00C3][\u0080-\u00BF]|(?:\u00EF\u00BF\u00BD|\uFFFD)|\u00E2[\u0080-\u00BF]{2})/;

const decodeLatin1Utf8 = (value: string): string => {
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
};

const normalizeNotificationText = (value: string): string => {
  let current = value ?? "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!BROKEN_TEXT_PATTERN.test(current)) break;
    const decoded = decodeLatin1Utf8(current);
    if (!decoded || decoded === current) break;
    current = decoded;
  }

  return current.replace(/\uFFFD/g, "").trim();
};

const parseMetadata = (value: string | null): Record<string, unknown> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

export const notificationService = {
  async create(input: {
    recipientUserId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    actionUrl?: string | null;
    metadata?: Record<string, unknown>;
    db?: DbClient;
  }) {
    const db = input.db ?? await getDbClient();
    const id = randomUUID();

    await db.query(
      `INSERT INTO notifications (
        id, recipient_user_id, type, title, message, entity_type, entity_id, action_url, metadata, is_read
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 0
      )`,
      [
        id,
        input.recipientUserId,
        input.type,
        normalizeNotificationText(input.title),
        normalizeNotificationText(input.message),
        input.entityType ?? null,
        input.entityId ?? null,
        input.actionUrl ?? null,
        JSON.stringify(input.metadata ?? {}),
      ]
    );

    return id;
  },

  async createMany(
    inputs: Array<{
          recipientUserId: string;
          type: NotificationType;
          title: string;
          message: string;
          entityType?: string | null;
          entityId?: string | null;
          actionUrl?: string | null;
          metadata?: Record<string, unknown>;
          db?: DbClient;
        }>
  ) {
    for (const input of inputs) {
      await this.create(input);
    }
  },

  async listForUser(userId: string, limit = 20) {
    const db = await getDbClient();
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(100, Math.floor(limit))) : 20;
    const result = await db.query<NotificationRow>(
      `SELECT
        id,
        recipient_user_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        action_url,
        metadata,
        is_read,
        read_at,
        created_at
       FROM notifications
       WHERE recipient_user_id = $1
       ORDER BY is_read ASC, created_at DESC
       LIMIT $2`,
      [userId, safeLimit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      recipient_user_id: row.recipient_user_id,
      type: row.type,
      title: normalizeNotificationText(row.title),
      message: normalizeNotificationText(row.message),
      entity_type: row.entity_type ?? undefined,
      entity_id: row.entity_id ?? undefined,
      action_url: row.action_url ?? undefined,
      metadata: parseMetadata(row.metadata),
      is_read: Boolean(row.is_read),
      read_at: row.read_at ?? undefined,
      created_at: row.created_at,
    }));
  },

  async countUnread(userId: string): Promise<number> {
    const db = await getDbClient();
    const result = await db.query<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM notifications
       WHERE recipient_user_id = $1
         AND COALESCE(is_read, 0) = 0`,
      [userId]
    );

    return Number(result.rows[0]?.count ?? 0);
  },

  async markAllRead(userId: string): Promise<number> {
    const db = await getDbClient();
    const pending = await this.countUnread(userId);
    await db.query(
      `UPDATE notifications
       SET is_read = 1, read_at = CURRENT_TIMESTAMP
       WHERE recipient_user_id = $1
         AND COALESCE(is_read, 0) = 0`,
      [userId]
    );
    return pending;
  },

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const db = await getDbClient();
    const existing = await db.query<{ id: string }>(
      `SELECT id
       FROM notifications
       WHERE id = $1
         AND recipient_user_id = $2
       LIMIT 1`,
      [notificationId, userId]
    );

    if (!existing.rows[0]?.id) {
      return false;
    }

    await db.query(
      `UPDATE notifications
       SET is_read = 1, read_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND recipient_user_id = $2`,
      [notificationId, userId]
    );

    return true;
  },
};
