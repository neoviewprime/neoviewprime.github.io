import { BarChart3, CalendarDays, ChartArea, ChartLine, ChartPie, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AnalyticsChartFilters, AnalyticsChartType, AnalyticsMetric, AnalyticsPeriod } from "@/hooks/useAnalyticsChart";

const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "day", label: "Dia" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "6months", label: "6 meses" },
  { value: "year", label: "Ano" },
  { value: "custom", label: "Personalizado" }
];

const metricOptions: Array<{ value: AnalyticsMetric; label: string }> = [
  { value: "views", label: "Visualizações" },
  { value: "likes", label: "Curtidas" },
  { value: "comments", label: "Comentários" },
  { value: "shares", label: "Compartilhamentos" }
];

const chartOptions: Array<{ value: AnalyticsChartType; label: string; icon: typeof BarChart3 }> = [
  { value: "bar", label: "Barra", icon: BarChart3 },
  { value: "line", label: "Linha", icon: ChartLine },
  { value: "pie", label: "Pizza", icon: ChartPie },
  { value: "area", label: "Área", icon: ChartArea }
];

interface ChartSettingsProps {
  draft: AnalyticsChartFilters;
  onChange: (next: AnalyticsChartFilters) => void;
  onGenerate: () => void;
  onDownload: () => void;
  isLoading: boolean;
}

export function ChartSettings({ draft, onChange, onGenerate, onDownload, isLoading }: ChartSettingsProps) {
  const toggleMetric = (metric: AnalyticsMetric, checked: boolean) => {
    const current = new Set(draft.metrics);
    if (checked) current.add(metric);
    else current.delete(metric);
    const nextMetrics = Array.from(current);
    onChange({
      ...draft,
      metrics: nextMetrics.length ? nextMetrics : ["views"]
    });
  };

  return (
    <Card className="border-primary/40 bg-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          Configurações do gráfico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Período</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {periodOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={draft.period === option.value ? "default" : "outline"}
                className={cn(
                  "h-auto min-w-0 justify-start gap-2 rounded-2xl px-3 py-3 text-left whitespace-normal",
                  draft.period !== option.value && "border-primary/30 bg-transparent"
                )}
                onClick={() => onChange({ ...draft, period: option.value })}
              >
                <CalendarDays className="h-4 w-4 shrink-0 self-start" />
                <span className="min-w-0 break-words leading-tight">{option.label}</span>
              </Button>
            ))}
          </div>
          {draft.period === "custom" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="analytics-start">Início</Label>
                <Input
                  id="analytics-start"
                  type="date"
                  value={draft.startDate || ""}
                  onChange={(event) => onChange({ ...draft, startDate: event.target.value })}
                  className="border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analytics-end">Fim</Label>
                <Input
                  id="analytics-end"
                  type="date"
                  value={draft.endDate || ""}
                  onChange={(event) => onChange({ ...draft, endDate: event.target.value })}
                  className="border-primary/30"
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Variáveis</Label>
          <div className="space-y-3">
            {metricOptions.map((metric) => (
              <label
                key={metric.value}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-primary/20 bg-background px-3 py-3"
              >
                <Checkbox
                  checked={draft.metrics.includes(metric.value)}
                  onCheckedChange={(checked) => toggleMetric(metric.value, checked === true)}
                />
                <span className="text-sm">{metric.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tipo de gráfico</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {chartOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={draft.chartType === option.value ? "default" : "outline"}
                  className={cn(
                    "h-auto min-w-0 justify-start gap-2 rounded-2xl px-3 py-3 text-left whitespace-normal",
                    draft.chartType !== option.value && "border-primary/30 bg-transparent"
                  )}
                  onClick={() => onChange({ ...draft, chartType: option.value })}
                >
                  <Icon className="h-4 w-4 shrink-0 self-start" />
                  <span className="min-w-0 break-words leading-tight">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" onClick={onGenerate} disabled={isLoading} className="h-11 rounded-2xl">
            {isLoading ? "Gerando..." : "Gerar gráfico"}
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-2xl border-primary/40 bg-transparent" onClick={onDownload}>
            Baixar Imagem
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
