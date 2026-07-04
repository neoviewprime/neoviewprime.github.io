import { companies, type Company, type Indicator, type PdfReport, type Project } from '@/data/mockData';
import type { UserManagementOptions } from '@/types/backend';

type CatalogEntry = {
  id: string;
  source_report_id: string;
  report_status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'archived';
  report_name: string;
  report_description?: string;
  report_date: string | null;
  report_size_label?: string | null;
  report_url?: string | null;
  company_id: string;
  company_name: string;
  superintendence_id?: string;
  superintendence_name?: string;
  management_id?: string;
  management_name?: string;
  project_id?: string;
  project_name?: string;
  path: string[];
  indicator_names: string[];
  metric_views?: number;
  metric_comments?: number;
  metric_likes?: number;
  metric_shares?: number;
};

type StoredMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  likedBy: string[];
};

type StoredComment = {
  id: string;
  sourceReportId: string;
  actor_key: string;
  message: string;
  created_at: string;
  parent_comment_id: string | null;
};

type StoredApprovalHistory = {
  id: string;
  report_id: string;
  approver_id: string;
  status: 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  approver_name?: string;
  report_name?: string;
  destination_path?: string[];
  submitter_name?: string;
};

type StoredApprovalDelegation = Record<string, unknown> & {
  id?: string;
  is_active?: boolean;
  revoked_at?: string;
};

type StoredDraft = {
  id: string;
  projectId: string;
  reportName: string;
  reportDescription: string;
  reportUrl: string;
  reportDate: string;
  indicatorsText: string;
  payload: Record<string, unknown>;
  updatedAt: string;
};

type SearchResult = {
  type: 'report' | 'indicator';
  sourceReportId: string;
  reportName: string;
  reportDescription?: string;
  reportDate?: string | null;
  companyId: string;
  companyName: string;
  superintendenceId: string;
  superintendenceName: string;
  managementId: string;
  managementName: string;
  projectId: string;
  projectName: string;
  indicatorName?: string;
  indicatorNames: string[];
  path: string[];
  score: number;
};

const DEMO_API_INSTALLED_KEY = '__neoview_demo_api_installed__';
const METRICS_STORAGE_KEY = 'neoview-demo-metrics';
const COMMENTS_STORAGE_KEY = 'neoview-demo-comments';
const REPORTS_STORAGE_KEY = 'neoview-demo-reports';
const PREFERENCES_STORAGE_KEY = 'neoview-demo-preferences';
const DRAFTS_STORAGE_KEY = 'neoview-demo-utd-drafts';
const APPROVAL_HISTORY_STORAGE_KEY = 'neoview-demo-approval-history';
const DELEGATIONS_STORAGE_KEY = 'neoview-demo-approval-delegations';

const isBrowser = () => typeof window !== 'undefined';
const isLocalhost = () =>
  isBrowser() &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const readStorage = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-NeoView-Demo-Api': 'true'
    }
  });

const getActorKey = async (request: Request) => {
  try {
    const payload = await request.clone().json() as { userId?: string; clientId?: string };
    return payload.userId || payload.clientId || 'demo-user';
  } catch {
    return 'demo-user';
  }
};

const buildCatalogFromCompany = (company: Company): CatalogEntry[] => {
  const items: CatalogEntry[] = [];

  company.superintendences.forEach((superintendence) => {
    superintendence.managements.forEach((management) => {
      management.projects.forEach((project) => {
        project.indicators.forEach((indicator) => {
          indicator.reports.forEach((report) => {
            items.push(buildCatalogEntry(company, superintendence, management, project, indicator, report));
          });
        });
      });
    });
  });

  return items;
};

const buildCatalogEntry = (
  company: Company,
  superintendence: Company['superintendences'][number],
  management: Company['superintendences'][number]['managements'][number],
  project: Project,
  indicator: Indicator,
  report: PdfReport
): CatalogEntry => ({
  id: report.id,
  source_report_id: report.id,
  report_status: 'approved',
  report_name: report.name,
  report_description: report.description,
  report_date: report.date,
  report_size_label: report.size,
  report_url: report.url ?? '/placeholder.svg',
  company_id: company.id,
  company_name: company.name,
  superintendence_id: superintendence.id,
  superintendence_name: superintendence.name,
  management_id: management.id,
  management_name: management.name,
  project_id: project.id,
  project_name: project.name,
  path: [company.name, superintendence.name, management.name, project.name],
  indicator_names: [indicator.name],
  metric_views: report.metrics.visualizacoes,
  metric_comments: report.metrics.comentarios,
  metric_likes: report.metrics.curtidas,
  metric_shares: report.metrics.compartilhamentos
});

const baseCatalog = companies.flatMap(buildCatalogFromCompany);

const readCustomReports = (): CatalogEntry[] => readStorage<CatalogEntry[]>(REPORTS_STORAGE_KEY, []);
const writeCustomReports = (items: CatalogEntry[]) => writeStorage(REPORTS_STORAGE_KEY, items);

const listCatalogEntries = (): CatalogEntry[] => [...baseCatalog, ...readCustomReports()];

const getMetricsStore = () => readStorage<Record<string, StoredMetrics>>(METRICS_STORAGE_KEY, {});
const writeMetricsStore = (value: Record<string, StoredMetrics>) => writeStorage(METRICS_STORAGE_KEY, value);

const ensureMetrics = (entry: CatalogEntry): StoredMetrics => {
  const store = getMetricsStore();
  if (!store[entry.source_report_id]) {
    store[entry.source_report_id] = {
      views: entry.metric_views ?? 0,
      comments: entry.metric_comments ?? 0,
      likes: entry.metric_likes ?? 0,
      shares: entry.metric_shares ?? 0,
      likedBy: []
    };
    writeMetricsStore(store);
  }
  return store[entry.source_report_id];
};

const updateMetrics = (sourceReportId: string, updater: (current: StoredMetrics) => StoredMetrics) => {
  const store = getMetricsStore();
  const current = store[sourceReportId] ?? { views: 0, comments: 0, likes: 0, shares: 0, likedBy: [] };
  const next = updater(current);
  store[sourceReportId] = next;
  writeMetricsStore(store);
  return next;
};

const readComments = (): StoredComment[] => readStorage<StoredComment[]>(COMMENTS_STORAGE_KEY, []);
const writeComments = (items: StoredComment[]) => writeStorage(COMMENTS_STORAGE_KEY, items);

const buildCommentTree = (sourceReportId: string) => {
  const nodes = readComments().filter((item) => item.sourceReportId === sourceReportId);
  const byParent = new Map<string | null, StoredComment[]>();

  nodes.forEach((node) => {
    const bucket = byParent.get(node.parent_comment_id) ?? [];
    bucket.push(node);
    byParent.set(node.parent_comment_id, bucket);
  });

  const visit = (parentId: string | null): Array<StoredComment & { replies: ReturnType<typeof visit> }> =>
    (byParent.get(parentId) ?? []).map((node) => ({
      ...node,
      replies: visit(node.id)
    }));

  return visit(null);
};

const defaultPreferences = () => ({
  user_id: 'demo-user',
  theme: 'light' as const,
  language: 'pt-BR' as const,
  notifications_enabled: true,
  email_notifications: false,
  dashboard_layout: {},
  favorite_reports: [],
  analytics_workspaces: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const readPreferences = () => readStorage(PREFERENCES_STORAGE_KEY, defaultPreferences());

const writePreferences = (patch: Record<string, unknown>) => {
  const current = readPreferences();
  const next = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString()
  };
  writeStorage(PREFERENCES_STORAGE_KEY, next);
  return next;
};

const readDrafts = (): StoredDraft[] => readStorage<StoredDraft[]>(DRAFTS_STORAGE_KEY, []);
const writeDrafts = (items: StoredDraft[]) => writeStorage(DRAFTS_STORAGE_KEY, items);

const readApprovalHistory = (): StoredApprovalHistory[] => readStorage<StoredApprovalHistory[]>(APPROVAL_HISTORY_STORAGE_KEY, []);
const writeApprovalHistory = (items: StoredApprovalHistory[]) => writeStorage(APPROVAL_HISTORY_STORAGE_KEY, items);

const readDelegations = () =>
  readStorage<{ outgoing: StoredApprovalDelegation[]; incoming: StoredApprovalDelegation[] }>(DELEGATIONS_STORAGE_KEY, { outgoing: [], incoming: [] });
const writeDelegations = (value: { outgoing: StoredApprovalDelegation[]; incoming: StoredApprovalDelegation[] }) => writeStorage(DELEGATIONS_STORAGE_KEY, value);

const demoUsers = [
  { id: 'demo-dir-1', name: 'Marina Costa', email: 'marina.costa@neoenergia.demo' },
  { id: 'demo-dir-2', name: 'Joao Lima', email: 'joao.lima@neoenergia.demo' },
  { id: 'demo-dir-3', name: 'Patricia Nunes', email: 'patricia.nunes@neoenergia.demo' },
  { id: 'demo-dir-4', name: 'Ricardo Alves', email: 'ricardo.alves@neoenergia.demo' }
];

const userManagementOptions: UserManagementOptions = {
  jobTitles: ['Analista', 'Especialista', 'Supervisor', 'Gerente', 'Superintendente', 'Diretor'],
  approvalJobTitles: ['Supervisor', 'Gerente', 'Superintendente', 'Diretor'],
  accessProfiles: [
    { code: 'viewer', label: 'Visualizador' },
    { code: 'analyst', label: 'Analista' },
    { code: 'supervisor', label: 'Supervisor' },
    { code: 'superadmin', label: 'Superadmin' }
  ],
  companies: companies.map((company) => ({
    id: company.id,
    name: company.name,
    superintendences: company.superintendences.map((superintendence) => ({
      id: superintendence.id,
      name: superintendence.name,
      managements: superintendence.managements.map((management) => ({
        id: management.id,
        name: management.name,
        projects: management.projects.map((project) => ({
          id: project.id,
          name: project.name
        }))
      }))
    }))
  }))
};

const buildSearchIndex = (): SearchResult[] => {
  const items: SearchResult[] = [];
  listCatalogEntries().forEach((entry) => {
    items.push({
      type: 'report',
      sourceReportId: entry.source_report_id,
      reportName: entry.report_name,
      reportDescription: entry.report_description,
      reportDate: entry.report_date,
      companyId: entry.company_id,
      companyName: entry.company_name,
      superintendenceId: entry.superintendence_id ?? '',
      superintendenceName: entry.superintendence_name ?? '',
      managementId: entry.management_id ?? '',
      managementName: entry.management_name ?? '',
      projectId: entry.project_id ?? '',
      projectName: entry.project_name ?? '',
      indicatorNames: entry.indicator_names,
      path: entry.path,
      score: 1
    });
    entry.indicator_names.forEach((indicatorName) => {
      items.push({
        type: 'indicator',
        sourceReportId: entry.source_report_id,
        reportName: entry.report_name,
        reportDescription: entry.report_description,
        reportDate: entry.report_date,
        companyId: entry.company_id,
        companyName: entry.company_name,
        superintendenceId: entry.superintendence_id ?? '',
        superintendenceName: entry.superintendence_name ?? '',
        managementId: entry.management_id ?? '',
        managementName: entry.management_name ?? '',
        projectId: entry.project_id ?? '',
        projectName: entry.project_name ?? '',
        indicatorName,
        indicatorNames: entry.indicator_names,
        path: entry.path,
        score: 1
      });
    });
  });
  return items;
};

const mockAnalyticsResponse = (url: URL) => {
  const metrics = (url.searchParams.get('metrics') ?? 'views,likes').split(',').filter(Boolean) as Array<'views' | 'likes' | 'comments' | 'shares'>;
  const companyId = url.searchParams.get('companyId') ?? 'coelba';
  const companyName = companies.find((company) => company.id === companyId)?.name ?? 'Neoenergia';
  const now = new Date();
  const points = Array.from({ length: 6 }, (_, index) => {
    const views = 40 + index * 9;
    const likes = 8 + index * 2;
    const comments = 3 + index;
    const shares = 2 + Math.floor(index / 2);
    return {
      key: `p-${index + 1}`,
      label: `P${index + 1}`,
      startDate: new Date(now.getFullYear(), now.getMonth() - (5 - index), 1).toISOString(),
      endDate: new Date(now.getFullYear(), now.getMonth() - (5 - index) + 1, 0).toISOString(),
      views,
      likes,
      comments,
      shares,
      reports: 1,
      total: views + likes + comments + shares
    };
  });

  const totals = points.reduce(
    (accumulator, point) => ({
      views: accumulator.views + point.views,
      likes: accumulator.likes + point.likes,
      comments: accumulator.comments + point.comments,
      shares: accumulator.shares + point.shares,
      reports: accumulator.reports + point.reports
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, reports: 0 }
  );

  return {
    companyId,
    companyName,
    period: url.searchParams.get('period') ?? 'month',
    metrics,
    range: {
      startDate: points[0]?.startDate ?? now.toISOString(),
      endDate: points.at(-1)?.endDate ?? now.toISOString()
    },
    totals,
    points
  };
};

const buildWorkspaceSummary = () => {
  const items = listCatalogEntries();
  const pendingReports = items.filter((item) => item.report_status === 'pending_approval').slice(0, 5);
  const recentHistory = readApprovalHistory().slice(-5).reverse();

  return {
    approvedCount: items.filter((item) => item.report_status === 'approved').length,
    rejectedCount: items.filter((item) => item.report_status === 'rejected').length,
    pendingCount: pendingReports.length,
    likedCount: items.length > 3 ? 3 : items.length,
    pendingReports: pendingReports.map((item) => ({
      id: item.id,
      name: item.report_name,
      submitter_name: 'Usuário Demo',
      uploaded_at: `${item.report_date ?? '2026-01-01'}T09:00:00Z`,
      destination_path: item.path
    })),
    recentDecisions: recentHistory.map((item) => ({
      id: item.id,
      reportId: item.report_id,
      reportName: item.report_name ?? 'Relatório',
      status: item.status,
      approvedAt: item.approved_at ?? item.updated_at,
      approverName: item.approver_name ?? 'Diretoria Demo',
      destinationPath: item.destination_path ?? []
    })),
    likedReports: items.slice(0, 4).map((item) => {
      const metrics = ensureMetrics(item);
      return {
        reportId: item.id,
        sourceReportId: item.source_report_id,
        reportName: item.report_name,
        companyId: item.company_id,
        companyName: item.company_name,
        superintendenceId: item.superintendence_id ?? null,
        managementId: item.management_id ?? null,
        projectId: item.project_id ?? null,
        reportDate: item.report_date,
        likes: metrics.likes,
        views: metrics.views,
        path: item.path
      };
    })
  };
};

const buildChatStreamResponse = (question: string) => {
  const sessionId = `sess-demo-${Date.now()}`;
  const answer = [
    'Esta e uma resposta demonstrativa da IRIS no modo offline.',
    `Pergunta recebida: "${question || 'consulta sem texto'}".`,
    'No Netlify sem backend, o assistente permanece operacional com respostas locais para a apresentacao.'
  ].join(' ');

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`event: session\ndata: ${JSON.stringify({ sessionId })}\n\n`));
      answer.split(' ').forEach((token) => {
        controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify({ token: `${token} ` })}\n\n`));
      });
      controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ sources: [], totalSources: 0 })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-NeoView-Demo-Api': 'true'
    }
  });
};

const tryHandleDemoApiRequest = async (request: Request): Promise<Response | null> => {
  const url = new URL(request.url, window.location.origin);
  if (url.origin !== window.location.origin) return null;
  if (!url.pathname.startsWith('/api/')) return null;

  const method = request.method.toUpperCase();
  const path = url.pathname.replace(/^\/api/, '');
  const catalog = listCatalogEntries();

  if (path === '/users/me/preferences' && method === 'GET') {
    return createJsonResponse(readPreferences());
  }

  if (path === '/users/me/preferences' && method === 'PUT') {
    const body = await request.clone().json().catch(() => ({}));
    return createJsonResponse(writePreferences(body as Record<string, unknown>));
  }

  if (path === '/notifications' && method === 'GET') {
    return createJsonResponse({ items: [], unreadCount: 0 });
  }

  if ((path === '/notifications/read-all' || /\/notifications\/.+\/read$/u.test(path)) && method === 'POST') {
    return createJsonResponse({ success: true });
  }

  if (path === '/users/options' && method === 'GET') {
    return createJsonResponse(userManagementOptions);
  }

  if (path === '/users' && method === 'GET') {
    return createJsonResponse({
      items: demoUsers.map((user, index) => ({
        id: user.id,
        email: user.email,
        full_name: user.name,
        employee_id: `U20260${index + 1}`,
        company_id: 'coelba',
        company_name: 'Neoenergia Coelba',
        superintendence_id: 'sup-tecnica-coelba',
        superintendence_name: 'Superintendência Técnica Coelba',
        management_id: 'ger-manutencao',
        management_name: 'Gerência de Manutenção',
        project_id: 'proj-eficiencia-rede',
        project_name: 'Eficiência de Rede',
        job_title: 'Diretor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    });
  }

  if (path === '/users' && method === 'POST') {
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    return createJsonResponse({
      id: `usr-demo-${Date.now()}`,
      approver: {
        id: 'demo-approver',
        name: 'Diretoria Demo',
        jobTitle: 'Diretor'
      },
      ...body
    });
  }

  if (path === '/users/me/password' && method === 'POST') {
    return createJsonResponse({ success: true });
  }

  if (path === '/users/me/approval-delegations' && method === 'GET') {
    return createJsonResponse(readDelegations());
  }

  if (path === '/users/me/approval-delegations' && method === 'POST') {
    const current = readDelegations();
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    current.outgoing.unshift({
      id: `deleg-${Date.now()}`,
      delegator_user_id: 'demo-user',
      delegate_user_id: String((body as { delegateUserId?: string }).delegateUserId ?? 'demo-dir-1'),
      valid_from: new Date().toISOString(),
      valid_until: String((body as { validUntil?: string }).validUntil ?? new Date().toISOString()),
      notes: (body as { notes?: string }).notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    });
    writeDelegations(current);
    return createJsonResponse({ success: true });
  }

  if (/^\/users\/me\/approval-delegations\/.+\/revoke$/u.test(path) && method === 'POST') {
    const current = readDelegations();
    const delegationId = path.split('/')[4];
    current.outgoing = current.outgoing.map((item) =>
      item.id === delegationId
        ? { ...item, is_active: false, revoked_at: new Date().toISOString() }
        : item
    );
    writeDelegations(current);
    return createJsonResponse({ success: true });
  }

  if (path === '/superadmin/overview' && method === 'GET') {
    return createJsonResponse({
      users: demoUsers.length,
      reports: catalog.length,
      approvals: catalog.filter((item) => item.report_status === 'pending_approval').length,
      chatMessages: 12,
      superadmins: ['marina.costa@neoenergia.demo']
    });
  }

  if (path === '/superadmin/activities' && method === 'GET') {
    return createJsonResponse({ items: readApprovalHistory() });
  }

  if (path === '/superadmin/reports' && method === 'GET') {
    return createJsonResponse({ items: catalog });
  }

  if (/^\/superadmin\/reports\/.+$/u.test(path) && method === 'DELETE') {
    return createJsonResponse({ success: true });
  }

  if (path === '/superadmin/reports/bulk-delete' && method === 'POST') {
    return createJsonResponse({ success: true, deleted: 0 });
  }

  if (path === '/superadmin/reset-data' && method === 'POST') {
    return createJsonResponse({ success: true });
  }

  if (path === '/reports/structure/sync' && method === 'POST') {
    return createJsonResponse({ success: true });
  }

  if (path === '/reports/structure/catalog/list' && method === 'GET') {
    return createJsonResponse({ items: catalog });
  }

  if (path === '/reports/structure/catalog/by-hierarchy' && method === 'GET') {
    return createJsonResponse({ items: catalog });
  }

  if (path === '/reports/catalog/search-files' && method === 'GET') {
    return createJsonResponse({ items: catalog });
  }

  if (path === '/reports/mine' && method === 'GET') {
    return createJsonResponse({ items: catalog });
  }

  if (path === '/reports/submit' && method === 'POST') {
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    const newEntry: CatalogEntry = {
      id: `demo-sub-${Date.now()}`,
      source_report_id: `demo-sub-${Date.now()}`,
      report_status: 'pending_approval',
      report_name: String((body as { reportName?: string }).reportName ?? 'Relatório demonstrativo'),
      report_description: String((body as { reportDescription?: string }).reportDescription ?? 'Relatório enviado em modo demo'),
      report_date: String((body as { reportDate?: string }).reportDate ?? new Date().toISOString().slice(0, 10)),
      report_size_label: String((body as { reportSizeLabel?: string }).reportSizeLabel ?? 'Link externo'),
      report_url: String((body as { reportUrl?: string }).reportUrl ?? '/placeholder.svg'),
      company_id: String((body as { companyId?: string }).companyId ?? 'coelba'),
      company_name: String((body as { companyName?: string }).companyName ?? 'Neoenergia Coelba'),
      superintendence_id: String((body as { superintendenceId?: string }).superintendenceId ?? 'sup-tecnica-coelba'),
      superintendence_name: String((body as { superintendenceName?: string }).superintendenceName ?? 'Superintendência Técnica Coelba'),
      management_id: String((body as { managementId?: string }).managementId ?? 'ger-manutencao'),
      management_name: String((body as { managementName?: string }).managementName ?? 'Gerência de Manutenção'),
      project_id: String((body as { projectId?: string }).projectId ?? 'proj-eficiencia-rede'),
      project_name: String((body as { projectName?: string }).projectName ?? 'Eficiência de Rede'),
      path: [
        String((body as { companyName?: string }).companyName ?? 'Neoenergia Coelba'),
        String((body as { superintendenceName?: string }).superintendenceName ?? 'Superintendência Técnica Coelba'),
        String((body as { managementName?: string }).managementName ?? 'Gerência de Manutenção'),
        String((body as { projectName?: string }).projectName ?? 'Eficiência de Rede')
      ],
      indicator_names: Array.isArray((body as { indicators?: Array<{ name?: string }> }).indicators)
        ? ((body as { indicators?: Array<{ name?: string }> }).indicators ?? []).map((item) => item.name ?? 'Indicador')
        : ['Indicador'],
      metric_views: 0,
      metric_comments: 0,
      metric_likes: 0,
      metric_shares: 0
    };
    writeCustomReports([newEntry, ...readCustomReports()]);
    return createJsonResponse({
      id: newEntry.id,
      approver: {
        id: 'demo-approver',
        name: 'Diretoria Demo',
        jobTitle: 'Diretor'
      }
    });
  }

  if (path === '/reports/utd/drafts/current' && method === 'PUT') {
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    const drafts = readDrafts().filter((item) => item.projectId !== String((body as { projectId?: string }).projectId ?? ''));
    drafts.unshift({
      id: `draft-${Date.now()}`,
      projectId: String((body as { projectId?: string }).projectId ?? ''),
      reportName: String((body as { reportName?: string }).reportName ?? ''),
      reportDescription: String((body as { reportDescription?: string }).reportDescription ?? ''),
      reportUrl: String((body as { reportUrl?: string }).reportUrl ?? ''),
      reportDate: String((body as { reportDate?: string }).reportDate ?? ''),
      indicatorsText: String((body as { indicatorsText?: string }).indicatorsText ?? ''),
      payload: ((body as { payload?: Record<string, unknown> }).payload ?? {}),
      updatedAt: new Date().toISOString()
    });
    writeDrafts(drafts);
    return createJsonResponse({ success: true });
  }

  if (path === '/reports/utd/drafts/current' && method === 'GET') {
    const projectId = url.searchParams.get('projectId') ?? '';
    const draft = readDrafts().find((item) => item.projectId === projectId) ?? null;
    return createJsonResponse({ item: draft });
  }

  if (path === '/reports/utd/drafts/current' && method === 'DELETE') {
    const projectId = url.searchParams.get('projectId') ?? '';
    writeDrafts(readDrafts().filter((item) => item.projectId !== projectId));
    return createJsonResponse({ success: true });
  }

  if (path === '/reports/workspace/manager' && method === 'GET') {
    return createJsonResponse(buildWorkspaceSummary());
  }

  if (path === '/reports/shared' && method === 'GET') {
    return createJsonResponse({ sharedWithMe: [], sharedByMe: [] });
  }

  if (path === '/reports/approvals/pending' && method === 'GET') {
    return createJsonResponse({
      items: catalog
        .filter((item) => item.report_status === 'pending_approval')
        .map((item) => ({
          id: item.id,
          source_report_id: item.source_report_id,
          name: item.report_name,
          description: item.report_description ?? '',
          uploaded_at: `${item.report_date ?? '2026-01-01'}T09:00:00Z`,
          indicator_name: item.indicator_names[0] ?? 'Indicador',
          submitter_name: 'Usuário Demo',
          destination_path: item.path,
          company_name: item.company_name,
          superintendence_name: item.superintendence_name ?? '',
          management_name: item.management_name ?? '',
          project_name: item.project_name ?? ''
        }))
    });
  }

  if (path === '/reports/approvals/history' && method === 'GET') {
    return createJsonResponse({ items: readApprovalHistory() });
  }

  if (path === '/reports/approvals/stats' && method === 'GET') {
    const history = readApprovalHistory();
    return createJsonResponse({
      pending: catalog.filter((item) => item.report_status === 'pending_approval').length,
      approved_today: history.filter((item) => item.status === 'approved').length,
      rejected_today: history.filter((item) => item.status === 'rejected').length,
      avg_approval_time_hours: 1.8
    });
  }

  if (/^\/reports\/approvals\/.+\/decision$/u.test(path) && method === 'POST') {
    const reportId = path.split('/')[3];
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    const nextStatus = String((body as { status?: string }).status) === 'rejected' ? 'rejected' : 'approved';
    const reports = readCustomReports().map((item) =>
      item.id === reportId ? { ...item, report_status: nextStatus as CatalogEntry['report_status'] } : item
    );
    writeCustomReports(reports);
    const currentHistory = readApprovalHistory();
    currentHistory.unshift({
      id: `approval-${Date.now()}`,
      report_id: reportId,
      approver_id: String((body as { approverId?: string }).approverId ?? 'demo-approver'),
      status: nextStatus,
      comments: (body as { comments?: string }).comments,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      approver_name: String((body as { approverName?: string }).approverName ?? 'Diretoria Demo'),
      report_name: reports.find((item) => item.id === reportId)?.report_name ?? 'Relatório demonstrativo',
      destination_path: reports.find((item) => item.id === reportId)?.path ?? [],
      submitter_name: 'Usuário Demo'
    });
    writeApprovalHistory(currentHistory);
    return createJsonResponse({ success: true });
  }

  if (path === '/reports/analytics' && method === 'GET') {
    return createJsonResponse(mockAnalyticsResponse(url));
  }

  if (path === '/search/catalog' && method === 'GET') {
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const results = buildSearchIndex()
      .filter((item) =>
        !query
          ? true
          : `${item.reportName} ${item.reportDescription ?? ''} ${item.indicatorName ?? ''} ${item.path.join(' ')}`
              .toLowerCase()
              .includes(query)
      )
      .slice(0, Number(url.searchParams.get('limit') ?? '8'));
    return createJsonResponse({ items: results });
  }

  if (path === '/chat/stream' && method === 'POST') {
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    return buildChatStreamResponse(String((body as { message?: string }).message ?? ''));
  }

  if (/^\/chat\/sessions\/[^/]+$/u.test(path) && method === 'GET') {
    const sessionId = path.split('/')[3];
    return createJsonResponse({
      session: {
        id: sessionId,
        title: 'Conversa demonstrativa',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      messages: []
    });
  }

  if (path === '/chat/sessions' && method === 'GET') {
    return createJsonResponse({
      sessions: [
        {
          id: 'sess-demo-1',
          title: 'Conversa demonstrativa',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    });
  }

  const engagementMatch = path.match(/^\/reports\/catalog\/by-source\/([^/]+)\/engagement$/u);
  if (engagementMatch && method === 'GET') {
    const entry = catalog.find((item) => item.source_report_id === decodeURIComponent(engagementMatch[1]));
    if (!entry) return createJsonResponse({ metrics: { views: 0, likes: 0, comments: 0, shares: 0 } });
    const metrics = ensureMetrics(entry);
    return createJsonResponse({ metrics });
  }

  if (engagementMatch && method === 'POST') {
    const sourceReportId = decodeURIComponent(engagementMatch[1]);
    const actorKey = await getActorKey(request);
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    const action = String((body as { action?: string }).action ?? 'view');
    const metrics = updateMetrics(sourceReportId, (current) => ({
      ...current,
      views: action === 'view' ? current.views + 1 : current.views
    }));
    return createJsonResponse({ metrics, actorKey });
  }

  const likesMatch = path.match(/^\/reports\/catalog\/by-source\/([^/]+)\/likes\/toggle$/u);
  if (likesMatch && method === 'POST') {
    const sourceReportId = decodeURIComponent(likesMatch[1]);
    const actorKey = await getActorKey(request);
    const metrics = updateMetrics(sourceReportId, (current) => {
      const liked = current.likedBy.includes(actorKey);
      const likedBy = liked ? current.likedBy.filter((item) => item !== actorKey) : [...current.likedBy, actorKey];
      return {
        ...current,
        likedBy,
        likes: liked ? Math.max(0, current.likes - 1) : current.likes + 1
      };
    });
    return createJsonResponse({ liked: metrics.likedBy.includes(actorKey), metrics });
  }

  const commentsMatch = path.match(/^\/reports\/catalog\/by-source\/([^/]+)\/comments$/u);
  if (commentsMatch && method === 'POST') {
    const sourceReportId = decodeURIComponent(commentsMatch[1]);
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    const comments = readComments();
    comments.push({
      id: `comment-${Date.now()}`,
      sourceReportId,
      actor_key: String((body as { userId?: string }).userId ?? 'demo-user'),
      message: String((body as { message?: string }).message ?? ''),
      created_at: new Date().toISOString(),
      parent_comment_id: (body as { parentCommentId?: string }).parentCommentId ?? null
    });
    writeComments(comments);
    const metrics = updateMetrics(sourceReportId, (current) => ({ ...current, comments: current.comments + 1 }));
    return createJsonResponse({ metrics });
  }

  const commentsTreeMatch = path.match(/^\/reports\/catalog\/by-source\/([^/]+)\/comments\/tree$/u);
  if (commentsTreeMatch && method === 'GET') {
    const sourceReportId = decodeURIComponent(commentsTreeMatch[1]);
    return createJsonResponse({ comments: buildCommentTree(sourceReportId) });
  }

  const sharesMatch = path.match(/^\/reports\/catalog\/by-source\/([^/]+)\/shares$/u);
  if (sharesMatch && method === 'POST') {
    const sourceReportId = decodeURIComponent(sharesMatch[1]);
    const body = await request.clone().json().catch(() => ({} as Record<string, unknown>));
    const recipients = Array.isArray((body as { recipients?: unknown[] }).recipients)
      ? (body as { recipients?: unknown[] }).recipients ?? []
      : [];
    const metrics = updateMetrics(sourceReportId, (current) => ({
      ...current,
      shares: current.shares + Math.max(1, recipients.length)
    }));
    return createJsonResponse({ metrics });
  }

  if (path === '/reports/catalog/share-targets' && method === 'GET') {
    return createJsonResponse({ users: demoUsers });
  }

  const deleteCatalogMatch = path.match(/^\/reports\/catalog\/([^/]+)$/u);
  if (deleteCatalogMatch && method === 'DELETE') {
    const reportId = decodeURIComponent(deleteCatalogMatch[1]);
    writeCustomReports(readCustomReports().filter((item) => item.id !== reportId));
    return createJsonResponse({ success: true });
  }

  return null;
};

export const installDemoApiMock = () => {
  if (!isBrowser()) return;
  const windowWithFlag = window as typeof window & { [DEMO_API_INSTALLED_KEY]?: boolean };
  if (windowWithFlag[DEMO_API_INSTALLED_KEY]) return;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const isLocalApiRequest = request.url.startsWith(window.location.origin) && new URL(request.url).pathname.startsWith('/api/');

    if (!isLocalApiRequest) {
      return nativeFetch(input, init);
    }

    if (!isLocalhost()) {
      const mocked = await tryHandleDemoApiRequest(request);
      if (mocked) return mocked;
    }

    try {
      const response = await nativeFetch(input, init);
      const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
      const isExpectedApiPayload =
        contentType.includes('application/json') ||
        contentType.includes('application/problem+json') ||
        contentType.includes('text/event-stream');

      if (response.ok && isExpectedApiPayload) return response;

      if (response.ok && !isExpectedApiPayload) {
        const mocked = await tryHandleDemoApiRequest(request);
        return mocked ?? response;
      }

      const mocked = await tryHandleDemoApiRequest(request);
      return mocked ?? response;
    } catch (error) {
      const mocked = await tryHandleDemoApiRequest(request);
      if (mocked) return mocked;
      throw error;
    }
  };

  windowWithFlag[DEMO_API_INSTALLED_KEY] = true;
};
