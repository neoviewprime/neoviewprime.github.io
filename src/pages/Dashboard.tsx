import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { FlowPathCard } from '@/components/dashboard/FlowPathCard';
import { UtdSubmissionDialog, type UtdSubmissionFormValues } from '@/components/dashboard/UtdSubmissionDialog';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { ReportCard } from '@/components/ReportCard';
import { Breadcrumb, BreadcrumbItem } from '@/components/Breadcrumb';
import { CompanyCard } from '@/components/CompanyCard';
import { HierarchyCard } from '@/components/HierarchyCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { toast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/api';
import { isValidExternalUrl } from '@/lib/externalUrl';
import {
  COELBA_AREA_CENTRAL_FLOW_ID,
  COELBA_AREA_CENTRAL_FLOW_LABEL,
  COELBA_COMPANY_ID,
  COELBA_ENTRY_FLOWS,
  COELBA_STRUCTURE_STAGE_LABEL,
  COELBA_UTD_FLOW_ID,
  COELBA_UTD_ATTRIBUTES,
  COELBA_UTD_MANAGEMENT_ID,
  COELBA_UTD_MANAGEMENT_NAME,
  COELBA_UTD_SUPERINTENDENCE_ID,
  COELBA_UTD_SUPERINTENDENCE_NAME,
  getCoelbaUtdAttributeById,
  isCoelbaCompanyId,
  isCoelbaUtdPath,
  isCoelbaUtdSuperintendenceId
} from '@/lib/coelbaUtd';
import { formatMetricCount } from '@/lib/metricLabels';
import { mapearMetricasDaApi } from '@/lib/metricasEngajamento';

import { companies, Company, Superintendence, Management, Project, type ReportMetrics } from '@/data/mockData';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useHierarchyNav } from '@/context/HierarchyNavContext';

type NavigationLevel = 'companies' | 'coelba-entry' | 'superintendences' | 'managements' | 'projects' | 'indicators';
type CoelbaFlowView = typeof COELBA_AREA_CENTRAL_FLOW_ID | typeof COELBA_UTD_FLOW_ID;
const STRUCTURE_SYNC_VERSION = 'mock-structure-sync-2026-03-08';
const CATALOG_CACHE_KEY = 'neoview-dashboard-catalog-cache-v2';

type CatalogHierarchyItem = {
  id: string;
  source_report_id: string;
  report_status: string;
  report_name: string;
  report_description?: string;
  report_date: string | null;
  report_size_label?: string | null;
  report_url?: string | null;
  company_id: string;
  superintendence_id: string;
  management_id: string;
  project_id: string;
  indicator_value?: string;
  indicator_unit?: string;
  indicator_trend?: string;
  indicator_ids?: string[] | string;
  indicator_names?: string[] | string;
  metric_views?: number;
  metric_comments?: number;
  metric_likes?: number;
  metric_shares?: number;
};

const parseArrayField = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const buildCoelbaUtdBranch = (): Superintendence => ({
  id: COELBA_UTD_SUPERINTENDENCE_ID,
  name: COELBA_UTD_SUPERINTENDENCE_NAME,
  managements: [
    {
      id: COELBA_UTD_MANAGEMENT_ID,
      name: COELBA_UTD_MANAGEMENT_NAME,
      projects: COELBA_UTD_ATTRIBUTES.map((attribute) => ({
        id: attribute.id,
        name: attribute.name,
        description: attribute.description,
        indicators: []
      }))
    }
  ]
});

const ensureCoelbaUtdBranch = (baseCompany: Company): Company => {
  if (!isCoelbaCompanyId(baseCompany.id)) return baseCompany;
  if (baseCompany.superintendences.some((item) => isCoelbaUtdSuperintendenceId(item.id))) return baseCompany;

  return {
    ...baseCompany,
    superintendences: [...baseCompany.superintendences, buildCoelbaUtdBranch()]
  };
};

const withRuntimeBranches = (baseCompanies: Company[]): Company[] => baseCompanies.map(ensureCoelbaUtdBranch);

const getCompanyLandingLevel = (company?: Company | null): NavigationLevel =>
  isCoelbaCompanyId(company?.id) ? 'coelba-entry' : 'superintendences';

const getCoelbaFlowView = (value?: string | null): CoelbaFlowView | null => {
  if (value === COELBA_AREA_CENTRAL_FLOW_ID || value === COELBA_UTD_FLOW_ID) {
    return value;
  }

  return null;
};

const mergeCatalogIntoCompanies = (baseCompanies: Company[], items: CatalogHierarchyItem[]): Company[] => {
  const nextCompanies: Company[] = JSON.parse(JSON.stringify(baseCompanies));

  items
    .filter((item) => item.report_status === 'approved')
    .forEach((item) => {
      const company = nextCompanies.find((entry) => entry.id === item.company_id);
      if (!company) return;
      const sup = company.superintendences.find((entry) => entry.id === item.superintendence_id);
      if (!sup) return;
      const mgmt = sup.managements.find((entry) => entry.id === item.management_id);
      if (!mgmt) return;
      const project = mgmt.projects.find((entry) => entry.id === item.project_id);
      if (!project) return;

      const indicatorNames = parseArrayField(item.indicator_names);
      const indicatorIds = parseArrayField(item.indicator_ids);

      indicatorNames.forEach((indicatorName, index) => {
        const indicatorId = indicatorIds[index] || `catalog-${item.id}-${index}`;
        let indicator = project.indicators.find((entry) => entry.id === indicatorId || entry.name === indicatorName);

        if (!indicator) {
          indicator = {
            id: indicatorId,
            name: indicatorName,
            value: item.indicator_value || '0',
            unit: item.indicator_unit || '',
            trend: (item.indicator_trend as 'up' | 'down' | 'stable') || 'stable',
            description: `Indicador sincronizado automaticamente para ${project.name}.`,
            reports: []
          };
          project.indicators.push(indicator);
        }

        const reportId = item.source_report_id || item.id;
        const nextReport = {
          id: reportId,
          name: item.report_name,
          date: item.report_date || new Date().toISOString().slice(0, 10),
          size: item.report_size_label || 'Link externo',
          description: item.report_description || 'Relat\u00F3rio aprovado no cat\u00E1logo',
          url: item.report_url || undefined,
          metrics: mapearMetricasDaApi({
            views: Number(item.metric_views ?? 0),
            comments: Number(item.metric_comments ?? 0),
            likes: Number(item.metric_likes ?? 0),
            shares: Number(item.metric_shares ?? 0)
          })
        };

        const existingIndex = indicator.reports.findIndex((report) => report.id === reportId);
        if (existingIndex >= 0) {
          indicator.reports[existingIndex] = {
            ...indicator.reports[existingIndex],
            ...nextReport,
            metrics: nextReport.metrics
          };
          return;
        }

        indicator.reports.unshift(nextReport);
      });
    });

  return nextCompanies;
};

const stripReportsFromCompanies = (baseCompanies: Company[]): Company[] =>
  withRuntimeBranches(JSON.parse(JSON.stringify(baseCompanies)).map((company: Company) => ({
    ...company,
    superintendences: company.superintendences.map((superintendence) => ({
      ...superintendence,
      managements: superintendence.managements.map((management) => ({
        ...management,
        projects: management.projects.map((project) => ({
          ...project,
          indicators: project.indicators.map((indicator) => ({
            ...indicator,
            reports: []
          }))
        }))
      }))
    }))
  })));

const normalizeReportKey = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const showLegacyIndicatorPanels = false;

const writeCatalogCache = (value: Company[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(value));
};

const applyMetricOverridesToCompanies = (
  baseCompanies: Company[],
  overrides: Record<string, ReportMetrics>
): Company[] => {
  if (Object.keys(overrides).length === 0) return baseCompanies;

  return baseCompanies.map((company) => ({
    ...company,
    superintendences: company.superintendences.map((superintendence) => ({
      ...superintendence,
      managements: superintendence.managements.map((management) => ({
        ...management,
        projects: management.projects.map((project) => ({
          ...project,
          indicators: project.indicators.map((indicator) => ({
            ...indicator,
            reports: indicator.reports.map((report) =>
              overrides[report.id]
                ? {
                    ...report,
                    metrics: overrides[report.id]
                  }
                : report
            )
          }))
        }))
      }))
    }))
  }));
};

const buildProjectDossier = (project: Project) => {
  const reportsMap = new Map<string, Project['indicators'][number]['reports'][number]>();

  project.indicators.forEach((indicator) => {
    indicator.reports.forEach((report) => {
      if (!reportsMap.has(report.id)) {
        reportsMap.set(report.id, report);
      }
    });
  });

  const reports = Array.from(reportsMap.values()).sort((left, right) => right.date.localeCompare(left.date));
  const totals = reports.reduce(
    (acc, report) => ({
      visualizacoes: acc.visualizacoes + (report.metrics?.visualizacoes ?? 0),
      comentarios: acc.comentarios + (report.metrics?.comentarios ?? 0),
      curtidas: acc.curtidas + (report.metrics?.curtidas ?? 0),
      compartilhamentos: acc.compartilhamentos + (report.metrics?.compartilhamentos ?? 0)
    }),
    { visualizacoes: 0, comentarios: 0, curtidas: 0, compartilhamentos: 0 }
  );

  return {
    id: `${project.id}-dossie-relatorios`,
    name: 'Dossi\u00EA de Relat\u00F3rios',
    description: `Todos os relat\u00F3rios consolidados para ${project.name}.`,
    reports,
    totals
  };
};

const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedReportId = searchParams.get('report');
  const highlightedReportName = searchParams.get('reportName');
  const shouldAutoOpenReport = searchParams.get('openReport') === '1';
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set());
  const [catalogCompanies, setCatalogCompanies] = useState<Company[]>(() => stripReportsFromCompanies(companies));
  const [metricOverrides, setMetricOverrides] = useState<Record<string, ReportMetrics>>({});

  const [level, setLevel] = useState<NavigationLevel>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSuperintendence, setSelectedSuperintendence] = useState<Superintendence | null>(null);
  const [selectedManagement, setSelectedManagement] = useState<Management | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isUtdDialogOpen, setIsUtdDialogOpen] = useState(false);
  const [isSubmittingUtdReport, setIsSubmittingUtdReport] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const {
    submitStructuredReport,
    getCurrentUtdDraft,
    saveCurrentUtdDraft,
    clearCurrentUtdDraft
  } = useReports();
  const [utdDraft, setUtdDraft] = useState<UtdSubmissionFormValues | null>(null);
  const [isUtdDraftLoading, setIsUtdDraftLoading] = useState(false);
  const [isUtdDraftHydrated, setIsUtdDraftHydrated] = useState(false);

  // CONTEXTO: seta do Top Bar
  const { showBack, setBackHandler } = useHierarchyNav();

  useEffect(() => {
    const syncStructure = async () => {
      if (!isAuthenticated) return;
      if (localStorage.getItem('neoview_structure_sync_version') === STRUCTURE_SYNC_VERSION) return;

      const token = localStorage.getItem('neoview_token');
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/reports/structure/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ companies }),
        });

        if (response.ok) {
          localStorage.setItem('neoview_structure_sync_version', STRUCTURE_SYNC_VERSION);
        }
      } catch (error) {
        console.error('Erro ao sincronizar estrutura de relat\u00F3rios com o backend', error);
      }
    };

    syncStructure();
  }, [isAuthenticated]);

  useEffect(() => {
    const loadCatalogReports = async () => {
      try {
        const response = await fetch(`${API_URL}/reports/structure/catalog/by-hierarchy?limit=500`);
        if (!response.ok) return;
        const payload = (await response.json()) as { items?: CatalogHierarchyItem[] };
        const merged = applyMetricOverridesToCompanies(
          mergeCatalogIntoCompanies(stripReportsFromCompanies(companies), payload.items ?? []),
          metricOverrides
        );
        setCatalogCompanies(merged);
        writeCatalogCache(merged);
      } catch (error) {
        console.error('Erro ao carregar relat\u00F3rios aprovados do cat\u00E1logo', error);
      }
    };

    loadCatalogReports();
    const intervalId = window.setInterval(loadCatalogReports, 5000);

    return () => window.clearInterval(intervalId);
  }, [metricOverrides]);

  // URL -> estado (ja existia)
  useEffect(() => {
    const companyId = searchParams.get('company');
    const supId = searchParams.get('sup');
    const mgmtId = searchParams.get('mgmt');
    const projId = searchParams.get('proj');
    const view = getCoelbaFlowView(searchParams.get('view'));

    if (!companyId) {
      setSelectedCompany(null);
      setSelectedSuperintendence(null);
      setSelectedManagement(null);
      setSelectedProject(null);
      setLevel('companies');
      return;
    }

    const company = catalogCompanies.find((c) => c.id === companyId);
    if (!company) return;

    setSelectedCompany(company);
    setSelectedSuperintendence(null);
    setSelectedManagement(null);
    setSelectedProject(null);

    if (!supId) {
      if (isCoelbaCompanyId(company.id) && view === COELBA_AREA_CENTRAL_FLOW_ID) {
        setLevel('superintendences');
        return;
      }

      setLevel(getCompanyLandingLevel(company));
      return;
    }

    const sup = company.superintendences.find((s) => s.id === supId);
    if (!sup) return;

    setSelectedSuperintendence(sup);

    if (!mgmtId) {
      if (isCoelbaUtdSuperintendenceId(sup.id)) {
        const defaultManagement = sup.managements.find((item) => item.id === COELBA_UTD_MANAGEMENT_ID) ?? sup.managements[0] ?? null;
        setSelectedManagement(defaultManagement);
        setLevel(defaultManagement ? 'projects' : 'managements');
        return;
      }

      setLevel('managements');
      return;
    }

    const mgmt = sup.managements.find((m) => m.id === mgmtId);
    if (!mgmt) return;

    setSelectedManagement(mgmt);

    if (!projId) {
      setLevel('projects');
      return;
    }

    const proj = mgmt.projects.find((p) => p.id === projId);
    if (!proj) return;

    setSelectedProject(proj);
    setLevel('indicators');
  }, [searchParams, catalogCompanies]);

  const updateHierarchyQuery = (ids: {
    companyId?: string | null;
    view?: CoelbaFlowView | null;
    supId?: string | null;
    mgmtId?: string | null;
    projId?: string | null;
  }) => {
    const next = new URLSearchParams();
    if (ids.companyId) next.set('company', ids.companyId);
    if (ids.view) next.set('view', ids.view);
    if (ids.supId) next.set('sup', ids.supId);
    if (ids.mgmtId) next.set('mgmt', ids.mgmtId);
    if (ids.projId) next.set('proj', ids.projId);
    setSearchParams(next);
  };

  const resetToLevel = (targetLevel: NavigationLevel) => {
    switch (targetLevel) {
      case 'companies':
        setSelectedCompany(null);
        setSelectedSuperintendence(null);
        setSelectedManagement(null);
        setSelectedProject(null);
        setLevel('companies');
        updateHierarchyQuery({});
        break;
      case 'coelba-entry':
        setSelectedSuperintendence(null);
        setSelectedManagement(null);
        setSelectedProject(null);
        setLevel('coelba-entry');
        updateHierarchyQuery({ companyId: selectedCompany?.id ?? null });
        break;
      case 'superintendences':
        setSelectedSuperintendence(null);
        setSelectedManagement(null);
        setSelectedProject(null);
        setLevel('superintendences');
        updateHierarchyQuery({
          companyId: selectedCompany?.id ?? null,
          view: isCoelbaCompanyId(selectedCompany?.id) ? COELBA_AREA_CENTRAL_FLOW_ID : null
        });
        break;
      case 'managements':
        setSelectedManagement(null);
        setSelectedProject(null);
        setLevel('managements');
        updateHierarchyQuery({
          companyId: selectedCompany?.id ?? null,
          view: isCoelbaCompanyId(selectedCompany?.id) ? COELBA_AREA_CENTRAL_FLOW_ID : null,
          supId: selectedSuperintendence?.id ?? null
        });
        break;
      case 'projects':
        setSelectedProject(null);
        setLevel('projects');
        updateHierarchyQuery({
          companyId: selectedCompany?.id ?? null,
          view: isUtdFlow ? COELBA_UTD_FLOW_ID : isCoelbaCompanyId(selectedCompany?.id) ? COELBA_AREA_CENTRAL_FLOW_ID : null,
          supId: selectedSuperintendence?.id ?? null,
          mgmtId: selectedManagement?.id ?? null
        });
        break;
    }
  };

  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    const coelbaFlowView = getCoelbaFlowView(searchParams.get('view'));
    const showAreaCentralCrumb =
      isCoelbaCompanyId(selectedCompany?.id) &&
      (coelbaFlowView === COELBA_AREA_CENTRAL_FLOW_ID ||
        (!isUtdFlow && ['superintendences', 'managements', 'projects', 'indicators'].includes(level)));
    const showUtdCrumb =
      isCoelbaCompanyId(selectedCompany?.id) &&
      (coelbaFlowView === COELBA_UTD_FLOW_ID || isUtdFlow);

    if (selectedCompany) {
      items.push({
        label: selectedCompany.name,
        onClick: () => resetToLevel(getCompanyLandingLevel(selectedCompany)),
      });
    }

    if (isCoelbaCompanyId(selectedCompany?.id)) {
      items.push({
        label: COELBA_STRUCTURE_STAGE_LABEL,
        onClick: () => resetToLevel('coelba-entry'),
      });
    }

    if (showAreaCentralCrumb) {
      items.push({
        label: COELBA_AREA_CENTRAL_FLOW_LABEL,
        onClick: () => resetToLevel('superintendences'),
      });
    }

    if (showUtdCrumb) {
      items.push({
        label: "UTD's",
        onClick: () => handleEnterCoelbaUtdFlow(),
      });
    }

    if (selectedSuperintendence && !isUtdFlow) {
      items.push({
        label: selectedSuperintendence.name,
        onClick: () =>
          isCoelbaUtdPath({
            companyId: selectedCompany?.id,
            superintendenceId: selectedSuperintendence.id,
            managementId: selectedManagement?.id
          })
            ? resetToLevel('projects')
            : resetToLevel('managements'),
      });
    }

    if (selectedManagement) {
      items.push({
        label: selectedManagement.name,
        onClick: () => resetToLevel('projects'),
      });
    }

    if (selectedProject) {
      items.push({ label: selectedProject.name });
    }

    return items;
  };

  const toggleIndicatorExpanded = (indicatorId: string) => {
    setExpandedIndicators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(indicatorId)) newSet.delete(indicatorId);
      else newSet.add(indicatorId);
      return newSet;
    });
  };

  const isHighlightedReport = (report: Project['indicators'][number]['reports'][number]) =>
    (highlightedReportId ? report.id === highlightedReportId : false) ||
    (highlightedReportName
      ? normalizeReportKey(report.name) === normalizeReportKey(highlightedReportName)
      : false);

  useEffect(() => {
    if (!selectedProject || (!highlightedReportId && !highlightedReportName) || level !== 'indicators') return;

    const dossier = buildProjectDossier(selectedProject);
    const hasHighlightedReport = dossier.reports.some((report) => isHighlightedReport(report));
    if (!hasHighlightedReport) return;

    setExpandedIndicators((current) => {
      if (current.has(dossier.id)) return current;
      const next = new Set(current);
      next.add(dossier.id);
      return next;
    });
  }, [highlightedReportId, highlightedReportName, level, selectedProject]);

  const isUtdFlow =
    selectedCompany?.id === COELBA_COMPANY_ID &&
    selectedSuperintendence?.id === COELBA_UTD_SUPERINTENDENCE_ID &&
    selectedManagement?.id === COELBA_UTD_MANAGEMENT_ID;
  const utdDraftStorageKey = isUtdFlow && selectedProject?.id && user?.id
    ? `neoview-utd-draft:${user.id}:${selectedProject.id}`
    : undefined;

  useEffect(() => {
    if (!utdDraftStorageKey || !selectedProject?.id || !user?.id) {
      setUtdDraft(null);
      setIsUtdDraftLoading(false);
      setIsUtdDraftHydrated(false);
      return;
    }

    let cancelled = false;
    setIsUtdDraftLoading(true);
    setIsUtdDraftHydrated(false);

    void getCurrentUtdDraft(selectedProject.id)
      .then((draft) => {
        if (cancelled) return;
        setUtdDraft(
          draft
            ? {
                reportName: draft.reportName,
                reportDescription: draft.reportDescription,
                reportUrl: draft.reportUrl,
                reportDate: draft.reportDate,
                indicatorsText: draft.indicatorsText,
              }
            : null
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsUtdDraftLoading(false);
        setIsUtdDraftHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [getCurrentUtdDraft, selectedProject?.id, utdDraftStorageKey, user?.id]);

  useEffect(() => {
    if (!isUtdDraftHydrated || !utdDraftStorageKey || !selectedProject?.id || !selectedManagement || !selectedSuperintendence || !selectedCompany) {
      return;
    }

    const hasDraft =
      utdDraft &&
      Object.values(utdDraft).some((value) => value.trim().length > 0);

    const timeoutId = window.setTimeout(() => {
      if (!selectedProject?.id) return;
      if (!hasDraft) {
        void clearCurrentUtdDraft(selectedProject.id);
        return;
      }

      void saveCurrentUtdDraft({
        companyId: selectedCompany.id,
        superintendenceId: selectedSuperintendence.id,
        managementId: selectedManagement.id,
        projectId: selectedProject.id,
        reportName: utdDraft.reportName,
        reportDescription: utdDraft.reportDescription,
        reportUrl: utdDraft.reportUrl,
        reportDate: utdDraft.reportDate,
        indicatorsText: utdDraft.indicatorsText,
      });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [
    clearCurrentUtdDraft,
    isUtdDraftHydrated,
    saveCurrentUtdDraft,
    selectedCompany,
    selectedManagement,
    selectedProject,
    selectedSuperintendence,
    utdDraft,
    utdDraftStorageKey,
  ]);

  const visibleSuperintendences = selectedCompany
    ? selectedCompany.superintendences.filter((sup) => !isCoelbaUtdSuperintendenceId(sup.id))
    : [];

  const handleOpenCompany = (company: Company) => {
    setSelectedCompany(company);
    setSelectedSuperintendence(null);
    setSelectedManagement(null);
    setSelectedProject(null);
    setLevel(getCompanyLandingLevel(company));
    updateHierarchyQuery({
      companyId: company.id,
      view: isCoelbaCompanyId(company.id) ? null : undefined
    });
  };

  const handleEnterCoelbaStandardFlow = () => {
    setSelectedSuperintendence(null);
    setSelectedManagement(null);
    setSelectedProject(null);
    setLevel('superintendences');
    updateHierarchyQuery({ companyId: COELBA_COMPANY_ID, view: COELBA_AREA_CENTRAL_FLOW_ID });
  };

  const handleEnterCoelbaUtdFlow = () => {
    const company = selectedCompany ?? catalogCompanies.find((entry) => entry.id === COELBA_COMPANY_ID) ?? null;
    const sup = company?.superintendences.find((entry) => entry.id === COELBA_UTD_SUPERINTENDENCE_ID) ?? null;
    const management = sup?.managements.find((entry) => entry.id === COELBA_UTD_MANAGEMENT_ID) ?? sup?.managements[0] ?? null;

    if (!company || !sup || !management) return;

    setSelectedCompany(company);
    setSelectedSuperintendence(sup);
    setSelectedManagement(management);
    setSelectedProject(null);
    setLevel('projects');
    updateHierarchyQuery({
      companyId: company.id,
      view: COELBA_UTD_FLOW_ID,
      supId: sup.id,
      mgmtId: management.id
    });
  };

  const handleSubmitUtdReport = async (values: UtdSubmissionFormValues) => {
    if (!selectedCompany || !selectedSuperintendence || !selectedManagement || !selectedProject) return;

    const indicators = values.indicatorsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    if (!values.reportName.trim() || indicators.length === 0) {
      toast({
        title: 'Campos obrigat\u00F3rios',
        description: 'Informe o nome do relat\u00F3rio e ao menos um indicador.',
        variant: 'destructive'
      });
      return;
    }

    if (!values.reportDate) {
      toast({
        title: 'Data obrigat\u00F3ria',
        description: 'Informe a data de submiss\u00E3o do relat\u00F3rio.',
        variant: 'destructive'
      });
      return;
    }

    if (!isValidExternalUrl(values.reportUrl)) {
      toast({
        title: 'Link inv\u00E1lido',
        description: 'Informe um link externo válido para continuar.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingUtdReport(true);

    try {
      const created = await submitStructuredReport({
        assetType: 'hyperlink',
        reportName: values.reportName.trim(),
        reportDescription:
          values.reportDescription.trim() || `Relat\u00F3rio UTD de ${selectedProject.name} na Neoenergia Coelba.`,
        reportDate: values.reportDate,
        reportSizeLabel: 'Link externo',
        reportUrl: values.reportUrl.trim(),
        companyId: selectedCompany.id,
        companyName: selectedCompany.name,
        superintendenceId: selectedSuperintendence.id,
        superintendenceName: selectedSuperintendence.name,
        managementId: selectedManagement.id,
        managementName: selectedManagement.name,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        submittedByName: user?.full_name,
        submittedByEmail: user?.email,
        indicators
      });

      if (!created) {
        toast({
          title: 'Falha no envio',
          description: 'N\u00E3o foi poss\u00EDvel cadastrar o relat\u00F3rio nesse fluxo.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Relat\u00F3rio cadastrado',
        description: created.approver
          ? 'O relat\u00F3rio foi enviado e entrou no fluxo de aprova\u00E7\u00E3o para an\u00E1lise.'
          : 'O relat\u00F3rio foi salvo no fluxo UTD com sucesso.'
      });
      setUtdDraft(null);
      if (utdDraftStorageKey && typeof window !== 'undefined') {
        window.localStorage.removeItem(utdDraftStorageKey);
      }
      void clearCurrentUtdDraft(selectedProject.id);
      setIsUtdDialogOpen(false);
    } finally {
      setIsSubmittingUtdReport(false);
    }
  };

  const handleReportMetricsChange = (reportId: string, metrics: ReportMetrics) => {
    setMetricOverrides((current) => ({
      ...current,
      [reportId]: metrics
    }));

    const updateProjectReports = (project: Project | null): Project | null => {
      if (!project) return project;

      return {
        ...project,
        indicators: project.indicators.map((indicator) => ({
          ...indicator,
          reports: indicator.reports.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  metrics
                }
              : report
          )
        }))
      };
    };

    const applyToCompanies = (currentCompanies: Company[]) =>
      currentCompanies.map((company) => ({
        ...company,
        superintendences: company.superintendences.map((superintendence) => ({
          ...superintendence,
          managements: superintendence.managements.map((management) => ({
            ...management,
            projects: management.projects.map((project) => ({
              ...project,
              indicators: project.indicators.map((indicator) => ({
                ...indicator,
                reports: indicator.reports.map((report) =>
                  report.id === reportId
                    ? {
                        ...report,
                        metrics
                      }
                    : report
                )
              }))
            }))
          }))
        }))
      }));

    setCatalogCompanies((current) => {
      const next = applyToCompanies(current);
      writeCatalogCache(next);
      return next;
    });
    setSelectedProject((current) => updateProjectReports(current));
  };

  /** Registrar o voltar um nivel para a seta do Top Bar. */
  useEffect(() => {
    // pode voltar sempre que nao estiver no topo (companies)
    const canGoBack = level !== 'companies';
    showBack(canGoBack);

    const goBackOne = () => {
      switch (level) {
        case 'coelba-entry':
          resetToLevel('companies');
          break;
        case 'superintendences':
          resetToLevel(isCoelbaCompanyId(selectedCompany?.id) ? 'coelba-entry' : 'companies');
          break;
        case 'managements':
          resetToLevel('superintendences');
          break;
        case 'projects':
          resetToLevel(isUtdFlow ? 'coelba-entry' : 'managements');
          break;
        case 'indicators':
          resetToLevel('projects');
          break;
      }
    };

    setBackHandler(canGoBack ? goBackOne : null);

    // cleanup ao desmontar ou mudar de tela
    return () => {
      showBack(false);
      setBackHandler(null);
    };
  }, [isUtdFlow, level, selectedCompany?.id, showBack, setBackHandler]);

  return (
    <>
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumb */}
        {level !== 'companies' && (
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: 'Empresas', onClick: () => resetToLevel('companies') },
                ...buildBreadcrumbs(),
              ]}
            />
          </div>
        )}

        {/* Titulo */}
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-8">
          {level === 'companies' && 'Selecione uma Empresa'}
          {level === 'coelba-entry' && `${selectedCompany?.name} - Escolha o fluxo`}
          {level === 'superintendences' && `${selectedCompany?.name} - ${isCoelbaCompanyId(selectedCompany?.id) ? COELBA_AREA_CENTRAL_FLOW_LABEL : 'Superintendencias'}`}
          {level === 'managements' && `${selectedSuperintendence?.name} - Gerencias`}
          {level === 'projects' && (isUtdFlow ? COELBA_UTD_MANAGEMENT_NAME : `${selectedManagement?.name} - Projetos`)}
          {level === 'indicators' && (isUtdFlow ? `${selectedProject?.name}` : `${selectedProject?.name} - Indicadores`)}
        </h1>

        {/* Grids conforme o nivel */}
        {level === 'companies' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                name={company.name}
                fullName={company.fullName}
                onClick={() => handleOpenCompany(company)}
              />
            ))}
          </div>
        )}

        {level === 'coelba-entry' && selectedCompany && (
          <div className="grid gap-6 lg:grid-cols-2">
            {COELBA_ENTRY_FLOWS.map((flow) => (
              <FlowPathCard
                key={flow.id}
                title={flow.title}
                description={flow.description}
                onEnter={flow.id === 'utds' ? handleEnterCoelbaUtdFlow : handleEnterCoelbaStandardFlow}
              />
            ))}
          </div>
        )}

        {level === 'superintendences' && selectedCompany && (
          <div className="grid md:grid-cols-2 gap-6">
            {visibleSuperintendences.map((sup) => (
              <HierarchyCard
                key={sup.id}
                type="superintendence"
                name={sup.name}
                count={sup.managements.length}
                onClick={() => {
                  setSelectedSuperintendence(sup);
                  setLevel('managements');
                  updateHierarchyQuery({
                    companyId: selectedCompany?.id ?? null,
                    view: COELBA_AREA_CENTRAL_FLOW_ID,
                    supId: sup.id
                  });
                }}
              />
            ))}
          </div>
        )}

        {level === 'managements' && selectedSuperintendence && (
          <div className="grid md:grid-cols-2 gap-6">
            {selectedSuperintendence.managements.map((mgmt) => (
              <HierarchyCard
                key={mgmt.id}
                type="management"
                name={mgmt.name}
                count={mgmt.projects.length}
                onClick={() => {
                  setSelectedManagement(mgmt);
                  setLevel('projects');
                  updateHierarchyQuery({
                    companyId: selectedCompany?.id ?? null,
                    view: COELBA_AREA_CENTRAL_FLOW_ID,
                    supId: selectedSuperintendence?.id ?? null,
                    mgmtId: mgmt.id
                  });
                }}
              />
            ))}
          </div>
        )}

        {level === 'projects' && selectedManagement && (
          isUtdFlow ? (
            <div className="space-y-6">
              <p className="max-w-3xl text-sm text-muted-foreground">
                Escolha o atributo que deseja acompanhar. Cada página concentra relatórios, indicadores e submissões no fluxo UTD da Coelba.
              </p>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {selectedManagement.projects.map((proj) => (
                  <FlowPathCard
                    key={proj.id}
                    title={proj.name}
                    description={proj.description}
                    onEnter={() => {
                      setSelectedProject(proj);
                      setLevel('indicators');
                      updateHierarchyQuery({
                        companyId: selectedCompany?.id ?? null,
                        view: COELBA_UTD_FLOW_ID,
                        supId: selectedSuperintendence?.id ?? null,
                        mgmtId: selectedManagement?.id ?? null,
                        projId: proj.id
                      });
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {selectedManagement.projects.map((proj) => (
                <HierarchyCard
                  key={proj.id}
                  type="project"
                  name={proj.name}
                  description={proj.description}
                  count={proj.indicators.length}
                  onClick={() => {
                    setSelectedProject(proj);
                    setLevel('indicators');
                    updateHierarchyQuery({
                      companyId: selectedCompany?.id ?? null,
                      view: COELBA_AREA_CENTRAL_FLOW_ID,
                      supId: selectedSuperintendence?.id ?? null,
                      mgmtId: selectedManagement?.id ?? null,
                      projId: proj.id
                    });
                  }}
                />
              ))}
            </div>
          )
        )}

        {level === 'indicators' && selectedProject && (() => {
          const dossier = buildProjectDossier(selectedProject);

          return (
            <div className="space-y-6">
              {isUtdFlow ? (
                <>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-foreground">{selectedProject.name}</h2>
                      <p className="max-w-3xl text-sm text-muted-foreground">
                        {getCoelbaUtdAttributeById(selectedProject.id)?.description ?? selectedProject.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
                        <span className="text-primary font-semibold">
                          {formatMetricCount('visualizacoes', dossier.totals.visualizacoes)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatMetricCount('comentarios', dossier.totals.comentarios)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatMetricCount('curtidas', dossier.totals.curtidas)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatMetricCount('compartilhamentos', dossier.totals.compartilhamentos)}
                        </span>
                      </div>
                    </div>

                    <Button onClick={() => setIsUtdDialogOpen(true)} className="min-w-44">
                      <Plus className="h-4 w-4" />
                      Novo relatorio
                    </Button>
                  </div>

                  {dossier.reports.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                      <h3 className="text-lg font-semibold text-foreground">Nenhum relatorio cadastrado ainda</h3>
                      <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
                        Cadastre o primeiro relatorio deste atributo para que ele fique disponivel com metricas, busca e apoio do chatbot.
                      </p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dossier.reports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          onMetricsChange={handleReportMetricsChange}
                          reportPath={[
                            selectedCompany?.name ?? '',
                            selectedSuperintendence?.name ?? '',
                            selectedManagement?.name ?? '',
                            selectedProject?.name ?? ''
                          ].filter(Boolean)}
                          companyId={selectedCompany?.id}
                          autoOpen={shouldAutoOpenReport && isHighlightedReport(report)}
                          highlighted={isHighlightedReport(report)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div
                    className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-card-hover transition-all"
                    onClick={() => toggleIndicatorExpanded(dossier.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{dossier.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{dossier.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <span className="text-primary font-semibold">
                            {formatMetricCount('visualizacoes', dossier.totals.visualizacoes)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatMetricCount('comentarios', dossier.totals.comentarios)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatMetricCount('curtidas', dossier.totals.curtidas)}
                          </span>
                          <span className="text-muted-foreground">
                            {formatMetricCount('compartilhamentos', dossier.totals.compartilhamentos)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {dossier.reports.length} relatorios
                        </span>
                        {expandedIndicators.has(dossier.id) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedIndicators.has(dossier.id) && (
                    <div className="pl-6 animate-fade-in">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dossier.reports.map((report) => (
                          <ReportCard
                            key={report.id}
                            report={report}
                            onMetricsChange={handleReportMetricsChange}
                            reportPath={[
                              selectedCompany?.name ?? '',
                              selectedSuperintendence?.name ?? '',
                              selectedManagement?.name ?? '',
                              selectedProject?.name ?? ''
                            ].filter(Boolean)}
                            companyId={selectedCompany?.id}
                            autoOpen={shouldAutoOpenReport && isHighlightedReport(report)}
                            highlighted={isHighlightedReport(report)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Legacy indicator panel intentionally disabled during workspace refactor.
          
            {selectedProject.indicators.map((indicator) => (
              <div key={indicator.id} className="space-y-4">
                <div
                  className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-card-hover transition-all"
                  onClick={() => toggleIndicatorExpanded(indicator.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{indicator.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{indicator.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-2xl font-bold text-primary">
                          {indicator.value} {indicator.unit}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            indicator.trend === 'up'
                              ? 'text-green-500'
                              : indicator.trend === 'down'
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {indicator.trend === 'up'
                            ? '\u25B2 Subindo'
                            : indicator.trend === 'down'
                            ? '\u25BC Descendo'
                            : '\u2022 Est\u00E1vel'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {indicator.reports.length} relat\u00F3rios
                      </span>
                      {expandedIndicators.has(indicator.id) ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedIndicators.has(indicator.id) && (
                  <div className="pl-6 animate-fade-in">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {indicator.reports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          autoOpen={shouldAutoOpenReport && isHighlightedReport(report)}
                          highlighted={isHighlightedReport(report)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        */}
      </div>

      <UtdSubmissionDialog
        open={isUtdDialogOpen}
        onOpenChange={setIsUtdDialogOpen}
        attributeName={selectedProject?.name ?? 'Atributo'}
        isSubmitting={isSubmittingUtdReport}
        isDraftLoading={isUtdDraftLoading}
        onSubmit={handleSubmitUtdReport}
        draftStorageKey={utdDraftStorageKey}
        initialDraft={utdDraft}
        onDraftChange={setUtdDraft}
        onDraftClear={() => setUtdDraft(null)}
      />

      <FloatingAssistant
        currentLevel={level === 'coelba-entry' ? 'superintendences' : level}
        selectedCompanyId={selectedCompany?.id}
        selectedSupId={selectedSuperintendence?.id}
        selectedMgmtId={selectedManagement?.id}
        selectedProjId={selectedProject?.id}
      />
    </>
  );
};

export default Dashboard;
