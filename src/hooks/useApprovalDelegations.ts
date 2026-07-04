import { useCallback, useState } from 'react';
import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';

export type ApprovalDelegation = {
  id: string;
  delegator_user_id: string;
  delegator_name?: string;
  delegator_job_title?: string;
  delegate_user_id: string;
  delegate_name?: string;
  delegate_job_title?: string;
  valid_from: string;
  valid_until: string;
  notes?: string;
  revoked_at?: string;
  revoked_by_user_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

const buildHeaders = (): HeadersInit => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useApprovalDelegations = () => {
  const [outgoing, setOutgoing] = useState<ApprovalDelegation[]>([]);
  const [incoming, setIncoming] = useState<ApprovalDelegation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/users/me/approval-delegations`, {
        headers: buildHeaders(),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as {
        outgoing?: ApprovalDelegation[];
        incoming?: ApprovalDelegation[];
      };
      setOutgoing(payload.outgoing ?? []);
      setIncoming(payload.incoming ?? []);
    } catch (err) {
      setError(`Erro ao carregar delegacoes: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDelegation = useCallback(
    async (input: { delegateUserId: string; validUntil: string; validFrom?: string; notes?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/users/me/approval-delegations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...buildHeaders(),
          },
          body: JSON.stringify(input),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
        await refresh();
        return true;
      } catch (err) {
        setError(`Erro ao criar delegacao: ${(err as Error).message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh]
  );

  const revokeDelegation = useCallback(
    async (delegationId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/users/me/approval-delegations/${encodeURIComponent(delegationId)}/revoke`, {
          method: 'POST',
          headers: buildHeaders(),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
        await refresh();
        return true;
      } catch (err) {
        setError(`Erro ao revogar delegacao: ${(err as Error).message}`);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [refresh]
  );

  return {
    outgoing,
    incoming,
    isLoading,
    error,
    refresh,
    createDelegation,
    revokeDelegation,
  };
};

export default useApprovalDelegations;
