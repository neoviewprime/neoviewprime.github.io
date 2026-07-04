import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  ReportStatus,
  PaginatedResponse,
  SearchFilters,
  FileUploadResponse
} from '@/types/backend';
import { API_URL } from '@/lib/api';
import { mapearMetricasDaApi, mapearMetricasParaApi, metricasEngajamentoVazias, type MetricasApi, type MetricasEngajamento } from '@/lib/metricasEngajamento';
import { getStoredAuthToken } from '@/lib/authToken';
import { getClientId } from '@/lib/clientIdentity';
import { useAuth } from '@/hooks/useAuth';

const REPORTS_CACHE_KEY = 'neoview-reports-cache';

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const buildFallbackReportDate = (seed: string): string => {
  const hash = hashString(seed || 'neoview-report');
  const year = 2024 + (hash % 3);
  const month = (Math.floor(hash / 3) % 12) + 1;
  const day = (Math.floor(hash / 37) % 28) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const resolveCatalogDate = (item: CatalogListItem): string => {
  return item.report_date || buildFallbackReportDate(item.source_report_id || item.id || item.report_name);
};

interface CatalogListItem {
  id: string;
  source_report_id: string;
  report_status: ReportStatus;
  report_name: string;
  report_description?: string;
  report_date: string | null;
  report_size_label?: string | null;
  report_url?: string | null;
  company_name: string;
  superintendence_name?: string;
  management_name?: string;
  project_name?: string;
  path?: string[];
  indicator_names: string[];
  metric_views?: number;
  metric_comments?: number;
  metric_likes?: number;
  metric_shares?: number;
}

export interface ReportsListItem {
  id: string;
  source_report_id: string;
  indicator_id: string;
  name: string;
  description?: string;
  file_url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  status: ReportStatus;
  uploaded_by: string;
  uploaded_at: string;
  version: number;
  created_at: string;
  updated_at: string;
  metrics: MetricasEngajamento;
}

const MOCK_REPORTS: ReportsListItem[] = [
  {
    id: 'rep-001',
    source_report_id: 'rep-001',
    indicator_id: 'ind-dec',
    name: 'Relatorio DEC Q4 2024.pdf',
    description: 'Relatorio trimestral de DEC',
    file_url: '/placeholder.svg',
    file_path: 'reports/2024/q4/dec-report.pdf',
    file_size: 2516582,
    mime_type: 'application/pdf',
    status: 'approved',
    uploaded_by: 'usr-001',
    uploaded_at: '2024-12-15T10:30:00Z',
    version: 1,
    created_at: '2024-12-15T10:30:00Z',
    updated_at: '2024-12-15T14:00:00Z',
    metrics: metricasEngajamentoVazias()
  },
  {
    id: 'rep-002',
    source_report_id: 'rep-002',
    indicator_id: 'ind-fec',
    name: 'Relatorio FEC Q4 2024.pdf',
    description: 'Relatorio trimestral de FEC',
    file_url: '/placeholder.svg',
    file_path: 'reports/2024/q4/fec-report.pdf',
    file_size: 1992294,
    mime_type: 'application/pdf',
    status: 'pending_approval',
    uploaded_by: 'usr-003',
    uploaded_at: '2024-12-16T09:00:00Z',
    version: 1,
    created_at: '2024-12-16T09:00:00Z',
    updated_at: '2024-12-16T09:00:00Z',
    metrics: metricasEngajamentoVazias()
  }
];

export interface ReportSubmitInput {
  assetType?: 'hyperlink';
  reportName: string;
  reportDescription?: string;
  reportDate?: string;
  reportSizeLabel?: string;
  reportUrl?: string;
  companyId: string;
  companyName: string;
  superintendenceId: string;
  superintendenceName: string;
  managementId?: string | null;
  managementName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  submittedByName?: string;
  submittedByEmail?: string;
  indicators: Array<{
    id?: string;
    name: string;
    value?: string;
    unit?: string;
    trend?: string;
  }>;
}

export interface UtdDraftInput {
  companyId: string;
  superintendenceId: string;
  managementId: string;
  projectId: string;
  reportName?: string;
  reportDescription?: string;
  reportUrl?: string;
  reportDate?: string;
  indicatorsText?: string;
  payload?: Record<string, unknown>;
}

export interface UtdDraftRecord {
  id: string;
  reportName: string;
  reportDescription: string;
  reportUrl: string;
  reportDate: string;
  indicatorsText: string;
  payload: Record<string, unknown>;
  updatedAt: string;
}

interface UseReportsReturn {
  reports: ReportsListItem[];
  isLoading: boolean;
  error: string | null;
  fetchReports: (filters?: SearchFilters) => Promise<PaginatedResponse<ReportsListItem>>;
  getReportById: (id: string) => Promise<ReportsListItem | null>;
  getReportsByIndicator: (indicatorId: string) => Promise<ReportsListItem[]>;
  uploadReport: (file: File, indicatorId: string, metadata?: Partial<ReportsListItem>) => Promise<FileUploadResponse | null>;
  submitStructuredReport: (input: ReportSubmitInput) => Promise<{ id: string; approver?: { id: string; name: string; jobTitle?: string } | null } | null>;
  getCurrentUtdDraft: (projectId: string) => Promise<UtdDraftRecord | null>;
  saveCurrentUtdDraft: (input: UtdDraftInput) => Promise<boolean>;
  clearCurrentUtdDraft: (projectId: string) => Promise<boolean>;
  refreshReportMetrics: (input: { reportId: string; sourceReportId: string; reportName: string }) => Promise<ReportsListItem['metrics'] | null>;
  trackReportView: (input: { reportId: string; sourceReportId: string; reportName: string }) => Promise<ReportsListItem['metrics'] | null>;
  toggleReportLike: (input: { reportId: string; sourceReportId: string; reportName: string }) => Promise<ReportsListItem['metrics'] | null>;
  addReportComment: (input: { reportId: string; sourceReportId: string; reportName: string; message: string }) => Promise<ReportsListItem['metrics'] | null>;
  shareReportWithRecipients: (input: {
    reportId: string;
    sourceReportId: string;
    reportName: string;
    recipients: Array<{ userId?: string; name?: string }>;
  }) => Promise<ReportsListItem['metrics'] | null>;
  updateReport: (id: string, data: Partial<ReportsListItem>) => Promise<boolean>;
  deleteReport: (id: string) => Promise<boolean>;
  uploadNewVersion: (reportId: string, file: File, changeNotes?: string) => Promise<boolean>;
  submitForApproval: (reportId: string) => Promise<boolean>;
  getPendingApprovals: () => Promise<ReportsListItem[]>;
}

const buildReportsCacheKey = (userId?: string) => (userId ? `${REPORTS_CACHE_KEY}:${userId}` : REPORTS_CACHE_KEY);

const readReportsCache = (cacheKey: string): ReportsListItem[] => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(cacheKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ReportsListItem[];
  } catch {
    return [];
  }
};

const writeReportsCache = (cacheKey: string, value: ReportsListItem[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(cacheKey, JSON.stringify(value));
};

const mapCatalogItemToReport = (item: CatalogListItem): ReportsListItem => {
  const hierarchyPath = item.path?.filter(Boolean) ?? [
    item.company_name,
    item.superintendence_name,
    item.management_name,
    item.project_name
  ].filter(Boolean);

  return {
    id: item.id,
    source_report_id: item.source_report_id,
    indicator_id: item.indicator_names?.[0] ?? 'ind-unknown',
    name: item.report_name,
    description: item.report_description || `${item.company_name} | ${(item.indicator_names ?? []).join(', ')}`,
    file_url: item.report_url || '',
    file_path: hierarchyPath.join(' > ') || `catalog/${item.source_report_id}`,
    file_size: 0,
    mime_type: 'application/link',
    status: item.report_status || 'draft',
    uploaded_by: 'usr-current',
    uploaded_at: `${resolveCatalogDate(item)}T00:00:00Z`,
    version: 1,
    created_at: `${resolveCatalogDate(item)}T00:00:00Z`,
    updated_at: `${resolveCatalogDate(item)}T00:00:00Z`,
    metrics: mapearMetricasDaApi({
      views: Number(item.metric_views ?? 0),
      comments: Number(item.metric_comments ?? 0),
      likes: Number(item.metric_likes ?? 0),
      shares: Number(item.metric_shares ?? 0)
    })
  };
};

export function useReports(): UseReportsReturn {
  const { user } = useAuth();
  const clientId = useMemo(() => getClientId(), []);
  const cacheKey = useMemo(() => buildReportsCacheKey(user?.id), [user?.id]);
  const [reports, setReports] = useState<ReportsListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyMetricsUpdate = useCallback((reportId: string, metrics: ReportsListItem['metrics']) => {
    setReports((prev) => {
      const next = prev.map((report) => (report.id === reportId ? { ...report, metrics } : report));
      writeReportsCache(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  useEffect(() => {
    setReports(readReportsCache(cacheKey));
  }, [cacheKey]);

  const applyFilters = (items: ReportsListItem[], filters?: SearchFilters): ReportsListItem[] => {
    let filtered = [...items];
    if (filters?.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query));
    }
    if (filters?.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }
    return filtered;
  };

  const paginate = (items: ReportsListItem[], page: number, perPage: number): PaginatedResponse<ReportsListItem> => {
    const start = (page - 1) * perPage;
    const paged = items.slice(start, start + perPage);
    return {
      data: paged,
      pagination: {
        page,
        per_page: perPage,
        total: items.length,
        total_pages: Math.ceil(items.length / perPage)
      }
    };
  };

  const fetchReports = useCallback(async (filters?: SearchFilters): Promise<PaginatedResponse<ReportsListItem>> => {
    setIsLoading(true);
    setError(null);
    const page = filters?.page || 1;
    const perPage = filters?.per_page || 1000;

    try {
      const token = getStoredAuthToken();
      const response = await fetch(
        token ? `${API_URL}/reports/mine` : `${API_URL}/reports/structure/catalog/list`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items: CatalogListItem[] };
      const mapped = (payload.items ?? []).map(mapCatalogItemToReport);
      const filtered = applyFilters(mapped, filters);
      const result = paginate(filtered, page, perPage);
      setReports(filtered);
      writeReportsCache(cacheKey, filtered);
      return result;
    } catch {
      const cached = readReportsCache(cacheKey);
      const fallbackBase = cached.length > 0 ? cached : MOCK_REPORTS;
      const filtered = applyFilters(fallbackBase, filters);
      const result = paginate(filtered, page, perPage);
      setReports(filtered);
      setError(
        cached.length > 0
          ? 'Erro ao buscar relatorios do backend, exibindo ultimo snapshot salvo.'
          : 'Erro ao buscar relatorios do backend, exibindo dados locais.'
      );
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  const submitStructuredReport = useCallback(async (input: ReportSubmitInput): Promise<{ id: string; approver?: { id: string; name: string; jobTitle?: string } | null } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getStoredAuthToken() ? { Authorization: `Bearer ${getStoredAuthToken()}` } : {})
        },
        body: JSON.stringify({
          ...input,
          metrics: mapearMetricasParaApi(metricasEngajamentoVazias())
        })
      });
      if (!response.ok) {
        const raw = await response.text();
        let message = raw;
        try {
          const parsed = JSON.parse(raw) as { error?: string; details?: unknown };
          message = parsed.error ?? raw;
          if (parsed.details) {
            message = `${message} | detalhes: ${JSON.stringify(parsed.details)}`;
          }
        } catch {
          // keep raw body
        }
        throw new Error(message || `HTTP ${response.status}`);
      }
      const created = (await response.json()) as { id: string; approver?: { id: string; name: string; jobTitle?: string } | null };
      await fetchReports();
      return created;
    } catch (err) {
      setError(`Erro ao enviar relatorio: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchReports]);

  const getCurrentUtdDraft = useCallback(async (projectId: string): Promise<UtdDraftRecord | null> => {
    if (!projectId) return null;
    try {
      const token = getStoredAuthToken();
      if (!token) return null;
      const params = new URLSearchParams({ projectId });
      const response = await fetch(`${API_URL}/reports/utd/drafts/current?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { item?: UtdDraftRecord | null };
      return payload.item ?? null;
    } catch (err) {
      setError(`Erro ao carregar rascunho UTD: ${(err as Error).message}`);
      return null;
    }
  }, []);

  const saveCurrentUtdDraft = useCallback(async (input: UtdDraftInput): Promise<boolean> => {
    try {
      const token = getStoredAuthToken();
      if (!token) return false;
      const response = await fetch(`${API_URL}/reports/utd/drafts/current`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true;
    } catch (err) {
      setError(`Erro ao salvar rascunho UTD: ${(err as Error).message}`);
      return false;
    }
  }, []);

  const clearCurrentUtdDraft = useCallback(async (projectId: string): Promise<boolean> => {
    if (!projectId) return false;
    try {
      const token = getStoredAuthToken();
      if (!token) return false;
      const params = new URLSearchParams({ projectId });
      const response = await fetch(`${API_URL}/reports/utd/drafts/current?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true;
    } catch (err) {
      setError(`Erro ao limpar rascunho UTD: ${(err as Error).message}`);
      return false;
    }
  }, []);

  const refreshReportMetrics = useCallback(async (
    input: { reportId: string; sourceReportId: string; reportName: string }
  ): Promise<ReportsListItem['metrics'] | null> => {
    try {
      const token = getStoredAuthToken();
      const query = new URLSearchParams({ reportName: input.reportName }).toString();
      const response = await fetch(
        `${API_URL}/reports/catalog/by-source/${encodeURIComponent(input.sourceReportId)}/engagement?${query}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (!payload.metrics) return null;
      const metricasAtualizadas = mapearMetricasDaApi(payload.metrics);
      applyMetricsUpdate(input.reportId, metricasAtualizadas);
      return metricasAtualizadas;
    } catch (err) {
      setError(`Erro ao atualizar metricas: ${(err as Error).message}`);
      return null;
    }
  }, [applyMetricsUpdate]);

  const trackReportView = useCallback(async (
    input: { reportId: string; sourceReportId: string; reportName: string }
  ): Promise<ReportsListItem['metrics'] | null> => {
    try {
      const token = getStoredAuthToken();
      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(input.sourceReportId)}/engagement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'view',
          reportName: input.reportName,
          clientId,
          userId: user?.id
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (!payload.metrics) return null;
      const metricasAtualizadas = mapearMetricasDaApi(payload.metrics);
      applyMetricsUpdate(input.reportId, metricasAtualizadas);
      return metricasAtualizadas;
    } catch (err) {
      setError(`Erro ao registrar visualizacao: ${(err as Error).message}`);
      return null;
    }
  }, [applyMetricsUpdate, clientId, user?.id]);

  const toggleReportLike = useCallback(async (
    input: { reportId: string; sourceReportId: string; reportName: string }
  ): Promise<ReportsListItem['metrics'] | null> => {
    try {
      const token = getStoredAuthToken();
      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(input.sourceReportId)}/likes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportName: input.reportName,
          clientId,
          userId: user?.id
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (!payload.metrics) return null;
      const metricasAtualizadas = mapearMetricasDaApi(payload.metrics);
      applyMetricsUpdate(input.reportId, metricasAtualizadas);
      return metricasAtualizadas;
    } catch (err) {
      setError(`Erro ao curtir relatorio: ${(err as Error).message}`);
      return null;
    }
  }, [applyMetricsUpdate, clientId, user?.id]);

  const addReportComment = useCallback(async (
    input: { reportId: string; sourceReportId: string; reportName: string; message: string }
  ): Promise<ReportsListItem['metrics'] | null> => {
    try {
      const token = getStoredAuthToken();
      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(input.sourceReportId)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportName: input.reportName,
          message: input.message,
          clientId,
          userId: user?.id
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (!payload.metrics) return null;
      const metricasAtualizadas = mapearMetricasDaApi(payload.metrics);
      applyMetricsUpdate(input.reportId, metricasAtualizadas);
      return metricasAtualizadas;
    } catch (err) {
      setError(`Erro ao comentar relatorio: ${(err as Error).message}`);
      return null;
    }
  }, [applyMetricsUpdate, clientId, user?.id]);

  const shareReportWithRecipients = useCallback(async (
    input: {
      reportId: string;
      sourceReportId: string;
      reportName: string;
      recipients: Array<{ userId?: string; name?: string }>;
    }
  ): Promise<ReportsListItem['metrics'] | null> => {
    try {
      const token = getStoredAuthToken();
      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(input.sourceReportId)}/shares`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reportName: input.reportName,
          recipients: input.recipients,
          clientId,
          userId: user?.id
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (!payload.metrics) return null;
      const metricasAtualizadas = mapearMetricasDaApi(payload.metrics);
      applyMetricsUpdate(input.reportId, metricasAtualizadas);
      return metricasAtualizadas;
    } catch (err) {
      setError(`Erro ao compartilhar relatorio: ${(err as Error).message}`);
      return null;
    }
  }, [applyMetricsUpdate, clientId, user?.id]);

  const getReportById = useCallback(async (id: string): Promise<ReportsListItem | null> => {
    const current = reports.find((r) => r.id === id);
    return current ?? null;
  }, [reports]);

  const getReportsByIndicator = useCallback(async (indicatorId: string): Promise<ReportsListItem[]> => {
    return reports.filter((r) => r.indicator_id === indicatorId);
  }, [reports]);

  const uploadReport = useCallback(async (
    file: File,
    indicatorId: string,
    metadata?: Partial<ReportsListItem>
  ): Promise<FileUploadResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedId = `rep-${Date.now()}`;
      const newReport: ReportsListItem = {
        id: generatedId,
        source_report_id: generatedId,
        indicator_id: indicatorId,
        name: file.name,
        description: metadata?.description,
        file_url: URL.createObjectURL(file),
        file_path: `reports/${Date.now()}_${file.name}`,
        file_size: file.size,
        mime_type: file.type,
        status: 'draft',
        uploaded_by: 'usr-current',
        uploaded_at: new Date().toISOString(),
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metrics: metricasEngajamentoVazias(),
        ...metadata
      };
      setReports((prev) => {
        const next = [newReport, ...prev];
        writeReportsCache(cacheKey, next);
        return next;
      });
      return {
        id: newReport.id,
        file_url: newReport.file_url,
        file_path: newReport.file_path,
        file_size: newReport.file_size,
        mime_type: newReport.mime_type
      };
    } catch {
      setError('Erro ao fazer upload do relatorio');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  const updateReport = useCallback(async (id: string, data: Partial<ReportsListItem>): Promise<boolean> => {
    setReports((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r));
      writeReportsCache(cacheKey, next);
      return next;
    });
    return true;
  }, [cacheKey]);

  const deleteReport = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getStoredAuthToken();
      const response = await fetch(`${API_URL}/reports/catalog/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      setReports((prev) => {
        const next = prev.filter((r) => r.id !== id);
        writeReportsCache(cacheKey, next);
        return next;
      });
      return Boolean(payload.success ?? true);
    } catch (err) {
      setError(`Erro ao excluir relatorio: ${(err as Error).message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  const uploadNewVersion = useCallback(async (reportId: string, file: File): Promise<boolean> => {
    setReports((prev) => {
      const next = prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              version: r.version + 1,
              file_url: URL.createObjectURL(file),
              file_size: file.size,
              updated_at: new Date().toISOString()
            }
          : r
      );
      writeReportsCache(cacheKey, next);
      return next;
    });
    return true;
  }, [cacheKey]);

  const submitForApproval = useCallback(async (reportId: string): Promise<boolean> => {
    return updateReport(reportId, { status: 'pending_approval' as ReportStatus });
  }, [updateReport]);

  const getPendingApprovals = useCallback(async (): Promise<ReportsListItem[]> => {
    return reports.filter((r) => r.status === 'pending_approval');
  }, [reports]);

  return {
    reports,
    isLoading,
    error,
    fetchReports,
    getReportById,
    getReportsByIndicator,
    uploadReport,
    submitStructuredReport,
    getCurrentUtdDraft,
    saveCurrentUtdDraft,
    clearCurrentUtdDraft,
    refreshReportMetrics,
    trackReportView,
    toggleReportLike,
    addReportComment,
    shareReportWithRecipients,
    updateReport,
    deleteReport,
    uploadNewVersion,
    submitForApproval,
    getPendingApprovals
  };
}

export default useReports;
