import { useCallback, useState } from 'react';
import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';
import type { User, UserManagementOptions } from '@/types/backend';

export interface UserRegistrationInput {
  fullName: string;
  email: string;
  employeeId: string;
  password: string;
  companyId: string;
  companyName: string;
  superintendenceId: string;
  superintendenceName: string;
  managementId?: string | null;
  managementName?: string | null;
  projectId?: string | null;
  projectName?: string | null;
  jobTitle: string;
  managerUserId?: string;
  status: 'active' | 'inactive';
  phone?: string;
}

const buildHeaders = (): HeadersInit => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useUserManagement = () => {
  const [options, setOptions] = useState<UserManagementOptions | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/users/options`, {
        headers: buildHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as UserManagementOptions;
      setOptions(payload);
      return payload;
    } catch (err) {
      setError(`Erro ao carregar opcoes de cadastro: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(
    async (filters?: {
      companyId?: string;
      superintendenceId?: string;
      managementId?: string;
      projectId?: string;
      approvalOnly?: boolean;
      activeOnly?: boolean;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (filters?.companyId) query.set('companyId', filters.companyId);
        if (filters?.superintendenceId) query.set('superintendenceId', filters.superintendenceId);
        if (filters?.managementId) query.set('managementId', filters.managementId);
        if (filters?.projectId) query.set('projectId', filters.projectId);
        if (filters?.approvalOnly) query.set('approvalOnly', 'true');
        if (filters?.activeOnly === false) query.set('activeOnly', 'false');

        const response = await fetch(`${API_URL}/users${query.toString() ? `?${query.toString()}` : ''}`, {
          headers: buildHeaders()
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: User[] };
        setUsers(payload.items ?? []);
        return payload.items ?? [];
      } catch (err) {
        setError(`Erro ao carregar usuarios: ${(err as Error).message}`);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createUser = useCallback(async (input: UserRegistrationInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildHeaders()
        },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as { id?: string; approver?: { id: string; name: string; jobTitle?: string }; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }
      return payload;
    } catch (err) {
      setError(`Erro ao cadastrar usuario: ${(err as Error).message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (input: { currentPassword: string; newPassword: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/users/me/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildHeaders()
        },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }
      return Boolean(payload.success);
    } catch (err) {
      setError(`Erro ao atualizar senha: ${(err as Error).message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    options,
    users,
    isLoading,
    error,
    fetchOptions,
    fetchUsers,
    createUser,
    updatePassword
  };
};

export default useUserManagement;
