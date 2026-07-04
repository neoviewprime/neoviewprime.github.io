export type EngagementMetricKey =
  | 'visualizacoes'
  | 'comentarios'
  | 'curtidas'
  | 'compartilhamentos'
  | 'visualizações'
  | 'comentários'
  | 'views'
  | 'comments'
  | 'likes'
  | 'shares';

type CanonicalMetricKey = 'visualizacoes' | 'comentarios' | 'curtidas' | 'compartilhamentos';

const canonicalMetricKey = (metric: EngagementMetricKey): CanonicalMetricKey => {
  switch (metric) {
    case 'views':
    case 'visualizações':
      return 'visualizacoes';
    case 'comments':
    case 'comentários':
      return 'comentarios';
    case 'likes':
      return 'curtidas';
    case 'shares':
      return 'compartilhamentos';
    default:
      return metric;
  }
};

const metricSingularLabels: Record<CanonicalMetricKey, string> = {
  visualizacoes: 'visualização',
  comentarios: 'comentário',
  curtidas: 'curtida',
  compartilhamentos: 'compartilhamento',
};

const metricPluralLabels: Record<CanonicalMetricKey, string> = {
  visualizacoes: 'visualizações',
  comentarios: 'comentários',
  curtidas: 'curtidas',
  compartilhamentos: 'compartilhamentos',
};

export const getMetricLabel = (metric: EngagementMetricKey, count: number) => {
  const chaveCanonica = canonicalMetricKey(metric);
  return count === 1 ? metricSingularLabels[chaveCanonica] : metricPluralLabels[chaveCanonica];
};

export const formatMetricCount = (metric: EngagementMetricKey, count: number) =>
  `${count} ${getMetricLabel(metric, count)}`;

export const metricLabelsPlural = metricPluralLabels;