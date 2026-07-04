import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Link as LinkIcon, Search, Upload, Filter, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReports, type ReportsListItem } from '@/hooks/useReports';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/use-toast';
import type { ChatPageContext, ReportStatus } from '@/types/backend';
import { companies } from '@/data/mockData';
import { COELBA_CORPORATE_SUPERINTENDENCE_NAME, isCoelbaCorporateSuperintendenceId } from '@/lib/coelbaUtd';
import { isValidExternalUrl, shouldWarnInsecureExternalUrl } from '@/lib/externalUrl';
import { useSearchParams } from 'react-router-dom';

const DRAFT_STORAGE_KEY = 'neoview-report-upload-draft';
const VALIDATION_SECONDS = 10;

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  pending_approval: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
  archived: { label: 'Arquivado', color: 'bg-muted text-muted-foreground', icon: FileText }
};

type ReportUploadForm = {
  draftId: string;
  assetType: 'hyperlink';
  reportName: string;
  reportDescription: string;
  reportUrl: string;
  reportDate: string;
  companyId: string;
  superintendenceId: string;
  managementId: string;
  projectId: string;
  indicatorsText: string;
  updatedAt: string;
};

const createEmptyForm = (): ReportUploadForm => ({
  draftId: `draft-${Date.now()}`,
  assetType: 'hyperlink',
  reportName: '',
  reportDescription: '',
  reportUrl: '',
  reportDate: '',
  companyId: '',
  superintendenceId: '',
  managementId: '',
  projectId: '',
  indicatorsText: '',
  updatedAt: new Date().toISOString()
});

const hasMeaningfulDraft = (form: ReportUploadForm): boolean =>
  [
    form.reportName,
    form.reportDescription,
    form.reportUrl,
    form.reportDate,
    form.companyId,
    form.superintendenceId,
    form.managementId,
    form.projectId,
    form.indicatorsText
  ].some((value) => value.trim().length > 0);

const buildDraftStorageKey = (userId?: string) => (userId ? `${DRAFT_STORAGE_KEY}:${userId}` : DRAFT_STORAGE_KEY);

const readStoredDraft = (storageKey: string): ReportUploadForm => {
  if (typeof window === 'undefined') return createEmptyForm();
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return createEmptyForm();
  try {
    return { ...createEmptyForm(), ...(JSON.parse(raw) as Partial<ReportUploadForm>) };
  } catch {
    return createEmptyForm();
  }
};

const toDraftReportRow = (form: ReportUploadForm, hierarchyName: string): ReportsListItem | null => {
  if (!hasMeaningfulDraft(form)) return null;

  return {
    id: form.draftId,
    source_report_id: form.draftId,
    indicator_id: 'draft',
    name: form.reportName || 'Rascunho sem título',
    description: form.reportDescription || hierarchyName || 'Rascunho local aguardando edição',
    file_url: form.reportUrl,
    file_path: hierarchyName || form.reportUrl,
    file_size: 0,
    mime_type: 'application/link',
    status: 'draft',
    uploaded_by: 'usr-current',
    uploaded_at: form.updatedAt,
    version: 1,
    created_at: form.updatedAt,
    updated_at: form.updatedAt,
    metrics: { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 }
  };
};

const Reports: React.FC = () => {
  const { user, roles } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const draftStorageKey = useMemo(() => buildDraftStorageKey(user?.id), [user?.id]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ReportStatus | 'all'>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [form, setForm] = useState<ReportUploadForm>(() => readStoredDraft(draftStorageKey));
  const [validationCountdown, setValidationCountdown] = useState<number | null>(null);
  const validationTimeoutRef = useRef<number | null>(null);
  const validationIntervalRef = useRef<number | null>(null);
  const focusRowRef = useRef<HTMLTableRowElement | null>(null);

  const {
    reports,
    isLoading,
    error,
    fetchReports,
    submitStructuredReport,
    trackReportView,
    toggleReportLike,
    addReportComment,
    shareReportWithRecipients,
    deleteReport
  } = useReports();

  const canDeleteReports =
    roles.includes('superadmin') ||
    ['Gestor', 'Gerente', 'Superintendente', 'Diretor'].includes(user?.job_title ?? '');

  const selectedCompany = companies.find((c) => c.id === form.companyId);
  const selectedSuperintendence = selectedCompany?.superintendences.find((s) => s.id === form.superintendenceId);
  const isCorporateSuperintendence = isCoelbaCorporateSuperintendenceId(selectedSuperintendence?.id);
  const selectedManagement = selectedSuperintendence?.managements.find((m) => m.id === form.managementId);
  const availableProjects = selectedManagement?.projects ?? [];
  const selectedProject = availableProjects.find((p) => p.id === form.projectId);
  const hasTypedUrl = form.reportUrl.trim().length > 0;
  const hasValidUrl = isValidExternalUrl(form.reportUrl);
  const showInsecureUrlWarning = shouldWarnInsecureExternalUrl(form.reportUrl);

  const formatDisplayDate = (rawDate: string, seed: string): string => {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR');
    }

    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
    }
    const year = 2024 + (hash % 3);
    const month = (Math.floor(hash / 5) % 12) + 1;
    const day = (Math.floor(hash / 17) % 28) + 1;
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  };

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setForm(readStoredDraft(draftStorageKey));
  }, [draftStorageKey]);

  useEffect(() => {
    const source = searchParams.get('source');
    const indicator = searchParams.get('indicator');
    const query = searchParams.get('query');
    const nextSearch = source || indicator || query || '';

    if (nextSearch && nextSearch !== searchQuery) {
      setSearchQuery(nextSearch);
      setActiveTab('all');
    }
  }, [searchParams, searchQuery]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasMeaningfulDraft(form)) {
      window.localStorage.setItem(draftStorageKey, JSON.stringify({ ...form, updatedAt: new Date().toISOString() }));
    } else {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, [draftStorageKey, form]);

  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) window.clearTimeout(validationTimeoutRef.current);
      if (validationIntervalRef.current) window.clearInterval(validationIntervalRef.current);
    };
  }, []);

  const hierarchyLabel = [selectedCompany?.name, selectedSuperintendence?.name, selectedManagement?.name, selectedProject?.name]
    .filter(Boolean)
    .join(' > ');

  const localDraftReport = useMemo(() => toDraftReportRow(form, hierarchyLabel), [form, hierarchyLabel]);

  const combinedReports = useMemo(() => {
    const draftRows = localDraftReport ? [localDraftReport] : [];
    return [...draftRows, ...reports.filter((report) => report.id !== localDraftReport?.id)];
  }, [localDraftReport, reports]);

  const filteredReports = useMemo(() => {
    const sourceParam = searchParams.get('source')?.toLowerCase() ?? '';
    const indicatorParam = searchParams.get('indicator')?.toLowerCase() ?? '';

    return combinedReports.filter((r) => {
      const normalizedName = r.name.toLowerCase();
      const normalizedDescription = r.description?.toLowerCase() ?? '';
      const normalizedUrl = r.file_url?.toLowerCase() ?? '';
      const normalizedId = r.id.toLowerCase();
      const normalizedSource = r.source_report_id.toLowerCase();
      const normalizedIndicatorId = r.indicator_id.toLowerCase();

      const matchesSearch =
        normalizedName.includes(searchQuery.toLowerCase()) ||
        normalizedDescription.includes(searchQuery.toLowerCase()) ||
        normalizedUrl.includes(searchQuery.toLowerCase()) ||
        normalizedId.includes(searchQuery.toLowerCase()) ||
        normalizedSource.includes(searchQuery.toLowerCase()) ||
        normalizedIndicatorId.includes(searchQuery.toLowerCase());
      const matchesSource = !sourceParam || normalizedSource === sourceParam || normalizedId === sourceParam;
      const matchesIndicator =
        !indicatorParam ||
        normalizedIndicatorId === indicatorParam ||
        normalizedName.includes(indicatorParam) ||
        normalizedDescription.includes(indicatorParam);

      if (activeTab === 'all') return matchesSearch && matchesSource && matchesIndicator;
      return matchesSearch && matchesSource && matchesIndicator && r.status === activeTab;
    });
  }, [combinedReports, searchQuery, activeTab, searchParams]);

  const stats = {
    total: combinedReports.length,
    pending: combinedReports.filter((r) => r.status === 'pending_approval').length,
    approved: combinedReports.filter((r) => r.status === 'approved').length,
    rejected: combinedReports.filter((r) => r.status === 'rejected').length
  };
  const highlightedSource = searchParams.get('source');
  const highlightedLabel = searchParams.get('label');

  const chatPageContext = useMemo<ChatPageContext>(() => {
    const visibleNames = filteredReports.slice(0, 3).map((report) => report.name);
    const summaryParts = [
      `O usuário está na tela Meus Relatórios com a aba ${activeTab === 'all' ? 'Todos' : activeTab}.`,
      `Existem ${stats.total} relatório(s) no contexto atual, sendo ${stats.pending} pendente(s), ${stats.approved} aprovado(s) e ${stats.rejected} rejeitado(s).`,
      searchQuery ? `Busca digitada: ${searchQuery}.` : 'Não há termo de busca digitado no momento.',
      hierarchyLabel ? `Hierarquia selecionada no formulário de envio: ${hierarchyLabel}.` : 'O formulário de envio ainda não tem hierarquia completa.',
      localDraftReport ? `Existe um rascunho local ativo com nome ${localDraftReport.name}.` : 'Não existe rascunho local ativo.',
      highlightedLabel ? `A tela está filtrada a partir do chatbot para ${highlightedLabel}.` : 'Não há destaque vindo do chatbot neste momento.',
      visibleNames.length ? `Relatórios mais visíveis agora: ${visibleNames.join(', ')}.` : 'Nenhum relatório está visível na grade com os filtros atuais.',
      validationCountdown !== null ? `Existe uma validação em andamento para submissão com ${validationCountdown} segundo(s) restantes.` : ''
    ];

    return {
      page: 'reports',
      title: 'Meus Relatórios',
      summary: summaryParts.filter(Boolean).join(' '),
      hints: [
        'Ajude com envio por link externo, status, filtros, rascunho e metricas.',
        'Se o usuário pedir um resumo da tela, use os números e os relatórios visíveis agora.',
        'Oriente a completar nome, descrição, link, hierarquia e indicadores antes de submeter.'
      ]
    };
  }, [
    activeTab,
    filteredReports,
    hierarchyLabel,
    highlightedLabel,
    localDraftReport,
    searchQuery,
    stats,
    validationCountdown
  ]);

  const patchForm = (partial: Partial<ReportUploadForm>) => {
    setForm((prev) => ({ ...prev, ...partial, updatedAt: new Date().toISOString() }));
  };

  const resetDraft = () => {
    const next = createEmptyForm();
    setForm(next);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(draftStorageKey);
    }
  };

  const cancelValidation = () => {
    if (validationTimeoutRef.current) window.clearTimeout(validationTimeoutRef.current);
    if (validationIntervalRef.current) window.clearInterval(validationIntervalRef.current);
    validationTimeoutRef.current = null;
    validationIntervalRef.current = null;
    setValidationCountdown(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      cancelValidation();
      if (hasMeaningfulDraft(form)) {
        toast({
          title: 'Rascunho mantido',
          description: 'O relatório permanece em rascunho até você voltar e editar ou submeter.'
        });
      }
    }
    setIsUploadOpen(open);
  };

  useEffect(() => {
    if (!focusRowRef.current) return;
    focusRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [filteredReports]);

  const handleSubmitUpload = async () => {
    const indicators = form.indicatorsText
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    if (!form.reportName || !form.reportDescription || indicators.length === 0) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe nome do relatório, descrição resumida e ao menos um indicador.',
        variant: 'destructive'
      });
      return;
    }

    if (!form.reportUrl) {
      toast({
        title: 'Link obrigatório',
        description: 'Informe um link externo valido para o relatório.',
        variant: 'destructive'
      });
      return;
    }

    if (!isValidExternalUrl(form.reportUrl)) {
      toast({
        title: 'Link inválido',
        description: 'Use um link valido com http:// ou https://.',
        variant: 'destructive'
      });
      return;
    }

    if (
      !selectedCompany ||
      !selectedSuperintendence ||
      (!isCorporateSuperintendence && (!selectedManagement || !selectedProject))
    ) {
      toast({
        title: 'Hierarquia obrigatória',
        description: isCorporateSuperintendence
          ? 'Selecione empresa e superintendencia para concluir a submissao.'
          : 'Selecione empresa, superintendencia, gerencia e unidade.',
        variant: 'destructive'
      });
      return;
    }

    cancelValidation();
    setValidationCountdown(VALIDATION_SECONDS);
    validationIntervalRef.current = window.setInterval(() => {
      setValidationCountdown((current) => (current && current > 0 ? current - 1 : 0));
    }, 1000);

    validationTimeoutRef.current = window.setTimeout(async () => {
      cancelValidation();

      const created = await submitStructuredReport({
        assetType: 'hyperlink',
        reportName: form.reportName,
        reportDescription: form.reportDescription,
        reportDate: form.reportDate || new Date().toISOString().slice(0, 10),
        reportUrl: form.reportUrl,
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        superintendenceId: selectedSuperintendence.id,
        superintendenceName: selectedSuperintendence.name,
        managementId: isCorporateSuperintendence ? null : selectedManagement?.id,
        managementName: isCorporateSuperintendence ? null : selectedManagement?.name,
        projectId: isCorporateSuperintendence ? null : selectedProject?.id,
        projectName: isCorporateSuperintendence ? null : selectedProject?.name,
        submittedByName: user?.full_name,
        submittedByEmail: user?.email,
        indicators
      });

      if (!created) {
        toast({
          title: 'Falha no envio',
          description: error ?? 'Não foi possível cadastrar o relatório.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Relatório enviado',
        description: created.approver
          ? `Validação concluída. O relatório entrou como pendente para ${created.approver.name}.`
          : 'Validação concluída. O link foi submetido e o relatório entrou como pendente.'
      });
      setIsUploadOpen(false);
      resetDraft();
      await fetchReports();
    }, VALIDATION_SECONDS * 1000);
  };

  const handleOpenReport = async (report: ReportsListItem) => {
    await trackReportView({
      reportId: report.id,
      sourceReportId: report.source_report_id,
      reportName: report.name
    });

    if (report.file_url) {
      window.open(report.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLikeReport = async (report: ReportsListItem) => {
    await toggleReportLike({
      reportId: report.id,
      sourceReportId: report.source_report_id,
      reportName: report.name
    });
  };

  const handleCommentReport = async (report: ReportsListItem) => {
    const message = window.prompt(`Comentar no relatório "${report.name}"`);
    if (!message?.trim()) return;

    const metrics = await addReportComment({
      reportId: report.id,
      sourceReportId: report.source_report_id,
      reportName: report.name,
      message
    });

    if (metrics) {
      toast({
        title: 'Comentário enviado',
        description: 'A métrica de comentários foi atualizada.'
      });
    }
  };

  const handleShareReport = async (report: ReportsListItem) => {
    const recipient = window.prompt('Compartilhar com quem? Informe o nome do destinatário.');
    if (!recipient?.trim()) return;

    const metrics = await shareReportWithRecipients({
      reportId: report.id,
      sourceReportId: report.source_report_id,
      reportName: report.name,
      recipients: [{ name: recipient.trim() }]
    });

    if (metrics) {
      toast({
        title: 'Relatório compartilhado',
        description: 'A métrica de compartilhamentos foi atualizada.'
      });
    }
  };

  const handleDeleteReport = async (report: ReportsListItem) => {
    const confirmed = window.confirm(`Excluir definitivamente o relatório "${report.name}"?`);
    if (!confirmed) return;

    const deleted = await deleteReport(report.id);
    if (!deleted) {
      toast({
        title: 'Não foi possível excluir',
        description: 'Verifique se você possui permissão para exclusão definitiva.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Relatório excluído',
      description: 'O relatório foi removido definitivamente do frontend e do backend.'
    });
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/70 p-4 shadow-sm sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Meus Relatórios</h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">Envie relatorios por link externo valido e acompanhe o fluxo de rascunho e aprovacao.</p>
          </div>
          <Button className="h-11 gap-2 rounded-2xl" onClick={() => setIsUploadOpen(true)}>
            <Upload className="w-4 h-4" />
            Enviar relatório
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
          <Card className="rounded-3xl"><CardContent className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card className="rounded-3xl"><CardContent className="p-4"><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
          <Card className="rounded-3xl"><CardContent className="p-4"><p className="text-2xl font-bold">{stats.approved}</p><p className="text-xs text-muted-foreground">Aprovados</p></CardContent></Card>
          <Card className="rounded-3xl"><CardContent className="p-4"><p className="text-2xl font-bold">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejeitados</p></CardContent></Card>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar relatórios..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-11 rounded-2xl pl-10" />
          </div>
          <Button variant="outline" className="h-11 gap-2 rounded-2xl"><Filter className="w-4 h-4" />Filtros</Button>
        </div>

        {localDraftReport ? (
          <Card className="mb-6 border-primary/40">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Rascunho local ativo</p>
                <p className="text-sm text-muted-foreground">Se você sair da tela agora, ele continua como rascunho e não sobe status até você editar e submeter.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="rounded-2xl" onClick={() => setIsUploadOpen(true)}>Continuar edição</Button>
                <Button variant="ghost" className="rounded-2xl" onClick={resetDraft}>Descartar rascunho</Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {highlightedLabel ? (
          <Card className="mb-4 border-primary/40 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-foreground">Fonte aberta a partir do chatbot</p>
                <p className="text-sm text-muted-foreground">Filtrando resultados para: {highlightedLabel}</p>
              </div>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => {
                  setSearchParams({});
                  setSearchQuery('');
                }}
              >
                Limpar filtro
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {error && <p className="text-sm text-yellow-700 mb-4">{error}</p>}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus | 'all')} className="space-y-4">
          <TabsList className="mb-0 flex h-auto w-full flex-nowrap gap-2 overflow-x-auto rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="draft">Rascunhos</TabsTrigger>
            <TabsTrigger value="pending_approval">Pendentes</TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className="overflow-hidden rounded-3xl">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">Carregando relatórios...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-8 text-center">Nenhum relatório encontrado</div>
                ) : isMobile ? (
                  <div className="space-y-3 p-3">
                    {filteredReports.map((report) => {
                      const status = statusConfig[report.status];
                      const StatusIcon = status.icon;
                      return (
                        <div key={report.id} className="rounded-[26px] border border-border/70 bg-card p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-1 h-5 w-5 shrink-0 text-red-500" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{report.name}</p>
                                <Badge className={`gap-1 ${status.color}`}><StatusIcon className="h-3 w-3" />{status.label}</Badge>
                              </div>
                              {report.description ? <p className="mt-1 text-xs text-muted-foreground">{report.description}</p> : null}
                              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <span>Data: {formatDisplayDate(report.uploaded_at, `${report.id}-${report.name}`)}</span>
                                <span>Versão: v{report.version}</span>
                                <span>Views: {report.metrics.visualizacoes}</span>
                                <span>Curtidas: {report.metrics.curtidas}</span>
                                <span>Comentários: {report.metrics.comentarios}</span>
                                <span>Shares: {report.metrics.compartilhamentos}</span>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {report.file_url ? (
                                  <Button size="sm" variant="outline" className="rounded-2xl" onClick={() => void handleOpenReport(report)}>
                                    <LinkIcon className="mr-2 h-3.5 w-3.5" />
                                    Abrir
                                  </Button>
                                ) : null}
                                <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => void handleLikeReport(report)} title="Curtir relatório">
                                  <Heart className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => void handleCommentReport(report)} title="Comentar relatório">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="rounded-2xl" onClick={() => void handleShareReport(report)} title="Compartilhar relatório">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                {canDeleteReports ? (
                                  <Button variant="ghost" size="sm" className="rounded-2xl text-destructive" onClick={() => void handleDeleteReport(report)} title="Excluir relatório definitivamente">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Visualizações</TableHead>
                        <TableHead>Comentários</TableHead>
                        <TableHead>Curtidas</TableHead>
                        <TableHead>Compartilhamentos</TableHead>
                        <TableHead>Versão</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => {
                        const status = statusConfig[report.status];
                        const StatusIcon = status.icon;
                        const isHighlighted =
                          Boolean(highlightedSource) &&
                          (report.source_report_id === highlightedSource || report.id === highlightedSource);
                        return (
                          <TableRow
                            key={report.id}
                            ref={isHighlighted ? focusRowRef : null}
                            className={isHighlighted ? 'bg-primary/10 ring-1 ring-primary/30' : undefined}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-red-500" />
                                <div>
                                  <p className="font-medium">{report.name}</p>
                                  {report.description && <p className="text-xs text-muted-foreground">{report.description}</p>}
                                  {report.file_path ? <p className="text-[11px] text-muted-foreground">Caminho: {report.file_path}</p> : null}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><Badge className={`gap-1 ${status.color}`}><StatusIcon className="w-3 h-3" />{status.label}</Badge></TableCell>
                            <TableCell>{formatDisplayDate(report.uploaded_at, `${report.id}-${report.name}`)}</TableCell>
                            <TableCell>
                              {report.file_url ? (
                                <button
                                  type="button"
                                  onClick={() => void handleOpenReport(report)}
                                  className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                                >
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  Abrir
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">Link indisponível</span>
                              )}
                            </TableCell>
                            <TableCell>{report.metrics.visualizacoes}</TableCell>
                            <TableCell>{report.metrics.comentarios}</TableCell>
                            <TableCell>{report.metrics.curtidas}</TableCell>
                            <TableCell>{report.metrics.compartilhamentos}</TableCell>
                            <TableCell>v{report.version}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => void handleLikeReport(report)} title="Curtir relatório">
                                  <Heart className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => void handleCommentReport(report)} title="Comentar relatório">
                                  <MessageCircle className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => void handleShareReport(report)} title="Compartilhar relatório">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                {canDeleteReports ? (
                                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteReport(report)} title="Excluir relatório definitivamente" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isUploadOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subir Relatório</DialogTitle>
            <DialogDescription>Envie por link externo valido. Os indicadores continuam obrigatorios e, apos a submissao, o payload vira JSON e segue para o catalogo/schema do NeoView.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Nome do relatório *</Label>
              <Input value={form.reportName} onChange={(e) => patchForm({ reportName: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Link externo *</Label>
              <Input
                placeholder="https://... ou http://..."
                value={form.reportUrl}
                onChange={(e) => patchForm({ reportUrl: e.target.value })}
                className={showInsecureUrlWarning ? 'border-amber-500 focus-visible:ring-amber-500' : undefined}
              />
              {hasTypedUrl && !hasValidUrl ? (
                <p className="mt-2 text-xs text-destructive">
                  Informe um link externo válido para continuar.
                </p>
              ) : null}
              {showInsecureUrlWarning ? (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Este link não usa HTTPS. O sistema vai permitir o acesso, mas ele pode não ser seguro.</span>
                </div>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <Label>Descrição resumida *</Label>
              <Textarea value={form.reportDescription} onChange={(e) => patchForm({ reportDescription: e.target.value })} />
            </div>
            <div>
              <Label>Data do relatório</Label>
              <Input type="date" value={form.reportDate} onChange={(e) => patchForm({ reportDate: e.target.value })} />
            </div>
            <div>
              <Label>Caminho de destino</Label>
              <Input value={hierarchyLabel} disabled placeholder="Definido pela hierarquia selecionada" />
            </div>
            <div>
              <Label>Empresa *</Label>
              <Select value={form.companyId} onValueChange={(value) => patchForm({ companyId: value, superintendenceId: '', managementId: '', projectId: '' })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Superintendência *</Label>
              <Select value={form.superintendenceId} onValueChange={(value) => patchForm({ superintendenceId: value, managementId: '', projectId: '' })} disabled={!selectedCompany}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(selectedCompany?.superintendences ?? []).map((sup) => <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gerência *</Label>
              <Select
                value={form.managementId}
                onValueChange={(value) => patchForm({ managementId: value, projectId: '' })}
                disabled={!selectedSuperintendence || isCorporateSuperintendence}
              >
                <SelectTrigger><SelectValue placeholder={isCorporateSuperintendence ? 'Nao se aplica' : 'Selecione'} /></SelectTrigger>
                <SelectContent>
                  {(selectedSuperintendence?.managements ?? []).map((mgmt) => <SelectItem key={mgmt.id} value={mgmt.id}>{mgmt.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unidade *</Label>
              <Select
                value={form.projectId}
                onValueChange={(value) => patchForm({ projectId: value })}
                disabled={!selectedManagement || isCorporateSuperintendence}
              >
                <SelectTrigger><SelectValue placeholder={isCorporateSuperintendence ? 'Nao se aplica' : 'Selecione'} /></SelectTrigger>
                <SelectContent>
                  {availableProjects.map((project) => <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isCorporateSuperintendence ? (
              <div className="md:col-span-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                Para {COELBA_CORPORATE_SUPERINTENDENCE_NAME}, os campos de gerencia e unidade ficam desabilitados e a submissao segue apenas com a superintendencia.
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Label>Indicadores (separados por vírgula) *</Label>
              <Input value={form.indicatorsText} onChange={(e) => patchForm({ indicatorsText: e.target.value })} />
            </div>
          </div>

          {validationCountdown !== null ? (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
              Validando link, estrutura e indicadores. Em {validationCountdown}s o relatório será enviado e ficará como pendente.
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>Fechar</Button>
            <Button onClick={handleSubmitUpload} disabled={validationCountdown !== null}>
              {validationCountdown !== null ? `Validando ${validationCountdown}s` : 'Submeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default Reports;

