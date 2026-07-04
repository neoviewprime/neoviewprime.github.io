import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  analyticsCompanies,
  analyticsExamplePresets,
  type AnalyticsChartFilters,
  type AnalyticsExamplePreset
} from "@/hooks/useAnalyticsChart";
import { useAnalyticsChart } from "@/hooks/useAnalyticsChart";
import { ChartPreview } from "@/components/analytics/ChartPreview";
import { ChartSettings } from "@/components/analytics/ChartSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { API_URL as REPORTS_API_URL } from "@/lib/api";
import {
  listStoredAnalyticsWorkspacesByCompany,
  persistStoredAnalyticsWorkspacesToBackend,
  replaceStoredAnalyticsWorkspacesByCompany,
  removeStoredAnalyticsWorkspace,
  syncStoredAnalyticsWorkspacesFromBackend
} from "@/lib/analyticsWorkspace";
import { getClientId } from "@/lib/clientIdentity";
import { cn } from "@/lib/utils";

interface ChartBuilderProps {
  companyId: string | null;
  initialWorkspaceId?: string | null;
}

interface ChartWorkspace {
  id: string;
  title: string;
  reportName: string;
  filters: AnalyticsChartFilters;
}

interface CatalogSuggestion {
  sourceReportId: string;
  reportName: string;
  reportDescription: string;
  reportDate: string | null;
  companyId: string;
  companyName: string;
  superintendenceName: string;
  managementName: string;
  projectName: string;
  indicatorNames: string[];
}

const createWorkspaceId = () => `chart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultFilters = (companyId: string): AnalyticsChartFilters => ({
  companyId,
  metrics: ["views", "likes"],
  period: "month",
  chartType: "bar",
  dataMode: "demo"
});

const filtersFromPreset = (companyId: string, preset?: AnalyticsExamplePreset): AnalyticsChartFilters =>
  preset
    ? {
        companyId,
        ...preset.filters,
        dataMode: "demo"
      }
    : defaultFilters(companyId);

const createWorkspace = (companyId: string, preset?: AnalyticsExamplePreset, index = 1): ChartWorkspace => ({
  id: createWorkspaceId(),
  title: preset?.title ?? `Exemplo gráfico ${index}`,
  reportName: preset?.reportName ?? "Exemplo gráfico",
  filters: filtersFromPreset(companyId, preset)
});

const svgToPng = async (container: HTMLDivElement, fileName: string) => {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("Gráfico não encontrado");

  const rect = container.getBoundingClientRect();
  const width = Math.max(960, Math.floor(rect.width || 960));
  const height = Math.max(540, Math.floor(rect.height || 540));
  const cloned = svg.cloneNode(true) as SVGSVGElement;
  cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  cloned.setAttribute("width", String(width));
  cloned.setAttribute("height", String(height));

  const data = new XMLSerializer().serializeToString(cloned);
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas indisponivel"));
          return;
        }
        const background =
          getComputedStyle(container).backgroundColor || getComputedStyle(document.body).backgroundColor || "#ffffff";
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = fileName;
        link.click();
        resolve();
      };
      image.onerror = () => reject(new Error("Falha ao converter gráfico"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export function ChartBuilder({ companyId, initialWorkspaceId }: ChartBuilderProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const actorKey = user?.id ?? getClientId();
  const presets = useMemo(() => (companyId ? analyticsExamplePresets[companyId] ?? [] : []), [companyId]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CatalogSuggestion[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [workspaces, setWorkspaces] = useState<ChartWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [isWorkspaceListOpen, setIsWorkspaceListOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [isRestoringWorkspaces, setIsRestoringWorkspaces] = useState(false);

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? workspaces[0] ?? null,
    [activeWorkspaceId, workspaces]
  );

  const filteredWorkspaces = useMemo(() => {
    const needle = workspaceSearch.trim().toLowerCase();
    if (!needle) return workspaces;
    return workspaces.filter((workspace) =>
      `${workspace.title} ${workspace.reportName} ${workspace.filters.chartType} ${workspace.filters.metrics.join(" ")}`
        .toLowerCase()
        .includes(needle)
    );
  }, [workspaceSearch, workspaces]);

  const { data, pieData, isLoading, error, fetchAnalytics } = useAnalyticsChart(
    activeWorkspace?.filters ?? {
      companyId: "",
      metrics: ["views"],
      period: "month",
      chartType: "bar",
      dataMode: "company"
    }
  );

  const companyName = useMemo(
    () => analyticsCompanies.find((company) => company.id === companyId)?.name ?? null,
    [companyId]
  );

  useEffect(() => {
    let cancelled = false;

    const restoreWorkspaces = async () => {
      if (!companyId) {
        setSearchQuery("");
        setIsSearchOpen(false);
        setSuggestions([]);
        setWorkspaces([]);
        setActiveWorkspaceId(null);
        setIsRestoringWorkspaces(false);
        return;
      }

      setIsRestoringWorkspaces(true);
      if (user?.id) {
        await syncStoredAnalyticsWorkspacesFromBackend(actorKey, user.id);
      }

      if (cancelled) return;

      const restored = listStoredAnalyticsWorkspacesByCompany(actorKey, companyId).map((item) => ({
        id: item.id,
        title: item.title,
        reportName: item.reportName,
        filters: {
          companyId: item.companyId,
          metrics: item.metrics,
          period: item.period,
          chartType: item.chartType,
          startDate: item.startDate,
          endDate: item.endDate,
          sourceReportId: item.sourceReportId,
          reportName: item.reportName,
          dataMode: item.dataMode ?? (item.sourceReportId ? "report" : "demo")
        } satisfies AnalyticsChartFilters
      }));

      const initialWorkspace = restored[0] ?? createWorkspace(companyId, undefined, 1);
      setSearchQuery("");
      setWorkspaces(restored.length ? restored : [initialWorkspace]);
      const preferredId =
        (initialWorkspaceId && restored.find((workspace) => workspace.id === initialWorkspaceId)?.id) ??
        initialWorkspace.id;
      setActiveWorkspaceId(preferredId);
      setIsWorkspaceListOpen(false);
      setWorkspaceSearch("");
      setIsRestoringWorkspaces(false);
    };

    void restoreWorkspaces();

    return () => {
      cancelled = true;
      setIsRestoringWorkspaces(false);
    };
  }, [actorKey, companyId, initialWorkspaceId, user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!searchPanelRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const controller = new AbortController();
    const fallbackSuggestions = presets
      .filter((preset) => {
        const needle = searchQuery.trim().toLowerCase();
        if (!needle) return true;
        return `${preset.title} ${preset.reportName}`.toLowerCase().includes(needle);
      })
      .slice(0, 3)
      .map((preset) => ({
        sourceReportId: preset.id,
        reportName: preset.reportName,
        reportDescription: preset.title,
        reportDate: null,
        companyId,
        companyName: companyName ?? "",
        superintendenceName: "",
        managementName: "",
        projectName: "",
        indicatorNames: []
      }));

    const timeoutId = window.setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const params = new URLSearchParams({
          companyId,
          limit: "3"
        });
        if (searchQuery.trim()) params.set("q", searchQuery.trim());

        const response = await fetch(`${REPORTS_API_URL}/reports/catalog/search-files?${params.toString()}`, {
          signal: controller.signal
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as { items?: CatalogSuggestion[] };
        setSuggestions(payload.items ?? []);
      } catch (fetchError) {
        if ((fetchError as Error).name === "AbortError") return;
        setSuggestions(fallbackSuggestions);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [companyId, companyName, presets, searchQuery]);

  useEffect(() => {
    if (!activeWorkspace) return;
    const { filters } = activeWorkspace;
    if (filters.period === "custom" && (!filters.startDate || !filters.endDate)) return;
    void fetchAnalytics(filters);
  }, [activeWorkspace, fetchAnalytics]);

  useEffect(() => {
    if (!companyId || !companyName) return;
    if (isRestoringWorkspaces) return;

    const serialized = workspaces.map((workspace) => ({
      id: workspace.id,
      actorKey,
      companyId,
      companyName,
      title: workspace.title,
      reportName: workspace.reportName,
      chartType: workspace.filters.chartType,
      metrics: workspace.filters.metrics,
      period: workspace.filters.period,
      startDate: workspace.filters.startDate,
      endDate: workspace.filters.endDate,
      sourceReportId: workspace.filters.sourceReportId,
      dataMode: workspace.filters.dataMode,
      updatedAt: new Date().toISOString()
    }));

    replaceStoredAnalyticsWorkspacesByCompany(actorKey, companyId, serialized);

    if (!user?.id) return;

    const timeoutId = window.setTimeout(() => {
      void persistStoredAnalyticsWorkspacesToBackend(actorKey, user.id);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [actorKey, companyId, companyName, isRestoringWorkspaces, user?.id, workspaces]);

  const updateActiveWorkspace = (updater: (workspace: ChartWorkspace) => ChartWorkspace) => {
    if (!activeWorkspaceId) return;
    setWorkspaces((current) =>
      current.map((workspace) => (workspace.id === activeWorkspaceId ? updater(workspace) : workspace))
    );
  };

  const isBlankWorkspace = (workspace?: ChartWorkspace | null) =>
    Boolean(workspace && workspace.reportName === "Gráfico em branco");

  const isDemoWorkspace = (workspace?: ChartWorkspace | null) =>
    Boolean(workspace?.filters.dataMode === "demo");

  const handleGenerate = async () => {
    if (!activeWorkspace) return;
    if (
      activeWorkspace.filters.period === "custom" &&
      (!activeWorkspace.filters.startDate || !activeWorkspace.filters.endDate)
    ) {
      toast.error("Selecione a data inicial e final para o periodo personalizado.");
      return;
    }

    await fetchAnalytics(activeWorkspace.filters);
  };

  const handleDownload = async () => {
    if (!chartRef.current || !companyName || !activeWorkspace) return;
    try {
      await svgToPng(
        chartRef.current,
        `${companyName.toLowerCase().replace(/\s+/g, "-")}-${activeWorkspace.title.toLowerCase().replace(/\s+/g, "-")}.png`
      );
      toast.success("Imagem do gráfico baixada.");
    } catch (downloadError) {
      toast.error((downloadError as Error).message);
    }
  };

  const handleCreateWorkspace = (preset?: AnalyticsExamplePreset) => {
    if (!companyId) return;
    const nextWorkspace = createWorkspace(companyId, preset, workspaces.length + 1);
    if (!preset) {
      nextWorkspace.title = `Gráfico em branco ${workspaces.length + 1}`;
      nextWorkspace.reportName = "Gráfico em branco";
      nextWorkspace.filters = {
        ...nextWorkspace.filters,
        dataMode: "report",
        sourceReportId: undefined,
        reportName: undefined
      };
    }
    setWorkspaces((current) => [...current, nextWorkspace]);
    setActiveWorkspaceId(nextWorkspace.id);
    if (preset) setSearchQuery(preset.reportName);
    window.setTimeout(() => searchInputRef.current?.focus(), 80);
  };

  const handleRenameWorkspace = (workspaceId: string) => {
    const target = workspaces.find((workspace) => workspace.id === workspaceId);
    if (!target) return;

    const nextTitle = window.prompt("Novo nome do gráfico:", target.title)?.trim();
    if (!nextTitle) return;

    setWorkspaces((current) =>
      current.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              title: nextTitle
            }
          : workspace
      )
    );
    toast.success("Gráfico renomeado.");
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    const target = workspaces.find((workspace) => workspace.id === workspaceId);
    if (!target) return;

    const confirmed = window.confirm(`Excluir o gráfico "${target.title}"?`);
    if (!confirmed) return;

    const remaining = workspaces.filter((workspace) => workspace.id !== workspaceId);
    removeStoredAnalyticsWorkspace(actorKey, workspaceId);

    if (remaining.length === 0 && companyId) {
      const fallbackWorkspace = createWorkspace(companyId, undefined, 1);
      setWorkspaces([fallbackWorkspace]);
      setActiveWorkspaceId(fallbackWorkspace.id);
    } else {
      setWorkspaces(remaining);
      if (activeWorkspaceId === workspaceId) {
        setActiveWorkspaceId(remaining[0]?.id ?? null);
      }
    }

    toast.success("Gráfico removido.");
  };

  const handleApplySuggestion = (suggestion: CatalogSuggestion) => {
    if (!companyId) return;

    const matchedPreset =
      presets.find((preset) => preset.reportName === suggestion.reportName) ??
      presets.find((preset) => preset.id === suggestion.sourceReportId);

    if (!activeWorkspaceId) {
      handleCreateWorkspace(matchedPreset);
      return;
    }

    setSearchQuery(suggestion.reportName);
    setIsSearchOpen(false);
    updateActiveWorkspace((workspace) => ({
      ...workspace,
      title: matchedPreset?.title ?? suggestion.reportName.replace(/\.pdf$/i, ""),
      reportName: suggestion.reportName,
      filters: {
        ...workspace.filters,
        companyId,
        sourceReportId: suggestion.sourceReportId,
        reportName: suggestion.reportName,
        dataMode: "report"
      }
    }));
  };

  return (
    <div className="min-w-0 space-y-5 overflow-x-clip">
      <Card className="border-primary/40 bg-card">
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">Criar gráfico a partir de um relatório</p>
              <p className="break-words text-xs text-muted-foreground">
                O bloco inicial usa um exemplo gráfico. Ao selecionar um relatório real, o gráfico passa a usar métricas reais do banco.
              </p>
            </div>
            <Button type="button" onClick={() => handleCreateWorkspace()} className="h-11 shrink-0 rounded-2xl px-4">
              <Plus className="mr-2 h-4 w-4" />
              Criar relatório
            </Button>
          </div>

          <div ref={searchPanelRef} className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Digite o nome do relatório para montar o gráfico..."
              className="border-primary/30 bg-background pl-10"
            />
            {isSearchOpen ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 max-w-full overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.10)] animate-in fade-in-0 zoom-in-95">
                <div className="flex items-center gap-2 border-b border-primary/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Sugestões enquanto você digita
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {isSearchingSuggestions ? (
                    <div className="rounded-xl bg-background px-4 py-5 text-sm text-muted-foreground">
                      Buscando relatorios desta empresa...
                    </div>
                  ) : suggestions.length ? (
                    suggestions.map((suggestion) => (
                      <button
                        key={suggestion.sourceReportId}
                        type="button"
                        className="w-full rounded-xl px-3 py-3 text-left transition-all duration-200 hover:bg-primary/5"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        <p className="break-words text-sm font-semibold text-foreground">{suggestion.reportName}</p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {[suggestion.superintendenceName, suggestion.managementName, suggestion.projectName]
                            .filter(Boolean)
                            .join(" / ")}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-primary/20 bg-background px-4 py-5 text-sm text-muted-foreground">
                      Nenhum relatório encontrado nessa busca. Ajuste o termo ou crie um gráfico em branco.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {isBlankWorkspace(activeWorkspace) ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">Fluxo guiado para o bloco criado</p>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                <p>1. Clique na lupa ou no campo de busca acima.</p>
                <p>2. Pesquise o nome do relatório desejado.</p>
                <p>3. Selecione a sugestão para carregar a evolução real do relatório no gráfico.</p>
              </div>
            </div>
          ) : null}

          {isDemoWorkspace(activeWorkspace) ? (
            <div className="rounded-2xl border border-primary/20 bg-muted/30 p-4 text-sm text-muted-foreground">
              Este bloco é apenas um exemplo inicial. Pesquise um relatório acima para trocar os dados fake por métricas reais.
            </div>
          ) : null}

          <div className="rounded-2xl border border-primary/30 bg-background shadow-[0_0_0_1px_rgba(0,164,67,0.10),0_0_18px_rgba(0,164,67,0.10)]">
            <button
              type="button"
              className="flex w-full min-w-0 items-center justify-between gap-4 px-4 py-4 text-left transition-all duration-200 hover:bg-primary/[0.04]"
              onClick={() => setIsWorkspaceListOpen((current) => !current)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Meus gráficos</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {activeWorkspace
                    ? `Selecionado: ${activeWorkspace.title}`
                    : `${workspaces.length} gráfico(s) salvo(s) nesta empresa`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {workspaces.length}
                </span>
                {isWorkspaceListOpen ? (
                  <ChevronUp className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>

            {isWorkspaceListOpen ? (
              <div className="border-t border-primary/10 px-3 py-3">
                <div className="mb-3">
                  <Input
                    value={workspaceSearch}
                    onChange={(event) => setWorkspaceSearch(event.target.value)}
                    placeholder="Buscar nos meus gráficos..."
                    className="border-primary/30 bg-background shadow-[0_0_0_1px_rgba(13,169,254,0.08)]"
                  />
                </div>
                <div className="space-y-2">
                  {filteredWorkspaces.map((workspace, index) => (
                    <div
                      key={workspace.id}
                      className={cn(
                        "group flex flex-col gap-3 rounded-xl border px-4 py-3 transition-all duration-200 sm:flex-row sm:items-center",
                        activeWorkspace?.id === workspace.id
                          ? "border-primary bg-primary/10 shadow-[0_14px_28px_rgba(0,164,67,0.12)]"
                          : "border-primary/20 bg-background hover:border-primary hover:shadow-[0_12px_24px_rgba(13,169,254,0.10)]"
                      )}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
                        onClick={() => {
                          setActiveWorkspaceId(workspace.id);
                          setIsWorkspaceListOpen(false);
                          if (isBlankWorkspace(workspace)) {
                            window.setTimeout(() => searchInputRef.current?.focus(), 80);
                          }
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {workspace.title || `Gráfico ${index + 1}`}
                          </p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{workspace.reportName}</p>
                        </div>
                        <div className="max-w-[8.5rem] shrink-0 text-right">
                          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                            {workspace.filters.chartType}
                          </p>
                          {isBlankWorkspace(workspace) ? (
                            <p className="mt-1 break-words text-[11px] font-medium text-primary">Aguardando relatório</p>
                          ) : isDemoWorkspace(workspace) ? (
                            <p className="mt-1 break-words text-[11px] font-medium text-muted-foreground">Exemplo</p>
                          ) : (
                            <p className="mt-1 break-words text-[11px] font-medium text-primary">Dados reais</p>
                          )}
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center justify-end gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full border-primary/20 bg-background hover:border-primary/50"
                          onClick={() => handleRenameWorkspace(workspace.id)}
                          aria-label={`Renomear ${workspace.title}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full border-rose-300/40 bg-background text-rose-600 hover:border-rose-500/50 hover:text-rose-700"
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          aria-label={`Excluir ${workspace.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredWorkspaces.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-primary/20 bg-background px-4 py-5 text-sm text-muted-foreground">
                      Nenhum gráfico encontrado com esse filtro.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:gap-6">
        <ChartPreview
          ref={chartRef}
          data={data}
          metrics={activeWorkspace?.filters.metrics ?? ["views"]}
          chartType={activeWorkspace?.filters.chartType ?? "bar"}
          pieData={pieData}
          companyName={companyName}
          isLoading={isLoading}
          error={error}
          reportName={activeWorkspace?.reportName ?? null}
          isUsingRealData={activeWorkspace?.filters.dataMode === "report" && Boolean(activeWorkspace?.filters.sourceReportId)}
        />
        {activeWorkspace && (
          <div className="min-w-0 space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-background px-4 py-3 shadow-[0_0_0_1px_rgba(0,164,67,0.08)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Gráfico selecionado</p>
              <div className="mt-2 flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{activeWorkspace.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{activeWorkspace.reportName}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                  {activeWorkspace.filters.chartType}
                </span>
              </div>
            </div>

            <ChartSettings
              draft={activeWorkspace.filters}
              onChange={(nextFilters) =>
                updateActiveWorkspace((workspace) => ({
                  ...workspace,
                  filters: nextFilters
                }))
              }
              onGenerate={handleGenerate}
              onDownload={handleDownload}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
