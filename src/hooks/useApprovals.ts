import { useState, useCallback } from 'react';
import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';
import type { ReportApproval, AreaSupervisor } from '@/types/backend';

export interface PendingApproval {
  id: string;
  source_report_id: string;
  name: string;
  description: string;
  uploaded_at: string;
  indicator_name: string;
  submitter_name: string;
  submitter_email?: string;
  destination_path: string[];
  company_name: string;
  superintendence_name: string;
  management_name: string;
  project_name: string;
  report_url?: string;
  report_size_label?: string;
  approver_id?: string;
  approver_name?: string;
  approver_job_title?: string;
  delegated_by_name?: string;
}

interface ApprovalStats {
  pending: number;
  approved_today: number;
  rejected_today: number;
  avg_approval_time_hours: number;
}

interface UseApprovalsReturn {
  pendingApprovals: PendingApproval[];
  approvalHistory: Array<ReportApproval & { approver_name?: string; report_name?: string; destination_path?: string[]; submitter_name?: string }>;
  stats: ApprovalStats;
  isLoading: boolean;
  error: string | null;
  fetchPendingApprovals: (approverId?: string) => Promise<void>;
  fetchApprovalHistory: (reportId?: string, approverId?: string) => Promise<void>;
  fetchStats: (approverId?: string) => Promise<void>;
  approveReport: (input: { reportId: string; approverId: string; approverName: string; comments?: string }) => Promise<boolean>;
  rejectReport: (input: { reportId: string; approverId: string; approverName: string; comments: string }) => Promise<boolean>;
  isSupervisorFor: (_entityType: string, _entityId: string) => Promise<boolean>;
  getMyApprovalAreas: () => Promise<AreaSupervisor[]>;
}

export function useApprovals(): UseApprovalsReturn {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<
    Array<ReportApproval & { approver_name?: string; report_name?: string; destination_path?: string[]; submitter_name?: string }>
  >([]);
  const [stats, setStats] = useState<ApprovalStats>({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    avg_approval_time_hours: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async (approverId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const query = approverId ? `?approverId=${encodeURIComponent(approverId)}` : '';
      const token = getStoredAuthToken();
      const response = await fetch(`${API_URL}/reports/approvals/pending${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { items?: PendingApproval[] };
      setPendingApprovals(payload.items ?? []);
    } catch (err) {
      setError(`Erro ao buscar validacoes pendentes: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchApprovalHistory = useCallback(async (reportId?: string, approverId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = getStoredAuthToken();
      const params = new URLSearchParams({ limit: '100' });
      if (approverId) params.set('approverId', approverId);
      const response = await fetch(`${API_URL}/reports/approvals/history?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        items?: Array<ReportApproval & { approver_name?: string; report_name?: string; destination_path?: string[]; submitter_name?: string }>;
      };
      const items = payload.items ?? [];
      setApprovalHistory(reportId ? items.filter((item) => item.report_id === reportId) : items);
    } catch (err) {
      setError(`Erro ao buscar historico: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (approverId?: string) => {
    try {
      const token = getStoredAuthToken();
      const query = approverId ? `?approverId=${encodeURIComponent(approverId)}` : '';
      const response = await fetch(`${API_URL}/reports/approvals/stats${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as ApprovalStats;
      setStats(payload);
    } catch (err) {
      setError(`Erro ao buscar estatisticas: ${(err as Error).message}`);
    }
  }, []);

  const syncAfterDecision = useCallback(async (approverId?: string) => {
    await Promise.all([fetchPendingApprovals(approverId), fetchApprovalHistory(undefined, approverId), fetchStats(approverId)]);
  }, [fetchApprovalHistory, fetchPendingApprovals, fetchStats]);

  const approveReport = useCallback(
    async (input: { reportId: string; approverId: string; approverName: string; comments?: string }): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        const token = getStoredAuthToken();
        const response = await fetch(`${API_URL}/reports/approvals/${encodeURIComponent(input.reportId)}/decision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            status: 'approved',
            comments: input.comments,
            approverId: input.approverId,
            approverName: input.approverName,
          }),
        });
        if (!response.ok) throw new Error(await response.text());
        await syncAfterDecision(input.approverId);
        return true;
      } catch (err) {
        setError(`Erro ao aprovar relatorio: ${(err as Error).message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [syncAfterDecision]
  );

  const rejectReport = useCallback(
    async (input: { reportId: string; approverId: string; approverName: string; comments: string }): Promise<boolean> => {
      if (!input.comments.trim()) {
        setError('Comentario obrigatorio para rejeicao');
        return false;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = getStoredAuthToken();
        const response = await fetch(`${API_URL}/reports/approvals/${encodeURIComponent(input.reportId)}/decision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            status: 'rejected',
            comments: input.comments,
            approverId: input.approverId,
            approverName: input.approverName,
          }),
        });
        if (!response.ok) throw new Error(await response.text());
        await syncAfterDecision(input.approverId);
        return true;
      } catch (err) {
        setError(`Erro ao rejeitar relatorio: ${(err as Error).message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [syncAfterDecision]
  );

  const isSupervisorFor = useCallback(async () => true, []);
  const getMyApprovalAreas = useCallback(async (): Promise<AreaSupervisor[]> => [], []);

  return {
    pendingApprovals,
    approvalHistory,
    stats,
    isLoading,
    error,
    fetchPendingApprovals,
    fetchApprovalHistory,
    fetchStats,
    approveReport,
    rejectReport,
    isSupervisorFor,
    getMyApprovalAreas,
  };
}

export default useApprovals;




