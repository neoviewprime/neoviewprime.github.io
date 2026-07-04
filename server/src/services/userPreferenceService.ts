import { getDbClient } from "../db/connection";
import { fromDbJson } from "../db/providerUtils";

export type StoredUserPreference = {
  user_id: string;
  theme: "light" | "dark" | "system";
  language: "pt-BR" | "en-US" | "es-ES";
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout: Record<string, unknown>;
  favorite_reports: unknown[];
  analytics_workspaces: unknown[];
  created_at: string;
  updated_at: string;
};

type UserPreferenceRow = {
  user_id: string;
  theme: "light" | "dark" | "system" | null;
  language: "pt-BR" | "en-US" | "es-ES" | null;
  notifications_enabled: number | null;
  email_notifications: number | null;
  dashboard_layout: string | null;
  favorite_reports: string | null;
  analytics_workspaces: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const defaultPreferences = (userId: string): StoredUserPreference => ({
  user_id: userId,
  theme: "system",
  language: "pt-BR",
  notifications_enabled: true,
  email_notifications: true,
  dashboard_layout: {},
  favorite_reports: [],
  analytics_workspaces: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const mapPreferenceRow = (row: UserPreferenceRow | null | undefined, userId: string): StoredUserPreference => {
  const fallback = defaultPreferences(userId);
  if (!row) return fallback;

  return {
    user_id: row.user_id,
    theme: row.theme ?? fallback.theme,
    language: row.language ?? fallback.language,
    notifications_enabled: Boolean(row.notifications_enabled ?? 1),
    email_notifications: Boolean(row.email_notifications ?? 1),
    dashboard_layout: fromDbJson<Record<string, unknown>>(row.dashboard_layout, {}),
    favorite_reports: fromDbJson<unknown[]>(row.favorite_reports, []),
    analytics_workspaces: fromDbJson<unknown[]>(row.analytics_workspaces, []),
    created_at: row.created_at ?? fallback.created_at,
    updated_at: row.updated_at ?? fallback.updated_at
  };
};

export const userPreferenceService = {
  async getUserPreferences(userId: string): Promise<StoredUserPreference> {
    const db = await getDbClient();
    const result = await db.query<UserPreferenceRow>(
      `SELECT
        user_id,
        theme,
        language,
        notifications_enabled,
        email_notifications,
        dashboard_layout,
        favorite_reports,
        analytics_workspaces,
        created_at,
        updated_at
       FROM user_preferences
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    );

    return mapPreferenceRow(result.rows[0], userId);
  },

  async updateUserPreferences(
    userId: string,
    patch: Partial<Omit<StoredUserPreference, "user_id" | "created_at" | "updated_at">>
  ): Promise<StoredUserPreference> {
    const current = await this.getUserPreferences(userId);
    const next: StoredUserPreference = {
      ...current,
      ...patch,
      user_id: userId,
      dashboard_layout: patch.dashboard_layout ?? current.dashboard_layout,
      favorite_reports: patch.favorite_reports ?? current.favorite_reports,
      analytics_workspaces: patch.analytics_workspaces ?? current.analytics_workspaces,
      updated_at: new Date().toISOString()
    };

    const db = await getDbClient();
    await db.query(
      `INSERT INTO user_preferences (
        user_id,
        theme,
        language,
        notifications_enabled,
        email_notifications,
        dashboard_layout,
        favorite_reports,
        analytics_workspaces,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id) DO UPDATE SET
        theme = excluded.theme,
        language = excluded.language,
        notifications_enabled = excluded.notifications_enabled,
        email_notifications = excluded.email_notifications,
        dashboard_layout = excluded.dashboard_layout,
        favorite_reports = excluded.favorite_reports,
        analytics_workspaces = excluded.analytics_workspaces,
        updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        next.theme,
        next.language,
        next.notifications_enabled ? 1 : 0,
        next.email_notifications ? 1 : 0,
        JSON.stringify(next.dashboard_layout ?? {}),
        JSON.stringify(next.favorite_reports ?? []),
        JSON.stringify(next.analytics_workspaces ?? [])
      ]
    );

    return this.getUserPreferences(userId);
  }
};

