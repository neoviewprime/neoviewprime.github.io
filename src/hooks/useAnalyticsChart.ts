import { useCallback, useMemo, useState } from "react";
import { companies } from "@/data/mockData";
import { API_URL } from "@/lib/api";

export type AnalyticsMetric = "views" | "likes" | "comments" | "shares";
export type AnalyticsPeriod = "day" | "week" | "month" | "6months" | "year" | "custom";
export type AnalyticsChartType = "bar" | "line" | "pie" | "area";

export interface AnalyticsCompanyOption {
  id: string;
  name: string;
}

export interface AnalyticsPoint {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reports: number;
  total: number;
}

export interface AnalyticsResponse {
  companyId: string;
  companyName: string;
  period: AnalyticsPeriod;
  metrics: AnalyticsMetric[];
  range: {
    startDate: string;
    endDate: string;
  };
  totals: Record<AnalyticsMetric, number> & { reports: number };
  points: AnalyticsPoint[];
}

export interface AnalyticsChartFilters {
  companyId: string;
  metrics: AnalyticsMetric[];
  period: AnalyticsPeriod;
  chartType: AnalyticsChartType;
  startDate?: string;
  endDate?: string;
  sourceReportId?: string;
  reportName?: string;
  dataMode?: "demo" | "company" | "report";
}

export interface AnalyticsExamplePreset {
  id: string;
  title: string;
  reportName: string;
  filters: Omit<AnalyticsChartFilters, "companyId">;
}

const fallbackCompanies: AnalyticsCompanyOption[] = [
  { id: "coelba", name: "Neoenergia Coelba" },
  { id: "cosern", name: "Neoenergia Cosern" },
  { id: "brasilia", name: "Neoenergia Brasilia" },
  { id: "elektro", name: "Neoenergia Elektro" },
  { id: "pernambuco", name: "Neoenergia Pernambuco" }
];

export const analyticsCompanies: AnalyticsCompanyOption[] = companies.length
  ? companies.slice(0, 5).map((company) => ({ id: company.id, name: company.name }))
  : fallbackCompanies;

export const analyticsExamplePresets: Record<string, AnalyticsExamplePreset[]> = {
  coelba: [
    {
      id: "coelba-sla",
      title: "Engajamento SLA Comercial",
      reportName: "Relatorio SLA Comercial Q4 2024.pdf",
      filters: { metrics: ["views", "likes"], period: "month", chartType: "line" }
    },
    {
      id: "coelba-dec",
      title: "Evolucao DEC Q4",
      reportName: "Relatorio DEC Q4 2024.pdf",
      filters: { metrics: ["views", "comments", "shares"], period: "6months", chartType: "bar" }
    },
    {
      id: "coelba-fec",
      title: "Comparativo FEC",
      reportName: "Relatorio FEC Q4 2024.pdf",
      filters: { metrics: ["views", "likes", "comments"], period: "year", chartType: "area" }
    }
  ],
  cosern: [
    {
      id: "cosern-expansao",
      title: "Rede e cobertura",
      reportName: "Relatorio Expansao 2024.pdf",
      filters: { metrics: ["views", "likes"], period: "6months", chartType: "line" }
    },
    {
      id: "cosern-mapa",
      title: "Mapa Cobertura RN",
      reportName: "Mapa Cobertura RN 2024.pdf",
      filters: { metrics: ["views", "shares"], period: "month", chartType: "bar" }
    }
  ],
  brasilia: [
    {
      id: "brasilia-smart-grid",
      title: "Smart Grid e automacao",
      reportName: "Projeto Smart Grid.pdf",
      filters: { metrics: ["views", "likes", "comments"], period: "6months", chartType: "line" }
    },
    {
      id: "brasilia-roi",
      title: "ROI da automacao",
      reportName: "ROI Automacao de Rede.pdf",
      filters: { metrics: ["views", "shares"], period: "year", chartType: "bar" }
    }
  ],
  elektro: [
    {
      id: "elektro-preventiva",
      title: "Programa de manutencao",
      reportName: "Manutencao Preventiva 2024.pdf",
      filters: { metrics: ["views", "likes"], period: "month", chartType: "line" }
    },
    {
      id: "elektro-falhas",
      title: "Falhas recorrentes",
      reportName: "Analise Falhas Recorrentes.pdf",
      filters: { metrics: ["views", "comments", "shares"], period: "6months", chartType: "bar" }
    }
  ],
  pernambuco: [
    {
      id: "pernambuco-gd",
      title: "Crescimento da GD",
      reportName: "Relatorio GD 2024.pdf",
      filters: { metrics: ["views", "likes", "shares"], period: "year", chartType: "line" }
    },
    {
      id: "pernambuco-solar",
      title: "Mapa Solar Pernambuco",
      reportName: "Mapa Solar Pernambuco.pdf",
      filters: { metrics: ["views", "comments"], period: "month", chartType: "bar" }
    }
  ]
};

const periodConfig: Record<AnalyticsPeriod, { size: number; prefix: string }> = {
  day: { size: 8, prefix: "Hora" },
  week: { size: 7, prefix: "Dia" },
  month: { size: 6, prefix: "Sem" },
  "6months": { size: 6, prefix: "Mes" },
  year: { size: 12, prefix: "Mes" },
  custom: { size: 5, prefix: "P" }
};

interface AnalyticsCompanyProfile {
  viewsBase: number;
  likesBase: number;
  commentsBase: number;
  sharesBase: number;
  growth: number;
  volatility: number;
  reportsBase: number;
}

const companyProfiles: Record<string, AnalyticsCompanyProfile> = {
  coelba: {
    viewsBase: 540,
    likesBase: 152,
    commentsBase: 48,
    sharesBase: 36,
    growth: 54,
    volatility: 34,
    reportsBase: 6
  },
  cosern: {
    viewsBase: 460,
    likesBase: 136,
    commentsBase: 40,
    sharesBase: 31,
    growth: 42,
    volatility: 26,
    reportsBase: 4
  },
  brasilia: {
    viewsBase: 620,
    likesBase: 170,
    commentsBase: 55,
    sharesBase: 44,
    growth: 49,
    volatility: 29,
    reportsBase: 5
  },
  elektro: {
    viewsBase: 505,
    likesBase: 145,
    commentsBase: 43,
    sharesBase: 33,
    growth: 38,
    volatility: 24,
    reportsBase: 4
  },
  pernambuco: {
    viewsBase: 590,
    likesBase: 162,
    commentsBase: 51,
    sharesBase: 42,
    growth: 46,
    volatility: 31,
    reportsBase: 5
  }
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const getCompanyProfile = (companyId: string): AnalyticsCompanyProfile => {
  return (
    companyProfiles[companyId] ?? {
      viewsBase: 480,
      likesBase: 140,
      commentsBase: 38,
      sharesBase: 28,
      growth: 36,
      volatility: 22,
      reportsBase: 4
    }
  );
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

const getPeriodDate = (period: AnalyticsPeriod, anchor: Date, stepsFromEnd: number) => {
  if (period === "day" || period === "week" || period === "month" || period === "custom") {
    const stepSize = period === "day" ? 1 : period === "week" ? 1 : 7;
    return addDays(anchor, -stepsFromEnd * stepSize);
  }

  return addMonths(anchor, -stepsFromEnd);
};

const formatPointLabel = (period: AnalyticsPeriod, index: number, date: Date) => {
  if (period === "day") return `${date.getHours().toString().padStart(2, "0")}h`;
  if (period === "week") return ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"][index] ?? `Dia ${index + 1}`;
  if (period === "month") return `Sem ${index + 1}`;
  if (period === "6months" || period === "year") {
    return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  }

  return `P${index + 1}`;
};

const buildMetricValue = (base: number, profile: AnalyticsCompanyProfile, seed: number, index: number, weight: number) => {
  const trend = profile.growth * index * weight;
  const oscillation = (((seed >> (index % 8)) & 15) - 5) * profile.volatility * weight;
  return Math.max(0, Math.round(base + trend + oscillation + (seed % 23)));
};

const buildMockResponse = (filters: AnalyticsChartFilters): AnalyticsResponse => {
  const companyName = analyticsCompanies.find((company) => company.id === filters.companyId)?.name ?? filters.companyId;
  const profile = getCompanyProfile(filters.companyId);
  const seed = hashString(`${filters.companyId}-${filters.period}-${filters.metrics.join(",")}`);
  const config = periodConfig[filters.period];
  const anchorDate = filters.endDate ? new Date(`${filters.endDate}T12:00:00`) : new Date("2026-03-10T12:00:00");

  const points = Array.from({ length: config.size }, (_, index) => {
    const pointSeed = seed + index * 17;
    const date = getPeriodDate(filters.period, anchorDate, config.size - index - 1);
    const startDate = date.toISOString().slice(0, 10);
    const views = buildMetricValue(profile.viewsBase, profile, pointSeed, index, 1);
    const likes = buildMetricValue(profile.likesBase, profile, pointSeed, index, 0.38);
    const comments = buildMetricValue(profile.commentsBase, profile, pointSeed, index, 0.18);
    const shares = buildMetricValue(profile.sharesBase, profile, pointSeed, index, 0.14);
    const reports = Math.max(1, profile.reportsBase + ((pointSeed >> 3) % 4));

    return {
      key: `${filters.companyId}-${index}`,
      label: formatPointLabel(filters.period, index, date) || `${config.prefix} ${index + 1}`,
      startDate,
      endDate: startDate,
      views,
      likes,
      comments,
      shares,
      reports,
      total: views + likes + comments + shares
    };
  });

  const totals = points.reduce(
    (acc, point) => ({
      views: acc.views + point.views,
      likes: acc.likes + point.likes,
      comments: acc.comments + point.comments,
      shares: acc.shares + point.shares,
      reports: acc.reports + point.reports
    }),
    { views: 0, likes: 0, comments: 0, shares: 0, reports: 0 }
  );

  return {
    companyId: filters.companyId,
    companyName,
    period: filters.period,
    metrics: filters.metrics,
    range: {
      startDate: filters.startDate || points[0]?.startDate || "2026-01-01",
      endDate: filters.endDate || points[points.length - 1]?.endDate || "2026-03-10"
    },
    totals,
    points
  };
};

const buildEmptyResponse = (filters: AnalyticsChartFilters): AnalyticsResponse => {
  const companyName = analyticsCompanies.find((company) => company.id === filters.companyId)?.name ?? filters.companyId;
  return {
    companyId: filters.companyId,
    companyName,
    period: filters.period,
    metrics: filters.metrics,
    range: {
      startDate: filters.startDate || new Date().toISOString().slice(0, 10),
      endDate: filters.endDate || new Date().toISOString().slice(0, 10)
    },
    totals: { views: 0, likes: 0, comments: 0, shares: 0, reports: 0 },
    points: []
  };
};

export function useAnalyticsChart(initialFilters: AnalyticsChartFilters) {
  const [filters, setFilters] = useState<AnalyticsChartFilters>(initialFilters);
  const [data, setData] = useState<AnalyticsResponse | null>(() =>
    initialFilters.dataMode === "demo" ? buildMockResponse(initialFilters) : buildEmptyResponse(initialFilters)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (nextFilters: AnalyticsChartFilters) => {
    setIsLoading(true);
    setFilters(nextFilters);
    setError(null);

    try {
      if (nextFilters.dataMode === "demo") {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        const demo = buildMockResponse(nextFilters);
        setData(demo);
        return demo;
      }

      if (nextFilters.dataMode === "report" && !nextFilters.sourceReportId) {
        const empty = buildEmptyResponse(nextFilters);
        setData(empty);
        return empty;
      }

      const params = new URLSearchParams({
        companyId: nextFilters.companyId,
        period: nextFilters.period,
        metrics: nextFilters.metrics.join(",")
      });

      if (nextFilters.startDate) params.set("startDate", nextFilters.startDate);
      if (nextFilters.endDate) params.set("endDate", nextFilters.endDate);
      if (nextFilters.sourceReportId) params.set("sourceReportId", nextFilters.sourceReportId);
      if (nextFilters.reportName) params.set("reportName", nextFilters.reportName);

      const response = await fetch(`${API_URL}/reports/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Falha ao carregar metricas reais (${response.status})`);
      }

      const payload = (await response.json()) as AnalyticsResponse;
      setData(payload);
      return payload;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Falha ao carregar metricas";
      setError(message);
      const fallback = nextFilters.dataMode === "demo" ? buildMockResponse(nextFilters) : buildEmptyResponse(nextFilters);
      setData(fallback);
      return fallback;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pieData = useMemo(() => {
    if (!data) return [];
    return filters.metrics.map((metric) => ({
      name: metric,
      value: data.totals[metric]
    }));
  }, [data, filters.metrics]);

  return {
    filters,
    setFilters,
    data,
    pieData,
    isLoading,
    error,
    fetchAnalytics
  };
}
