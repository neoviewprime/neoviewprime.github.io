import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthResponse, LoginCredentials, User, UserRole } from '@/types/backend';
import { syncStoredAnalyticsWorkspacesFromBackend } from '@/lib/analyticsWorkspace';
import { syncFavoriteReportsFromBackend } from '@/lib/reportFavorites';
import { companies } from '@/data/mockData';

const AUTH_STORAGE_KEY = 'neoview_auth';
const TOKEN_STORAGE_KEY = 'neoview_token';

type StoredAuth = {
  user: User;
  roles: UserRole[];
  token?: string;
};

interface AuthContextType {
  user: User | null;
  roles: UserRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (credentials: LoginCredentials & { full_name: string }) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapBackendUser = (input: Record<string, unknown>): User => {
  const now = new Date().toISOString();
  return {
    id: String(input.id ?? `usr-${Date.now()}`),
    email: String(input.email ?? 'usuario@neoview.local'),
    full_name: String(input.full_name ?? input.name ?? 'Usuario NeoView'),
    employee_id: input.employee_id ? String(input.employee_id) : undefined,
    department: input.department ? String(input.department) : undefined,
    created_at: String(input.created_at ?? now),
    updated_at: String(input.updated_at ?? now),
    last_login_at: input.last_login_at ? String(input.last_login_at) : undefined,
    phone: input.phone ? String(input.phone) : undefined,
    company_id: input.company_id ? String(input.company_id) : undefined,
    company_name: input.company_name ? String(input.company_name) : undefined,
    superintendence_id: input.superintendence_id ? String(input.superintendence_id) : undefined,
    superintendence_name: input.superintendence_name ? String(input.superintendence_name) : undefined,
    management_id: input.management_id ? String(input.management_id) : undefined,
    management_name: input.management_name ? String(input.management_name) : undefined,
    project_id: input.project_id ? String(input.project_id) : undefined,
    project_name: input.project_name ? String(input.project_name) : undefined,
    job_title: input.job_title ? String(input.job_title) : undefined,
    hierarchy_level: typeof input.hierarchy_level === 'number' ? input.hierarchy_level : undefined,
    manager_user_id: input.manager_user_id ? String(input.manager_user_id) : undefined,
    approver_user_id: input.approver_user_id ? String(input.approver_user_id) : undefined,
    status: input.status === 'inactive' ? 'inactive' : 'active',
    can_approve: Boolean(input.can_approve),
    roles: Array.isArray(input.roles) ? (input.roles as UserRole[]) : undefined
  };
};

const persistAuth = (auth: StoredAuth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  if (auth.token) localStorage.setItem(TOKEN_STORAGE_KEY, auth.token);
};

const buildDemoUser = (identifier: string): StoredAuth => {
  const now = new Date().toISOString();
  const normalizedIdentifier = identifier.trim();
  const isEmail = normalizedIdentifier.includes('@');
  const sanitized = normalizedIdentifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `demo-${Date.now()}`;
  const company = companies.find((entry) => entry.id === 'coelba') ?? companies[0];
  const superintendence = company?.superintendences.find((entry) => entry.id === 'sup-tecnica-coelba') ?? company?.superintendences[0];
  const management = superintendence?.managements.find((entry) => entry.id === 'ger-manutencao') ?? superintendence?.managements[0];
  const project = management?.projects.find((entry) => entry.id === 'proj-eficiencia-rede') ?? management?.projects[0];
  const email = isEmail ? normalizedIdentifier.toLowerCase() : `${sanitized}@demo.neoview.local`;
  const employeeId = isEmail ? `U-${sanitized.slice(0, 8).toUpperCase()}` : normalizedIdentifier.toUpperCase();
  const displayName = isEmail
    ? normalizedIdentifier.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Usuario Demo'
    : `Usuario ${employeeId}`;

  return {
    user: {
      id: `demo-${sanitized}`,
      email,
      full_name: displayName
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
      employee_id: employeeId,
      department: 'Diretoria Executiva',
      company_id: company?.id,
      company_name: company?.name,
      superintendence_id: superintendence?.id,
      superintendence_name: superintendence?.name,
      management_id: management?.id,
      management_name: management?.name,
      project_id: project?.id,
      project_name: project?.name,
      job_title: 'Diretor',
      hierarchy_level: 1,
      status: 'active',
      can_approve: true,
      roles: ['superadmin', 'supervisor'],
      created_at: now,
      updated_at: now,
      last_login_at: now
    },
    roles: ['superadmin', 'supervisor'],
    token: `demo-token-${sanitized}`
  };
};

const bootstrapUserState = (userId?: string) => {
  if (!userId) return;
  void syncFavoriteReportsFromBackend(userId);
  void syncStoredAnalyticsWorkspacesFromBackend(userId, userId);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw) as Partial<StoredAuth>;
        if (parsed?.user && Array.isArray(parsed.roles)) {
          setUser(parsed.user);
          setRoles(parsed.roles);
          bootstrapUserState(parsed.user.id);
        }
      } catch (error) {
        console.error('Erro ao restaurar sessao', error);
      } finally {
        setIsLoading(false);
      }
    };

    rehydrate();
  }, []);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const identifier = credentials.email.trim();
      const code = credentials.password.trim();

      if (!identifier) {
        return { user: null, session: null, error: 'Informe um e-mail ou matricula.' };
      }

      if (!code) {
        return { user: null, session: null, error: 'Informe o codigo enviado para continuar.' };
      }

      const demoAuth = buildDemoUser(identifier);
      persistAuth(demoAuth);
      setUser(demoAuth.user);
      setRoles(demoAuth.roles);
      bootstrapUserState(demoAuth.user.id);
      return {
        user: demoAuth.user,
        session: {
          access_token: demoAuth.token ?? 'demo-token',
          refresh_token: '',
          expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
        }
      };
    } catch {
      return { user: null, session: null, error: 'Nao foi possivel concluir o login da demonstracao' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (credentials: LoginCredentials & { full_name: string }): Promise<AuthResponse> => {
    setIsLoading(true);
    try {
      const user: User = {
        id: `usr-${Date.now()}`,
        email: credentials.email,
        full_name: credentials.full_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return { user, session: null };
    } catch {
      return { user: null, session: null, error: 'Erro ao criar conta' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setRoles([]);
  }, []);

  const resetPassword = useCallback(async (_email: string) => ({ success: true }), []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return { success: false, error: 'Usuario nao autenticado' };
    try {
      const updatedUser = {
        ...user,
        ...data,
        updated_at: new Date().toISOString()
      };
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) ?? undefined;
      persistAuth({ user: updatedUser, roles, token: token ?? undefined });
      setUser(updatedUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Nao foi possivel atualizar o perfil local da demonstracao' };
    }
  }, [roles, user]);

  const hasRole = useCallback((role: UserRole) => roles.includes(role), [roles]);
  const hasAnyRole = useCallback((checkRoles: UserRole[]) => checkRoles.some((role) => roles.includes(role)), [roles]);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        hasRole,
        hasAnyRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
}

export default useAuth;
