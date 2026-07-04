import { useCallback, useState } from 'react';
import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';

const authHeaders = (): HeadersInit => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useSuperadmin = () => {
  const [overview, setOverview] = useState<{
    users: number;
    reports: number;
    approvals: number;
    chatMessages: number;
    superadmins: string[];
  } | null>(null);
  const [activities, setActivities] = useState<Array<Record<string, unknown>>>([]);
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/superadmin/overview`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setOverview(payload);
      return payload;
    } catch (err) {
      setError(`Erro ao carregar visão geral: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/superadmin/activities?limit=200`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
      setActivities(payload.items ?? []);
      return payload.items ?? [];
    } catch (err) {
      setError(`Erro ao carregar atividades: ${(err as Error).message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/superadmin/reports?limit=1000`, { headers: authHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: Array<Record<string, unknown>> };
      setReports(payload.items ?? []);
      return payload.items ?? [];
    } catch (err) {
      setError(`Erro ao carregar relatórios: ${(err as Error).message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteReport = useCallback(async (reportId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/superadmin/reports/${encodeURIComponent(reportId)}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      await fetchReports();
      await fetchActivities();
      return payload;
    } catch (err) {
      setError(`Erro ao excluir relatório: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchActivities, fetchReports]);

  const bulkDeleteReports = useCallback(async (input: { reportIds?: string[]; companyId?: string; status?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/superadmin/reports/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify(input)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      await fetchReports();
      await fetchActivities();
      return payload;
    } catch (err) {
      setError(`Erro ao excluir em massa: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchActivities, fetchReports]);

  const resetData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/superadmin/reset-data`, {
        method: 'POST',
        headers: authHeaders()
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      await Promise.all([fetchOverview(), fetchReports(), fetchActivities()]);
      return payload;
    } catch (err) {
      setError(`Erro ao resetar backend: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchActivities, fetchOverview, fetchReports]);

  return {
    overview,
    activities,
    reports,
    isLoading,
    error,
    fetchOverview,
    fetchActivities,
    fetchReports,
    deleteReport,
    bulkDeleteReports,
    resetData
  };
};

export default useSuperadmin;
