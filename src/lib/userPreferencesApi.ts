import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';

export type UserPreferencesPayload = {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout: Record<string, unknown>;
  favorite_reports: unknown[];
  analytics_workspaces: unknown[];
  created_at: string;
  updated_at: string;
};

const buildHeaders = (): HeadersInit => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUserPreferences = async (): Promise<UserPreferencesPayload> => {
  const response = await fetch(`${API_URL}/users/me/preferences`, {
    headers: buildHeaders()
  });
  const payload = (await response.json().catch(() => ({}))) as UserPreferencesPayload & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return payload;
};

export const updateUserPreferences = async (
  patch: Partial<Omit<UserPreferencesPayload, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserPreferencesPayload> => {
  const response = await fetch(`${API_URL}/users/me/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders()
    },
    body: JSON.stringify(patch)
  });
  const payload = (await response.json().catch(() => ({}))) as UserPreferencesPayload & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `HTTP ${response.status}`);
  }
  return payload;
};

