/**
 * ============================================================
 * NEOVIEW - BACKEND INTEGRATION TYPES
 * ============================================================
 *
 * Estes tipos foram projetados para fácil integração com:
 * - PostgreSQL / Supabase
 * - SQLite como banco principal da branch atual
 *
 * CONVENÇÕES:
 * - Todos os IDs são UUID (string)
 * - Timestamps são ISO 8601 (string)
 * - Enums mapeiam para VARCHAR no banco
 *
 * INTEGRAÇÃO COM COPILOT:
 * Ao baixar o projeto, use estes tipos como referência para
 * criar as queries SQL e integrações de backend.
 * ============================================================
 */

// ==================== AUTENTICAÇÃO ====================

/**
 * Usuário autenticado - mapeia para auth.users + profiles
 * 
 * PostgreSQL: public.profiles
 * Persistencia principal: tabela `users`
 */
export interface User {
  id: string;                    // UUID - PK
  email: string;                 // VARCHAR(255) - UNIQUE
  full_name: string;             // VARCHAR(255)
  employee_id?: string;          // VARCHAR(80)
  avatar_url?: string;           // TEXT - nullable
  department?: string;           // VARCHAR(100) - nullable
  phone?: string;                // VARCHAR(20) - nullable
  company_id?: string;           // VARCHAR(100)
  company_name?: string;         // VARCHAR(255)
  superintendence_id?: string;   // VARCHAR(100)
  superintendence_name?: string; // VARCHAR(255)
  management_id?: string;        // VARCHAR(100)
  management_name?: string;      // VARCHAR(255)
  project_id?: string;           // VARCHAR(100)
  project_name?: string;         // VARCHAR(255)
  job_title?: string;            // VARCHAR(80)
  hierarchy_level?: number;      // INTEGER
  manager_user_id?: string;      // UUID
  approver_user_id?: string;     // UUID
  status?: 'active' | 'inactive';
  can_approve?: boolean;
  roles?: UserRole[];
  created_at: string;            // TIMESTAMP WITH TIME ZONE
  updated_at: string;            // TIMESTAMP WITH TIME ZONE
  last_login_at?: string;        // TIMESTAMP WITH TIME ZONE - nullable
}

/**
 * Tipos de roles disponíveis
 * 
 * PostgreSQL: ENUM app_role
 * Persistencia principal: texto validado pela aplicacao
 */
export type UserRole = 'superadmin' | 'admin' | 'supervisor' | 'analyst' | 'viewer';

/**
 * Associação usuário-role
 * 
 * PostgreSQL: public.user_roles
 * Persistencia principal: tabela `user_roles`
 */
export interface UserRoleAssignment {
  id: string;                    // UUID - PK
  user_id: string;               // UUID - FK -> profiles.id
  role: UserRole;                // ENUM/VARCHAR
  company_id?: string;           // UUID - FK -> companies.id (escopo opcional)
  created_at: string;            // TIMESTAMP
}

/**
 * Credenciais de login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Resposta de autenticação
 */
export interface AuthResponse {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
  error?: string;
}

// ==================== HIERARQUIA ORGANIZACIONAL ====================

/**
 * Empresa
 * 
 * PostgreSQL: public.companies
 * Persistencia principal: estrutura hierarquica sincronizada no catalogo local
 */
export interface CompanyEntity {
  id: string;                    // UUID - PK
  name: string;                  // VARCHAR(100) - código curto (ex: "COELBA")
  full_name: string;             // VARCHAR(255) - nome completo
  logo_url?: string;             // TEXT - URL do logo
  is_active: boolean;            // BOOLEAN - default TRUE
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

/**
 * Superintendência
 * 
 * PostgreSQL: public.superintendences
 * Persistencia principal: estrutura hierarquica sincronizada no catalogo local
 */
export interface SuperintendenceEntity {
  id: string;                    // UUID - PK
  company_id: string;            // UUID - FK -> companies.id
  name: string;                  // VARCHAR(255)
  code?: string;                 // VARCHAR(50) - código interno
  supervisor_id?: string;        // UUID - FK -> profiles.id (gestor responsável)
  is_active: boolean;            // BOOLEAN
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

/**
 * Gerência
 * 
 * PostgreSQL: public.managements
 * Persistencia principal: estrutura hierarquica sincronizada no catalogo local
 */
export interface ManagementEntity {
  id: string;                    // UUID - PK
  superintendence_id: string;    // UUID - FK -> superintendences.id
  name: string;                  // VARCHAR(255)
  code?: string;                 // VARCHAR(50)
  manager_id?: string;           // UUID - FK -> profiles.id (gestor)
  is_active: boolean;            // BOOLEAN
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

/**
 * Projeto
 * 
 * PostgreSQL: public.projects
 * Persistencia principal: estrutura hierarquica sincronizada no catalogo local
 */
export interface ProjectEntity {
  id: string;                    // UUID - PK
  management_id: string;         // UUID - FK -> managements.id
  name: string;                  // VARCHAR(255)
  description?: string;          // TEXT
  code?: string;                 // VARCHAR(50)
  status: 'active' | 'inactive' | 'archived';  // ENUM/VARCHAR
  start_date?: string;           // DATE
  end_date?: string;             // DATE
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

// ==================== INDICADORES ====================

/**
 * Tendência do indicador
 */
export type IndicatorTrend = 'up' | 'down' | 'stable';

/**
 * Tipo de indicador
 */
export type IndicatorType = 'percentage' | 'number' | 'currency' | 'time' | 'count';

/**
 * Indicador
 * 
 * PostgreSQL: public.indicators
 * Persistencia principal: indicadores associados ao catalogo aprovado
 */
export interface IndicatorEntity {
  id: string;                    // UUID - PK
  project_id: string;            // UUID - FK -> projects.id
  name: string;                  // VARCHAR(255)
  description?: string;          // TEXT
  code?: string;                 // VARCHAR(50) - código ANEEL, por ex.
  value: number;                 // DECIMAL(18,4) - valor atual
  unit: string;                  // VARCHAR(50) - unidade de medida
  type: IndicatorType;           // ENUM/VARCHAR
  trend: IndicatorTrend;         // ENUM/VARCHAR
  target_value?: number;         // DECIMAL(18,4) - meta
  min_value?: number;            // DECIMAL(18,4) - limite inferior
  max_value?: number;            // DECIMAL(18,4) - limite superior
  last_updated_at: string;       // TIMESTAMP - última atualização do valor
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

// ==================== RELATÓRIOS PDF ====================

/**
 * Status do relatório no fluxo de aprovação
 */
export type ReportStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived';

/**
 * Relatório PDF
 * 
 * PostgreSQL: public.reports
 * Persistencia principal: tabela `reports`
 */
export interface ReportEntity {
  id: string;                    // UUID - PK
  indicator_id: string;          // UUID - FK -> indicators.id
  name: string;                  // VARCHAR(255) - nome do arquivo
  description?: string;          // TEXT
  file_url: string;              // TEXT - URL do storage
  file_path: string;             // TEXT - caminho no bucket
  file_size: number;             // BIGINT - tamanho em bytes
  mime_type: string;             // VARCHAR(100) - 'application/pdf'
  status: ReportStatus;          // ENUM/VARCHAR
  uploaded_by: string;           // UUID - FK -> profiles.id
  uploaded_at: string;           // TIMESTAMP
  version: number;               // INTEGER - versão do documento
  metadata?: Record<string, unknown>;  // JSONB - metadados adicionais
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

/**
 * Histórico de versões do relatório
 * 
 * PostgreSQL: public.report_versions
 * Persistencia principal: versoes e snapshots derivados do catalogo
 */
export interface ReportVersion {
  id: string;                    // UUID - PK
  report_id: string;             // UUID - FK -> reports.id
  version: number;               // INTEGER
  file_url: string;              // TEXT
  file_path: string;             // TEXT
  file_size: number;             // BIGINT
  uploaded_by: string;           // UUID
  uploaded_at: string;           // TIMESTAMP
  change_notes?: string;         // TEXT - notas da versão
}

// ==================== SISTEMA DE APROVAÇÃO ====================

/**
 * Status da aprovação
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/**
 * Aprovação de relatório
 * 
 * PostgreSQL: public.report_approvals
 * Persistencia principal: tabela `report_approvals`
 */
export interface ReportApproval {
  id: string;                    // UUID - PK
  report_id: string;             // UUID - FK -> reports.id
  approver_id: string;           // UUID - FK -> profiles.id (supervisor)
  status: ApprovalStatus;        // ENUM/VARCHAR
  comments?: string;             // TEXT - comentários do aprovador
  approved_at?: string;          // TIMESTAMP - data da decisão
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

/**
 * Supervisores por área (para identificar quem aprova)
 * 
 * PostgreSQL: public.area_supervisors
 * Persistencia principal: aprovadores derivados de cargo e hierarquia
 */
export interface AreaSupervisor {
  id: string;                    // UUID - PK
  user_id: string;               // UUID - FK -> profiles.id
  entity_type: 'company' | 'superintendence' | 'management' | 'project';
  entity_id: string;             // UUID - FK polimórfica
  can_approve_reports: boolean;  // BOOLEAN
  created_at: string;            // TIMESTAMP
}

export interface HierarchyOptionProject {
  id: string;
  name: string;
}

export interface HierarchyOptionManagement {
  id: string;
  name: string;
  projects: HierarchyOptionProject[];
}

export interface HierarchyOptionSuperintendence {
  id: string;
  name: string;
  managements: HierarchyOptionManagement[];
}

export interface HierarchyOptionCompany {
  id: string;
  name: string;
  superintendences: HierarchyOptionSuperintendence[];
}

export interface UserManagementOptions {
  jobTitles: string[];
  approvalJobTitles: string[];
  accessProfiles: Array<{ code: UserRole; label: string }>;
  companies: HierarchyOptionCompany[];
}

// ==================== CHATBOT / BUSCA SEMÂNTICA ====================

/**
 * Mensagem do chat
 * 
 * PostgreSQL: public.chat_messages
 * Persistencia principal: tabela `chat_messages`
 */
export interface ChatMessage {
  id: string;                    // UUID - PK
  session_id: string;            // UUID - identificador da sessão
  user_id?: string;              // UUID - FK -> profiles.id (null para anônimo)
  role: 'user' | 'assistant' | 'system';
  content: string;               // TEXT
  metadata?: {
    sources?: SearchSource[];    // fontes usadas na resposta
    tokens_used?: number;        // tokens consumidos
    model?: string;              // modelo usado
    totalSources?: number;       // quantidade total encontrada, mesmo se a UI mostrar um recorte
    intent?: string;             // intenção detectada pelo RAG/chat
    confidence?: number;         // confiança aproximada da recuperação
    retrievalMode?: string;      // estratégia usada: semantica, indicadores, navegacao etc.
    evaluation?: 'positive' | 'negative';
  };
  created_at: string;            // TIMESTAMP
}

/**
 * Fonte de busca usada pelo chatbot
 */
export interface SearchSource {
  type: 'indicator' | 'report' | 'project';
  id: string;
  name: string;
  path: string[];
  description?: string;
  meta?: string;
  relevance_score?: number;
  hierarchy?: {
    companyId?: string;
    superintendenceId?: string;
    managementId?: string;
    projectId?: string;
  };
}

/**
 * Sessão de chat
 * 
 * PostgreSQL: public.chat_sessions
 * Persistencia principal: tabela `chat_sessions`
 */
export interface ChatSession {
  id: string;                    // UUID - PK
  user_id?: string;              // UUID - FK -> profiles.id
  title?: string;                // VARCHAR(255) - título gerado
  is_active: boolean;            // BOOLEAN
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

// ==================== AUDITORIA ====================

/**
 * Log de auditoria
 * 
 * PostgreSQL: public.audit_logs
 * Persistencia principal: tabela `audit_logs`
 */
export interface AuditLog {
  id: string;                    // UUID - PK
  user_id?: string;              // UUID - FK -> profiles.id
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'approve' | 'reject' | 'reset';
  entity_type: string;           // VARCHAR(100) - nome da tabela/entidade
  entity_id?: string;            // UUID - ID do registro
  old_values?: Record<string, unknown>;  // JSONB - valores anteriores
  new_values?: Record<string, unknown>;  // JSONB - valores novos
  ip_address?: string;           // INET/VARCHAR(45)
  user_agent?: string;           // TEXT
  created_at: string;            // TIMESTAMP
}

// ==================== CONFIGURAÇÕES ====================

/**
 * Configuração do sistema
 * 
 * PostgreSQL: public.system_settings
 * Persistencia principal: configuracoes derivadas do backend
 */
export interface SystemSetting {
  id: string;                    // UUID - PK
  key: string;                   // VARCHAR(100) - UNIQUE
  value: string;                 // TEXT - valor serializado
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;          // TEXT
  is_public: boolean;            // BOOLEAN - visível no frontend
  updated_by?: string;           // UUID - FK -> profiles.id
  updated_at: string;            // TIMESTAMP
}

/**
 * Preferências do usuário
 * 
 * PostgreSQL: public.user_preferences
 * Persistencia principal: preferencias persistidas pelo backend
 */
export interface UserPreference {
  id?: string;                   // UUID - PK opcional na branch SQLite atual
  user_id: string;               // UUID - FK -> profiles.id
  theme: 'light' | 'dark' | 'system';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_layout?: Record<string, unknown>;  // JSONB - layout personalizado
  favorite_reports?: unknown[];  // JSONB/TEXT - favoritos do usuario
  analytics_workspaces?: unknown[]; // JSONB/TEXT - workspaces analiticos do usuario
  created_at: string;            // TIMESTAMP
  updated_at: string;            // TIMESTAMP
}

// ==================== TIPOS AUXILIARES ====================

/**
 * Resposta paginada padrão
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Filtros de busca genéricos
 */
export interface SearchFilters {
  query?: string;
  company_id?: string;
  superintendence_id?: string;
  management_id?: string;
  project_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Resposta de upload de arquivo
 */
export interface FileUploadResponse {
  id: string;
  file_url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
}

/**
 * Erro da API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ChatPageId = 'register' | 'workspace' | 'reports' | 'approvals' | 'generic';

export interface ChatPageContext {
  page: ChatPageId;
  title: string;
  summary: string;
  hints?: string[];
}
