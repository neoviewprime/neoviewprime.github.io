import { forwardRef } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis
} from "recharts";
import companyLogo from "@/components/images/IB-Symbol positive colour_white background.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import type { AnalyticsChartType, AnalyticsMetric, AnalyticsResponse } from "@/hooks/useAnalyticsChart";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const metricPalette: Record<AnalyticsMetric, string> = {
  views: "#0DA9FE",
  likes: "#00A443",
  comments: "#F59E0B",
  shares: "#9CA3AF"
};

const metricLabels: Record<AnalyticsMetric, string> = {
  views: "Visualizações",
  likes: "Curtidas",
  comments: "Comentários",
  shares: "Compartilhamentos"
};

const chartConfig = {
  views: { label: "Visualizações", color: metricPalette.views },
  likes: { label: "Curtidas", color: metricPalette.likes },
  comments: { label: "Comentários", color: metricPalette.comments },
  shares: { label: "Compartilhamentos", color: metricPalette.shares }
};

interface ChartPreviewProps {
  data: AnalyticsResponse | null;
  metrics: AnalyticsMetric[];
  chartType: AnalyticsChartType;
  pieData: Array<{ name: string; value: number }>;
  companyName?: string | null;
  isLoading: boolean;
  error?: string | null;
  reportName?: string | null;
  isUsingRealData?: boolean;
}

export const ChartPreview = forwardRef<HTMLDivElement, ChartPreviewProps>(
  ({ data, metrics, chartType, pieData, companyName, isLoading, error, reportName, isUsingRealData }, ref) => {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const hasData = !!data && (data.points.length > 0 || pieData.length > 0);
    const activeMetricLabels = metrics.map((metric) => ({
      key: metric,
      label: metricLabels[metric],
      color: metricPalette[metric]
    }));

    return (
      <Card className="border-primary/40 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Visualização do gráfico</CardTitle>
          <p className="text-sm text-muted-foreground">
            {companyName
              ? `${companyName}${reportName ? ` " ${reportName}` : ""}${isUsingRealData ? " com metricas reais." : " com visualizacao de exemplo."}`
              : "Selecione uma empresa para abrir o construtor."}
          </p>
        </CardHeader>
        <CardContent>
          <div ref={ref} className="rounded-xl border border-primary/20 bg-background p-3 sm:p-4">
            {hasData ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {(chartType === "pie"
                  ? pieData.map((item) => ({
                      key: item.name,
                      label: metricLabels[item.name as AnalyticsMetric],
                      color: metricPalette[item.name as AnalyticsMetric]
                    }))
                  : activeMetricLabels
                ).map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3 py-1 text-[11px] font-medium text-foreground"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground sm:h-[360px]">
                <div className="analytics-loader">
                  <div className="analytics-loader__ring" />
                  <img src={companyLogo} alt="Neoenergia" className="analytics-loader__logo" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-medium text-foreground">
                    {isUsingRealData ? "Montando visual com metricas reais" : "Montando visual de exemplo"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isUsingRealData
                      ? "Consultando visualizações, curtidas, comentários e compartilhamentos do relatório selecionado."
                      : "Preparando series de exemplo de visualizações, curtidas, comentários e compartilhamentos."}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground sm:h-[360px]">
                <p className="font-medium text-foreground">Não foi possível carregar as métricas do gráfico.</p>
                <p>{error}</p>
              </div>
            ) : !hasData ? (
              <div className="flex h-[300px] items-center justify-center text-center text-sm text-muted-foreground sm:h-[360px]">
                {isUsingRealData
                  ? "Selecione um relatório na busca para carregar metricas reais."
                  : "O gráfico aparecerá aqui assim que a empresa for selecionada."}
              </div>
            ) : chartType === "pie" ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0 sm:h-[360px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={isMobile ? 74 : 92} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={metricPalette[entry.name as AnalyticsMetric]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            ) : chartType === "line" ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0 sm:h-[360px]">
                <LineChart
                  data={data?.points}
                  margin={{ top: 8, right: isMobile ? 4 : 16, left: isMobile ? -28 : -12, bottom: isMobile ? 4 : 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 24 : 16} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={isMobile ? 30 : 40} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {metrics.map((metric) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={metricLabels[metric]}
                      stroke={metricPalette[metric]}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            ) : chartType === "area" ? (
              <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0 sm:h-[360px]">
                <AreaChart
                  data={data?.points}
                  margin={{ top: 8, right: isMobile ? 4 : 16, left: isMobile ? -28 : -12, bottom: isMobile ? 4 : 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 24 : 16} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={isMobile ? 30 : 40} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {metrics.map((metric) => (
                    <Area
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      name={metricLabels[metric]}
                      stroke={metricPalette[metric]}
                      fill={metricPalette[metric]}
                      fillOpacity={0.18}
                      strokeWidth={3}
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px] w-full min-w-0 sm:h-[360px]">
                <BarChart
                  data={data?.points}
                  barGap={isMobile ? 4 : 10}
                  margin={{ top: 8, right: isMobile ? 4 : 16, left: isMobile ? -28 : -12, bottom: isMobile ? 4 : 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={isMobile ? 24 : 16} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <YAxis tickLine={false} axisLine={false} width={isMobile ? 30 : 40} tick={{ fontSize: isMobile ? 10 : 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {metrics.map((metric) => (
                    <Bar
                      key={metric}
                      dataKey={metric}
                      name={metricLabels[metric]}
                      fill={metricPalette[metric]}
                      radius={[8, 8, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ChartPreview.displayName = "ChartPreview";
