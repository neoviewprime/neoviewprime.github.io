import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Command,
  FileHeart,
  Heart,
  LayoutDashboard,
  ListTodo,
  MapPinned,
  ShieldCheck,
  Share2,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { FloatingAssistant } from '@/components/FloatingAssistant';
import { ReportCard } from '@/components/ReportCard';
import { WorkspaceSection, type WorkspaceSectionListItem } from '@/components/workspace/WorkspaceSection';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import { COELBA_UTD_FLOW_ID, isCoelbaUtdPath } from '@/lib/coelbaUtd';
import {
  listStoredAnalyticsWorkspaces,
  syncStoredAnalyticsWorkspacesFromBackend,
  type StoredAnalyticsWorkspace
} from '@/lib/analyticsWorkspace';
import { getClientId } from '@/lib/clientIdentity';
import { getStoredAuthToken } from '@/lib/authToken';
import { formatMetricCount } from '@/lib/metricLabels';
import { mapearMetricasDaApi } from '@/lib/metricasEngajamento';
import { useAuth } from '@/hooks/useAuth';
import type { ChatPageContext } from '@/types/backend';
import { companies } from '@/data/mockData';

type ManagerSummary = {
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  likedCount: number;
  pendingReports: Array<{
    id: string;
    name: string;
    submitter_name: string;
    uploaded_at: string;
    destination_path: string[];
  }>;
  recentDecisions: Array<{
    id: string;
    reportId: string;
    reportName: string;
    status: 'approved' | 'rejected';
    approvedAt: string;
    approverName: string;
    destinationPath: string[];
  }>;
  likedReports: Array<{
    reportId: string;
    sourceReportId: string | null;
    reportName: string;
    companyId: string | null;
    companyName: string;
    superintendenceId: string | null;
    managementId: string | null;
    projectId: string | null;
    reportDate: string | null;
    likes: number;
    views: number;
    path: string[];
  }>;
};

type SharedWorkspaceReport = {
  direction: 'incoming' | 'outgoing';
  report_catalog_id: string;
  source_report_id: string;
  report_name: string;
  report_description: string;
  report_date: string | null;
  report_size_label: string | null;
  report_url: string | null;
  company_id: string | null;
  company_name: string | null;
  superintendence_id: string | null;
  superintendence_name: string | null;
  management_id: string | null;
  management_name: string | null;
  project_id: string | null;
  project_name: string | null;
  path: string[];
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  shared_at: string;
  counterparty_label: string;
  counterparty_count: number;
  action_url: string;
};

type SharedReportsPayload = {
  sharedWithMe: SharedWorkspaceReport[];
  sharedByMe: SharedWorkspaceReport[];
};

type WorkspaceSuggestion = WorkspaceSectionListItem;

const showLegacyWorkspacePanels = false;

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : 'Sem data';

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Sem data';

const normalizeHierarchyName = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const resolveLikedReportHierarchy = (item: ManagerSummary['likedReports'][number]) => {
  const pathNames = item.path ?? [];
  const companyName = pathNames[0] || item.companyName;
  const superintendenceName = pathNames[1];
  const managementName = pathNames[2];
  const projectName = pathNames[3];

  const company = companies.find(
    (entry) =>
      entry.id === item.companyId ||
      normalizeHierarchyName(entry.name) === normalizeHierarchyName(companyName) ||
      normalizeHierarchyName(entry.fullName) === normalizeHierarchyName(companyName)
  );

  const superintendence = company?.superintendences.find(
    (entry) =>
      entry.id === item.superintendenceId ||
      normalizeHierarchyName(entry.name) === normalizeHierarchyName(superintendenceName)
  );

  const management = superintendence?.managements.find(
    (entry) =>
      entry.id === item.managementId ||
      normalizeHierarchyName(entry.name) === normalizeHierarchyName(managementName)
  );

  const project = management?.projects.find(
    (entry) =>
      entry.id === item.projectId ||
      normalizeHierarchyName(entry.name) === normalizeHierarchyName(projectName)
  );

  return {
    companyId: item.companyId ?? company?.id ?? null,
    superintendenceId: item.superintendenceId ?? superintendence?.id ?? null,
    managementId: item.managementId ?? management?.id ?? null,
    projectId: item.projectId ?? project?.id ?? null,
  };
};

const appendOpenReportFlag = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}openReport=1`;
};

const buildLikedReportWorkspaceUrl = (item: ManagerSummary['likedReports'][number], openReport = false) => {
  const hierarchy = resolveLikedReportHierarchy(item);
  const params = new URLSearchParams();

  if (hierarchy.companyId) params.set('company', hierarchy.companyId);
  if (hierarchy.superintendenceId) params.set('sup', hierarchy.superintendenceId);
  if (hierarchy.managementId) params.set('mgmt', hierarchy.managementId);
  if (hierarchy.projectId) params.set('proj', hierarchy.projectId);
  if (
    isCoelbaUtdPath({
      companyId: hierarchy.companyId,
      superintendenceId: hierarchy.superintendenceId,
      managementId: hierarchy.managementId
    })
  ) {
    params.set('view', COELBA_UTD_FLOW_ID);
  }
  if (item.sourceReportId) params.set('report', item.sourceReportId);
  if (item.reportName) params.set('reportName', item.reportName);
  if (openReport) params.set('openReport', '1');

  const query = params.toString();
  return query ? `/dashboard?${query}` : '/reports';
};

const toReportCardModel = (item: SharedWorkspaceReport) => ({
  id: item.source_report_id,
  name: item.report_name,
  date: item.report_date ?? item.shared_at.slice(0, 10),
  size: item.report_size_label ?? 'Link externo',
  description: item.report_description || 'Relatório compartilhado no NeoView.',
  url: item.report_url ?? undefined,
  metrics: mapearMetricasDaApi(item.metrics),
});

const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const actorKey = user?.id ?? getClientId();
  const [summary, setSummary] = useState<ManagerSummary | null>(null);
  const [sharedReports, setSharedReports] = useState<SharedReportsPayload>({ sharedWithMe: [], sharedByMe: [] });
  const [chartHistory, setChartHistory] = useState<StoredAnalyticsWorkspace[]>([]);
  const [openPanels, setOpenPanels] = useState<string[]>([]);
  const [panelSearch, setPanelSearch] = useState({
    sharedWithMe: '',
    sharedByMe: '',
    likedReports: '',
    charts: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ actorKey });
        if (user?.id) {
          params.set('approverId', user.id);
        }
        const token = getStoredAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [summaryResponse, sharedResponse] = await Promise.all([
          fetch(`${API_URL}/reports/workspace/manager?${params.toString()}`, { headers }),
          fetch(`${API_URL}/reports/shared`, { headers }),
        ]);
        if (!summaryResponse.ok) throw new Error(`HTTP ${summaryResponse.status}`);
        if (!sharedResponse.ok) throw new Error(`HTTP ${sharedResponse.status}`);
        const payload = (await summaryResponse.json()) as ManagerSummary;
        const sharedPayload = (await sharedResponse.json()) as SharedReportsPayload;
        setSummary(payload);
        setSharedReports({
          sharedWithMe: sharedPayload.sharedWithMe ?? [],
          sharedByMe: sharedPayload.sharedByMe ?? [],
        });
      } catch (err) {
        setError(`Erro ao carregar workspace: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
    void syncStoredAnalyticsWorkspacesFromBackend(actorKey, user?.id).finally(() => {
      setChartHistory(listStoredAnalyticsWorkspaces(actorKey));
    });
  }, [actorKey, user?.id]);

  const pendingReports = summary?.pendingReports ?? [];
  const recentDecisions = summary?.recentDecisions ?? [];

  const sharedWithMeNeedle = useDeferredValue(panelSearch.sharedWithMe).trim().toLowerCase();
  const sharedByMeNeedle = useDeferredValue(panelSearch.sharedByMe).trim().toLowerCase();
  const likedReportsNeedle = useDeferredValue(panelSearch.likedReports).trim().toLowerCase();
  const chartsNeedle = useDeferredValue(panelSearch.charts).trim().toLowerCase();

  const filteredSharedWithMe = useMemo(
    () =>
      sharedReports.sharedWithMe.filter((item) =>
        !sharedWithMeNeedle
          ? true
          : `${item.report_name} ${item.counterparty_label} ${item.path.join(' ')}`
              .toLowerCase()
              .includes(sharedWithMeNeedle)
      ),
    [sharedReports.sharedWithMe, sharedWithMeNeedle]
  );

  const filteredSharedByMe = useMemo(
    () =>
      sharedReports.sharedByMe.filter((item) =>
        !sharedByMeNeedle
          ? true
          : `${item.report_name} ${item.counterparty_label} ${item.path.join(' ')}`
              .toLowerCase()
              .includes(sharedByMeNeedle)
      ),
    [sharedReports.sharedByMe, sharedByMeNeedle]
  );

  const filteredLikedReports = useMemo(
    () =>
      (summary?.likedReports ?? []).filter((item) =>
        !likedReportsNeedle
          ? true
          : `${item.reportName} ${item.companyName} ${item.path.join(' ')}`
              .toLowerCase()
              .includes(likedReportsNeedle)
      ),
    [likedReportsNeedle, summary?.likedReports]
  );

  const filteredCharts = useMemo(
    () =>
      chartHistory.filter((item) =>
        !chartsNeedle
          ? true
          : `${item.title} ${item.reportName} ${item.companyName} ${item.metrics.join(' ')}`
              .toLowerCase()
              .includes(chartsNeedle)
      ),
    [chartHistory, chartsNeedle]
  );

  const sharedWithMeSuggestions = useMemo<WorkspaceSuggestion[]>(() => {
    const pool = sharedWithMeNeedle ? filteredSharedWithMe : sharedReports.sharedWithMe;
    return pool.slice(0, 3).map((item) => ({
      id: `shared-with-me-${item.report_catalog_id}`,
      title: item.report_name,
      subtitle: `Compartilhado por ${item.counterparty_label}`,
      meta: item.path.join(' > '),
    }));
  }, [filteredSharedWithMe, sharedReports.sharedWithMe, sharedWithMeNeedle]);

  const sharedByMeSuggestions = useMemo<WorkspaceSuggestion[]>(() => {
    const pool = sharedByMeNeedle ? filteredSharedByMe : sharedReports.sharedByMe;
    return pool.slice(0, 3).map((item) => ({
      id: `shared-by-me-${item.report_catalog_id}`,
      title: item.report_name,
      subtitle: `Compartilhado com ${item.counterparty_label}`,
      meta: item.path.join(' > '),
    }));
  }, [filteredSharedByMe, sharedReports.sharedByMe, sharedByMeNeedle]);

  const likedSuggestions = useMemo<WorkspaceSuggestion[]>(() => {
    const pool = likedReportsNeedle ? filteredLikedReports : summary?.likedReports ?? [];
    return pool.slice(0, 3).map((item) => ({
      id: `liked-${item.reportId}`,
      title: item.reportName,
      subtitle: item.companyName,
      meta: item.path.join(' > '),
    }));
  }, [filteredLikedReports, likedReportsNeedle, summary?.likedReports]);

  const chartSuggestions = useMemo<WorkspaceSuggestion[]>(() => {
    const pool = chartsNeedle ? filteredCharts : chartHistory;
    return pool.slice(0, 3).map((item) => ({
      id: `chart-${item.id}`,
      title: item.title,
      subtitle: item.reportName,
      meta: `${item.companyName} / ${item.metrics.join(' + ')}`,
    }));
  }, [chartHistory, chartsNeedle, filteredCharts]);

  const sharedWithMeRecentItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      sharedReports.sharedWithMe.map((item) => ({
        id: `shared-with-me-recent-${item.report_catalog_id}`,
        title: item.report_name,
        subtitle: `Compartilhado por ${item.counterparty_label}`,
        meta: item.path.join(' > '),
        detail: `Último envio em ${formatDateTime(item.shared_at)}`,
        badge: 'Recebido',
        onSelect: () => navigate(item.action_url),
        actionLabel: 'Abrir',
        onAction: () => navigate(appendOpenReportFlag(item.action_url))
      })),
    [navigate, sharedReports.sharedWithMe]
  );

  const sharedWithMeResultItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      filteredSharedWithMe.map((item) => ({
        id: `shared-with-me-result-${item.report_catalog_id}`,
        title: item.report_name,
        subtitle: `Compartilhado por ${item.counterparty_label}`,
        meta: item.path.join(' > '),
        detail: `Último envio em ${formatDateTime(item.shared_at)}`,
        badge: 'Recebido',
        onSelect: () => navigate(item.action_url),
        actionLabel: 'Abrir',
        onAction: () => navigate(appendOpenReportFlag(item.action_url))
      })),
    [filteredSharedWithMe, navigate]
  );

  const sharedByMeRecentItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      sharedReports.sharedByMe.map((item) => ({
        id: `shared-by-me-recent-${item.report_catalog_id}`,
        title: item.report_name,
        subtitle: `Compartilhado com ${item.counterparty_label}`,
        meta: item.path.join(' > '),
        detail: `Último envio em ${formatDateTime(item.shared_at)}`,
        badge: 'Enviado',
        onSelect: () => navigate(item.action_url),
        actionLabel: 'Abrir',
        onAction: () => navigate(appendOpenReportFlag(item.action_url))
      })),
    [navigate, sharedReports.sharedByMe]
  );

  const sharedByMeResultItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      filteredSharedByMe.map((item) => ({
        id: `shared-by-me-result-${item.report_catalog_id}`,
        title: item.report_name,
        subtitle: `Compartilhado com ${item.counterparty_label}`,
        meta: item.path.join(' > '),
        detail: `Último envio em ${formatDateTime(item.shared_at)}`,
        badge: 'Enviado',
        onSelect: () => navigate(item.action_url),
        actionLabel: 'Abrir',
        onAction: () => navigate(appendOpenReportFlag(item.action_url))
      })),
    [filteredSharedByMe, navigate]
  );

  const likedRecentItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      (summary?.likedReports ?? []).map((item) => ({
        id: `liked-recent-${item.reportId}`,
        title: item.reportName,
        subtitle: item.companyName,
        meta: item.path.join(' > '),
        detail: `${formatMetricCount('curtidas', item.likes)} - ${formatMetricCount('visualizacoes', item.views)} - ${formatDate(item.reportDate)}`,
        badge: 'Curtido',
        onSelect: () => navigate(buildLikedReportWorkspaceUrl(item)),
        actionLabel: 'Abrir',
        onAction: () => navigate(buildLikedReportWorkspaceUrl(item, true))
      })),
    [navigate, summary?.likedReports]
  );

  const likedResultItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      filteredLikedReports.map((item) => ({
        id: `liked-result-${item.reportId}`,
        title: item.reportName,
        subtitle: item.companyName,
        meta: item.path.join(' > '),
        detail: `${formatMetricCount('curtidas', item.likes)} - ${formatMetricCount('visualizacoes', item.views)} - ${formatDate(item.reportDate)}`,
        badge: 'Curtido',
        onSelect: () => navigate(buildLikedReportWorkspaceUrl(item)),
        actionLabel: 'Abrir',
        onAction: () => navigate(buildLikedReportWorkspaceUrl(item, true))
      })),
    [filteredLikedReports, navigate]
  );

  const chartRecentItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      chartHistory.map((item) => ({
        id: `chart-recent-${item.id}`,
        title: item.title,
        subtitle: item.reportName,
        meta: `${item.companyName} / ${item.metrics.join(' + ')}`,
        detail: `Atualizado em ${formatDateTime(item.updatedAt)}`,
        badge: item.chartType,
        actionLabel: 'Abrir',
        onAction: () =>
          navigate(`/indicators?company=${encodeURIComponent(item.companyId)}&chart=${encodeURIComponent(item.id)}`)
      })),
    [chartHistory, navigate]
  );

  const chartResultItems = useMemo<WorkspaceSectionListItem[]>(
    () =>
      filteredCharts.map((item) => ({
        id: `chart-result-${item.id}`,
        title: item.title,
        subtitle: item.reportName,
        meta: `${item.companyName} / ${item.metrics.join(' + ')}`,
        detail: `Atualizado em ${formatDateTime(item.updatedAt)}`,
        badge: item.chartType,
        actionLabel: 'Abrir',
        onAction: () =>
          navigate(`/indicators?company=${encodeURIComponent(item.companyId)}&chart=${encodeURIComponent(item.id)}`)
      })),
    [filteredCharts, navigate]
  );

  const setPanelQuery = (key: 'sharedWithMe' | 'sharedByMe' | 'likedReports' | 'charts', value: string) => {
    setPanelSearch((current) => ({ ...current, [key]: value }));
  };
  const kpis = [
    {
      label: 'Aprovados por você',
      value: summary?.approvedCount ?? 0,
      helper: 'Decisões liberadas para publicação',
      icon: CheckCircle2,
      iconTone: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
      borderTone: 'border-emerald-500/20',
    },
    {
      label: 'Rejeitados por você',
      value: summary?.rejectedCount ?? 0,
      helper: 'Itens devolvidos para ajuste',
      icon: XCircle,
      iconTone: 'bg-rose-500/12 text-rose-600 dark:text-rose-300',
      borderTone: 'border-rose-500/20',
    },
    {
      label: 'Pendentes na sua fila',
      value: summary?.pendingCount ?? 0,
      helper: 'Prioridades aguardando sua análise',
      icon: Clock3,
      iconTone: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
      borderTone: 'border-amber-500/20',
    },
    {
      label: 'Relatórios curtidos',
      value: summary?.likedCount ?? 0,
      helper: 'Conteúdos relevantes para acompanhamento',
      icon: FileHeart,
      iconTone: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
      borderTone: 'border-sky-500/20',
    },
    {
      label: 'Gráficos montados',
      value: chartHistory.length,
      helper: 'Análises construídas na aba Estatísticas',
      icon: BarChart3,
      iconTone: 'bg-violet-500/12 text-violet-700 dark:text-violet-300',
      borderTone: 'border-violet-500/20',
    },
  ];

  const activeSearchSummary = (Object.entries(panelSearch) as Array<[string, string]>)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `${key}: ${value.trim()}`)
    .join(' | ');

  const chatPageContext = useMemo<ChatPageContext>(() => {
    const pendingNames = pendingReports.slice(0, 3).map((item) => item.name);
    const recentDecision = recentDecisions[0]?.reportName;
    const likedHighlight = filteredLikedReports[0]?.reportName;
    const chartHighlight = filteredCharts[0]?.title;
    const sharedHighlight = filteredSharedWithMe[0]?.report_name;

    return {
      page: 'workspace',
      title: 'Meu Workspace',
      summary: [
        'O usuário está no workspace pessoal.',
        summary
          ? `Resumo atual: ${summary.pendingCount} pendência(s), ${summary.approvedCount} aprovação(ões), ${summary.rejectedCount} rejeição(ões) e ${summary.likedCount} relatório(s) curtido(s).`
          : 'Os dados do workspace ainda estão carregando ou indisponíveis.',
        activeSearchSummary
          ? `Buscas ativas nas seções expansivas: ${activeSearchSummary}.`
          : 'Não há buscas ativas nas seções expansivas do workspace.',
        pendingNames.length ? `Pendências mais visíveis: ${pendingNames.join(', ')}.` : 'Nenhuma pendência está visível no momento.',
        recentDecision ? `Decisão recente em destaque: ${recentDecision}.` : 'Não há decisão recente destacada.',
        sharedHighlight ? `Relatório compartilhado em destaque: ${sharedHighlight}.` : 'Nenhum compartilhamento está em destaque.',
        likedHighlight ? `Último destaque curtido visível: ${likedHighlight}.` : 'Nenhum relatório curtido está em destaque.',
        chartHighlight ? `Gráfico em destaque: ${chartHighlight}.` : 'Nenhum gráfico salvo está em destaque.',
      ].join(' '),
      hints: [
        'Resuma o workspace do próprio usuário com base nos números carregados.',
        'Priorize pendências, compartilhamentos, favoritos e gráficos ao responder.',
        'Se o usuário pedir orientação, diga o próximo melhor passo dentro da fila, compartilhamentos, favoritos ou estatísticas.',
      ],
    };
  }, [activeSearchSummary, filteredCharts, filteredLikedReports, filteredSharedWithMe, pendingReports, recentDecisions, summary]);
  return (
    <>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <section className="rounded-[32px] border border-border/70 bg-transparent p-6 shadow-sm lg:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <Badge className="mb-5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-200">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Painel executivo pessoal
                </Badge>

                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-emerald-600 dark:text-emerald-300">
                    <LayoutDashboard className="h-7 w-7" />
                  </div>

                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                      Meu Workspace
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
                      Agora as seções principais ficam compactas por padrão e se expandem sob demanda, com busca contextual e sugestões em tempo real para deixar a navegação mais objetiva.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:max-w-[430px]">
                <div className="rounded-[28px] border border-border/70 bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Nova experiência de exploração</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Cada bloco expansível agora tem sua própria busca, com lupa, sugestões dinâmicas e exatamente três atalhos visíveis para acelerar a descoberta de conteúdos.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-12 justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                    onClick={() => navigate('/approvals')}
                  >
                    Abrir fila de validações
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 justify-between rounded-2xl border-border/70 bg-background text-foreground hover:bg-accent"
                    onClick={() => navigate('/indicators')}
                  >
                    Ir para estatísticas
                    <Command className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <Card className="mt-6 rounded-[28px] border border-rose-500/25 bg-transparent text-rose-700 dark:text-rose-200">
              <CardContent className="p-4 text-sm">{error}</CardContent>
            </Card>
          ) : null}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.label}
                  className={`group rounded-[28px] ${item.borderTone} bg-transparent shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-md`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                        <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                          {isLoading ? '...' : item.value}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.helper}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconTone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-[32px] border border-border/70 bg-transparent shadow-sm">
                <CardHeader className="border-b border-border/60 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-200">
                          <ListTodo className="mr-1.5 h-3.5 w-3.5" />
                          Prioridade do gestor
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl text-foreground">Pendentes que exigem sua ação</CardTitle>
                      <CardDescription className="mt-2 max-w-2xl text-muted-foreground">
                        Relatórios aguardando sua análise, com visibilidade imediata de origem, momento de envio e destino após aprovação.
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="hidden rounded-2xl border-border/70 bg-background text-foreground hover:bg-accent sm:flex"
                      onClick={() => navigate('/approvals')}
                    >
                      Analisar fila
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  {pendingReports.length === 0 ? (
                    <div className="rounded-[28px] border border-emerald-500/16 bg-emerald-500/5 p-8 text-center">
                      <ShieldCheck className="mx-auto mb-3 h-11 w-11 text-emerald-600 dark:text-emerald-300" />
                      <p className="text-lg font-semibold text-foreground">Sem pendências no momento</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Sua fila está organizada. Assim que novos relatórios entrarem para validação, eles aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingReports.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="group flex flex-col gap-4 rounded-[26px] border border-border/70 bg-transparent p-5 transition-all duration-300 hover:border-emerald-500/20"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-semibold text-foreground">{item.name}</p>
                                <Badge className="rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-200">
                                  Pendente
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Enviado por <span className="text-foreground">{item.submitter_name}</span> em{' '}
                                <span className="text-foreground">{formatDateTime(item.uploaded_at)}</span>
                              </p>
                              <div className="mt-4 rounded-2xl border border-border/60 bg-transparent px-4 py-3">
                                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                                  <MapPinned className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                                  Caminho de publicação
                                </div>
                                <p className="mt-2 text-sm leading-6 text-foreground">
                                  {item.destination_path.join(' > ')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                                onClick={() => navigate('/approvals')}
                              >
                                Analisar
                              </Button>
                              <Button
                                variant="outline"
                                className="rounded-2xl border-border/70 bg-background text-foreground hover:bg-accent"
                                onClick={() => navigate('/reports')}
                              >
                                Abrir
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Accordion type="multiple" value={openPanels} onValueChange={setOpenPanels} className="space-y-4">
                <WorkspaceSection
                  value="sharedWithMe"
                  isOpen={openPanels.includes('sharedWithMe')}
                  badge="Rede de compartilhamento"
                  title="Relatórios compartilhados comigo"
                  description="Conteúdos enviados para você por outros usuários, mantendo o mesmo modal de detalhe do caminho final para abrir, comentar e compartilhar."
                  count={sharedReports.sharedWithMe.length}
                  searchValue={panelSearch.sharedWithMe}
                  onSearchChange={(value) => setPanelQuery('sharedWithMe', value)}
                  searchPlaceholder="Buscar por relatório, remetente ou caminho final..."
                  suggestions={sharedWithMeSuggestions}
                  emptySuggestionMessage="Nenhuma sugestão encontrada para esta seção com o termo atual."
                  accentClassName="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                  icon={Share2}
                  recentItems={sharedWithMeRecentItems}
                  resultItems={sharedWithMeResultItems}
                  emptyRecentMessage="Nenhum relatório recente foi encontrado nesta seção."
                  emptyResultsMessage="Nenhum relatório compartilhado com você encontrado com o filtro atual."
                >
                  {showLegacyWorkspacePanels && (filteredSharedWithMe.length === 0 ? (
                    <p className="rounded-2xl border border-border/60 bg-transparent p-4 text-sm text-muted-foreground">
                      Nenhum relatório compartilhado com você encontrado com o filtro atual.
                    </p>
                  ) : (
                    filteredSharedWithMe.map((item) => (
                      <div key={`incoming-${item.report_catalog_id}`} className="space-y-3 rounded-[26px] border border-border/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Compartilhado por</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.counterparty_label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Último envio em {formatDateTime(item.shared_at)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-border/70 bg-background text-foreground hover:bg-accent"
                            onClick={() => navigate(item.action_url)}
                          >
                            Ir para o caminho final
                          </Button>
                        </div>
                        <ReportCard
                          report={toReportCardModel(item)}
                          reportPath={[
                            item.company_name ?? '',
                            item.superintendence_name ?? '',
                            item.management_name ?? '',
                            item.project_name ?? '',
                          ].filter(Boolean)}
                          companyId={item.company_id ?? undefined}
                        />
                      </div>
                    ))
                  ))}
                </WorkspaceSection>

                <WorkspaceSection
                  value="sharedByMe"
                  isOpen={openPanels.includes('sharedByMe')}
                  badge="Distribuição executiva"
                  title="Relatórios compartilhados por mim"
                  description="Tudo o que você enviou para outras pessoas, com a mesma visualização detalhada do relatório e preservando a lógica atual de métricas."
                  count={sharedReports.sharedByMe.length}
                  searchValue={panelSearch.sharedByMe}
                  onSearchChange={(value) => setPanelQuery('sharedByMe', value)}
                  searchPlaceholder="Buscar por relatório, destinatário ou caminho final..."
                  suggestions={sharedByMeSuggestions}
                  emptySuggestionMessage="Nenhuma sugestão encontrada para os compartilhamentos enviados."
                  accentClassName="border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
                  icon={ArrowRight}
                  recentItems={sharedByMeRecentItems}
                  resultItems={sharedByMeResultItems}
                  emptyRecentMessage="Nenhum relatório recente foi encontrado nesta seção."
                  emptyResultsMessage="Nenhum relatório compartilhado por você encontrado com o filtro atual."
                >
                  {showLegacyWorkspacePanels && (filteredSharedByMe.length === 0 ? (
                    <p className="rounded-2xl border border-border/60 bg-transparent p-4 text-sm text-muted-foreground">
                      Nenhum relatório compartilhado por você encontrado com o filtro atual.
                    </p>
                  ) : (
                    filteredSharedByMe.map((item) => (
                      <div key={`outgoing-${item.report_catalog_id}`} className="space-y-3 rounded-[26px] border border-border/70 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Compartilhado com</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.counterparty_label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Último envio em {formatDateTime(item.shared_at)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl border-border/70 bg-background text-foreground hover:bg-accent"
                            onClick={() => navigate(item.action_url)}
                          >
                            Ir para o caminho final
                          </Button>
                        </div>
                        <ReportCard
                          report={toReportCardModel(item)}
                          reportPath={[
                            item.company_name ?? '',
                            item.superintendence_name ?? '',
                            item.management_name ?? '',
                            item.project_name ?? '',
                          ].filter(Boolean)}
                          companyId={item.company_id ?? undefined}
                        />
                      </div>
                    ))
                  ))}
                </WorkspaceSection>

                <WorkspaceSection
                  value="likedReports"
                  isOpen={openPanels.includes('likedReports')}
                  badge="Destaques pessoais"
                  title="Relatórios que você curtiu"
                  description="Materiais relevantes para acompanhamento rápido dentro da sua rotina executiva, agora em uma seção expansível com busca própria."
                  count={summary?.likedReports?.length ?? 0}
                  searchValue={panelSearch.likedReports}
                  onSearchChange={(value) => setPanelQuery('likedReports', value)}
                  searchPlaceholder="Buscar por relatório curtido, empresa ou caminho..."
                  suggestions={likedSuggestions}
                  emptySuggestionMessage="Nenhum relatório curtido combina com a busca desta seção."
                  accentClassName="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                  icon={Heart}
                  recentItems={likedRecentItems}
                  resultItems={likedResultItems}
                  emptyRecentMessage="Nenhum relatório curtido recente foi encontrado."
                  emptyResultsMessage="Nenhum relatório curtido encontrado com o filtro atual."
                >
                  {showLegacyWorkspacePanels && (filteredLikedReports.length === 0 ? (
                    <p className="rounded-2xl border border-border/60 bg-transparent p-4 text-sm text-muted-foreground">
                      Nenhum relatório curtido encontrado com o filtro atual.
                    </p>
                  ) : (
                    filteredLikedReports.map((item) => (
                      <button
                        key={item.reportId}
                        onClick={() => navigate('/reports')}
                        className="w-full rounded-[24px] border border-border/70 bg-transparent p-4 text-left transition-all duration-300 hover:border-sky-500/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{item.reportName}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.companyName}</p>
                          </div>
                          <Badge className="rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10 dark:text-sky-200">
                            Curtido
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{formatMetricCount('curtidas', item.likes)}</span>
                          <span>{formatMetricCount('visualizacoes', item.views)}</span>
                          <span>{formatDate(item.reportDate)}</span>
                        </div>
                      </button>
                    ))
                  ))}
                </WorkspaceSection>

                <WorkspaceSection
                  value="charts"
                  isOpen={openPanels.includes('charts')}
                  badge="Produção analítica"
                  title="Gráficos que você criou"
                  description="Visualizações analíticas construídas por você na aba Estatísticas, agora acessíveis em um painel retrátil com busca contextual."
                  count={chartHistory.length}
                  searchValue={panelSearch.charts}
                  onSearchChange={(value) => setPanelQuery('charts', value)}
                  searchPlaceholder="Buscar por gráfico, relatório de origem, empresa ou métricas..."
                  suggestions={chartSuggestions}
                  emptySuggestionMessage="Nenhum gráfico salvo corresponde a esta busca."
                  accentClassName="border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-200"
                  icon={BarChart3}
                  recentItems={chartRecentItems}
                  resultItems={chartResultItems}
                  emptyRecentMessage="Nenhum gráfico recente foi encontrado nesta seção."
                  emptyResultsMessage="Nenhum gráfico encontrado com o filtro atual."
                >
                  {showLegacyWorkspacePanels && (filteredCharts.length === 0 ? (
                    <p className="rounded-2xl border border-border/60 bg-transparent p-4 text-sm text-muted-foreground">
                      Nenhum gráfico encontrado com o filtro atual.
                    </p>
                  ) : (
                    filteredCharts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/indicators?company=${encodeURIComponent(item.companyId)}&chart=${encodeURIComponent(item.id)}`)}
                        className="w-full rounded-[24px] border border-border/70 bg-transparent p-4 text-left transition-all duration-300 hover:border-violet-500/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{item.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.reportName}</p>
                          </div>
                          <Badge className="rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10 dark:text-violet-200">
                            {item.chartType}
                          </Badge>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{item.companyName}</span>
                          <span>{item.metrics.join(' + ')}</span>
                          <span>{formatDateTime(item.updatedAt)}</span>
                        </div>
                      </button>
                    ))
                  ))}
                </WorkspaceSection>
              </Accordion>
            </div>
            <div className="space-y-6">
              <Card className="rounded-[32px] border border-border/70 bg-transparent shadow-sm">
                <CardHeader className="pb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge className="rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-200">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                      Rastro decisório
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground">Histórico das suas decisões</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Aprovações e rejeições recentes para manter visibilidade executiva do seu fluxo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentDecisions.length === 0 ? (
                    <p className="rounded-2xl border border-border/60 bg-transparent p-4 text-sm text-muted-foreground">
                      Nenhuma decisão encontrada para este workspace.
                    </p>
                  ) : (
                    recentDecisions.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[24px] border border-border/70 bg-transparent p-4 transition-all duration-300 hover:border-border"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{item.reportName}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                              {formatDateTime(item.approvedAt)}
                            </p>
                          </div>
                          <Badge
                            className={
                              item.status === 'approved'
                                ? 'rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-200'
                                : 'rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10 dark:text-rose-200'
                            }
                          >
                            {item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </Badge>
                        </div>

                        <div className="mt-4 rounded-2xl border border-border/60 bg-transparent p-3">
                          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            <MapPinned className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                            Destino
                          </div>
                          <p className="mt-2 text-sm leading-6 text-foreground">
                            {item.destinationPath.join(' > ')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border border-border/70 bg-transparent shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Leitura rápida do seu cenário</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Um resumo visual para entender o momento do seu workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-[24px] border border-emerald-500/14 bg-transparent p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200/80">
                      Foco imediato
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground">
                      {summary?.pendingCount
                        ? `Você tem ${summary.pendingCount} item(ns) pendente(s) aguardando decisão. Esse é o bloco mais crítico do momento.`
                        : 'Sua fila está limpa. Você pode usar este momento para revisar favoritos, decisões recentes e análises criadas.'}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-border/70 bg-transparent p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Decisão recente</p>
                      <p className="mt-2 text-sm text-foreground">
                        {summary?.recentDecisions?.[0]?.reportName ?? 'Sem decisões registradas'}
                      </p>
                    </div>
                    <div className="rounded-[22px] border border-border/70 bg-transparent p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Último destaque</p>
                      <p className="mt-2 text-sm text-foreground">
                        {summary?.likedReports?.[0]?.reportName ?? 'Nenhum relatório curtido'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>

      <FloatingAssistant
        currentLevel="companies"
        selectedCompanyId={undefined}
        selectedSupId={undefined}
        selectedMgmtId={undefined}
        selectedProjId={undefined}
        pageContext={chatPageContext}
      />
    </>
  );
};

export default Workspace;





