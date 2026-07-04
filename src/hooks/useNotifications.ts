import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
};

const buildHeaders = (): HeadersInit => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useNotifications = (enabled = true) => {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/notifications?limit=25`, {
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: AppNotification[]; unreadCount?: number };
      setItems(payload.items ?? []);
      setUnreadCount(Number(payload.unreadCount ?? 0));
    } catch (err) {
      setError(`Erro ao carregar notificacoes: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh().catch(() => undefined);
    const interval = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [enabled, refresh]);

  const markAllAsRead = useCallback(async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'POST',
      headers: buildHeaders(),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await refresh();
  }, [refresh]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const response = await fetch(`${API_URL}/notifications/${encodeURIComponent(notificationId)}/read`, {
        method: 'POST',
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await refresh();
    },
    [refresh]
  );

  return {
    items,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAllAsRead,
    markAsRead,
  };
};

export default useNotifications;
