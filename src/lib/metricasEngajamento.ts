export type MetricasApi = {
  views: number;
  comments: number;
  likes: number;
  shares: number;
};

export type MetricasEngajamento = {
  visualizacoes: number;
  comentarios: number;
  curtidas: number;
  compartilhamentos: number;
};

export const metricasEngajamentoVazias = (): MetricasEngajamento => ({
  visualizacoes: 0,
  comentarios: 0,
  curtidas: 0,
  compartilhamentos: 0,
});

export const mapearMetricasDaApi = (metricas?: Partial<MetricasApi> | null): MetricasEngajamento => ({
  visualizacoes: Number(metricas?.views ?? 0),
  comentarios: Number(metricas?.comments ?? 0),
  curtidas: Number(metricas?.likes ?? 0),
  compartilhamentos: Number(metricas?.shares ?? 0),
});

export const mapearMetricasParaApi = (metricas?: Partial<MetricasEngajamento> | null): MetricasApi => ({
  views: Number(metricas?.visualizacoes ?? 0),
  comments: Number(metricas?.comentarios ?? 0),
  likes: Number(metricas?.curtidas ?? 0),
  shares: Number(metricas?.compartilhamentos ?? 0),
});