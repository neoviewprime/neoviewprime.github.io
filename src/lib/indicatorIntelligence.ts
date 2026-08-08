import { companies, type Indicator } from '@/data/mockData';

export type IndicatorYearPoint = {
  year: number;
  value: number;
  target: number;
  reportId: string;
  reportName: string;
  companyId: string;
  companyName: string;
  note: string;
};

export type IndicatorProfile = {
  id: string;
  acronym: string;
  name: string;
  unit: string;
  direction: 'lower-is-better' | 'higher-is-better';
  businessQuestion: string;
  goodFor: string[];
  avoidFor: string[];
  related: string[];
  aliases: string[];
  series: IndicatorYearPoint[];
};

const profiles: IndicatorProfile[] = [
  {
    id: 'ind-dec',
    acronym: 'DEC',
    name: 'Duração Equivalente por Consumidor',
    unit: 'h',
    direction: 'lower-is-better',
    businessQuestion: 'Quanto tempo, em média, o cliente ficou sem energia?',
    goodFor: ['qualidade do fornecimento', 'continuidade de rede', 'priorização de manutenção', 'comparação regulatória'],
    avoidFor: ['medir quantidade de ocorrências isoladamente', 'avaliar satisfação sem cruzar com percepção do cliente'],
    related: ['FEC', 'ISQP', 'Perdas Técnicas'],
    aliases: ['duracao', 'interrupcao', 'continuidade', 'qualidade energia'],
    series: [
      { year: 2022, value: 14.8, target: 13.9, reportId: 'rep-1b', reportName: 'DEC Histórico Anual 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Ano pressionado por eventos climáticos no litoral e zona rural.' },
      { year: 2023, value: 13.6, target: 13.2, reportId: 'rep-2', reportName: 'Análise Comparativa DEC.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Melhora gradual com recomposição de equipes de campo.' },
      { year: 2024, value: 12.5, target: 12.8, reportId: 'rep-1', reportName: 'Relatório DEC Q4 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Ficou abaixo da meta, bom sinal para continuidade.' },
      { year: 2025, value: 11.9, target: 12.1, reportId: 'rep-1c', reportName: 'Plano de Ação DEC 2025.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção considerando automação e poda preventiva.' },
      { year: 2026, value: 11.4, target: 11.7, reportId: 'demo-pending-dec-plano-acao', reportName: 'Plano de Ação DEC Região Norte Abril 2026.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com foco em alimentadores críticos.' },
    ],
  },
  {
    id: 'ind-fec',
    acronym: 'FEC',
    name: 'Frequência Equivalente por Consumidor',
    unit: 'interrupções',
    direction: 'lower-is-better',
    businessQuestion: 'Quantas interrupções, em média, o cliente sofreu?',
    goodFor: ['recorrência de falhas', 'qualidade de rede', 'comparação com DEC', 'priorização de inspeções'],
    avoidFor: ['estimar duração total sem DEC', 'medir experiência completa sem dados de atendimento'],
    related: ['DEC', 'ISQP', 'MTBF'],
    aliases: ['frequencia', 'interrupcoes', 'falhas', 'recorrencia'],
    series: [
      { year: 2022, value: 9.4, target: 8.9, reportId: 'rep-3a', reportName: 'FEC por Região Bahia.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Alta recorrência em circuitos rurais.' },
      { year: 2023, value: 8.7, target: 8.5, reportId: 'rep-3b', reportName: 'Análise FEC vs Meta ANEEL.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Redução modesta, ainda perto do limite regulatório.' },
      { year: 2024, value: 8.2, target: 8.2, reportId: 'rep-3', reportName: 'Relatório FEC Q4 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Na meta, mas pede olhar conjunto com DEC.' },
      { year: 2025, value: 7.8, target: 8.0, reportId: 'rep-3b', reportName: 'Análise FEC vs Meta ANEEL.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com queda por manutenção preventiva.' },
      { year: 2026, value: 7.5, target: 7.8, reportId: 'rep-3a', reportName: 'FEC por Região Bahia.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção favorável, mas dependente de clima.' },
    ],
  },
  {
    id: 'ind-isqp',
    acronym: 'ISQP',
    name: 'Índice de Satisfação com a Qualidade Percebida',
    unit: '%',
    direction: 'higher-is-better',
    businessQuestion: 'Como o cliente percebe a qualidade do serviço?',
    goodFor: ['percepção do cliente', 'priorização de experiência', 'correlação com DEC/FEC', 'avaliação por município'],
    avoidFor: ['diagnosticar causa técnica sozinho', 'substituir indicadores regulatórios'],
    related: ['DEC', 'FEC', 'SLA Comercial'],
    aliases: ['satisfacao', 'qualidade percebida', 'cliente', 'nps'],
    series: [
      { year: 2022, value: 72.4, target: 75, reportId: 'rep-5', reportName: 'Pesquisa Satisfação 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Base ainda abaixo da meta de experiência.' },
      { year: 2023, value: 75.9, target: 76, reportId: 'rep-5c', reportName: 'Comparativo ISQP 2023-2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Virada positiva após ajustes de atendimento.' },
      { year: 2024, value: 78.5, target: 77, reportId: 'rep-5a', reportName: 'ISQP Detalhado por Município.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Superou meta; bom cruzar com regiões de DEC alto.' },
      { year: 2025, value: 80.1, target: 78.5, reportId: 'rep-5b', reportName: 'Plano Melhoria Satisfação.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção sustentada por ações de comunicação.' },
      { year: 2026, value: 81.6, target: 80, reportId: 'rep-corp-1', reportName: 'Pesquisa Satisfação Corporativos 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com melhora em grandes clientes.' },
    ],
  },
  {
    id: 'ind-sla-comercial',
    acronym: 'SLA',
    name: 'SLA Comercial',
    unit: '%',
    direction: 'higher-is-better',
    businessQuestion: 'Os prazos comerciais estão sendo cumpridos?',
    goodFor: ['operação comercial', 'cumprimento de prazos', 'backlog', 'qualidade de atendimento'],
    avoidFor: ['medir qualidade técnica da rede', 'avaliar interrupções sem DEC/FEC'],
    related: ['TMA', 'Inadimplência', 'ISQP'],
    aliases: ['nivel servico', 'prazo', 'comercial', 'atendimento'],
    series: [
      { year: 2022, value: 88.9, target: 91, reportId: 'rep-sla-1', reportName: 'Relatório SLA Comercial Q4 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Base pressionada por filas e retrabalho.' },
      { year: 2023, value: 91.7, target: 92, reportId: 'rep-sla-2', reportName: 'Dashboard Operacional Dezembro.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Melhora por padronização de triagem.' },
      { year: 2024, value: 94.2, target: 93, reportId: 'rep-sla-1', reportName: 'Relatório SLA Comercial Q4 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Acima da meta e com tendência saudável.' },
      { year: 2025, value: 95.1, target: 94, reportId: 'rep-sla-4', reportName: 'Painel Operacional Comercial Fev 2025.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com automação de esteira.' },
      { year: 2026, value: 95.8, target: 94.5, reportId: 'demo-pending-gestao-comercial', reportName: 'Análise de Backlog Comercial Março 2026.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção sensível a volume de solicitações.' },
    ],
  },
  {
    id: 'ind-inadimplencia',
    acronym: 'Inadimplência',
    name: 'Taxa de Inadimplência',
    unit: '%',
    direction: 'lower-is-better',
    businessQuestion: 'Qual parcela da base ativa está inadimplente?',
    goodFor: ['risco de receita', 'cobrança', 'recuperação de crédito', 'segmentação de carteira'],
    avoidFor: ['medir satisfação do cliente', 'explicar perda técnica de energia'],
    related: ['IPCE', 'SLA Comercial', 'Recuperação de Energia'],
    aliases: ['credito', 'cobranca', 'receita', 'ipce'],
    series: [
      { year: 2022, value: 4.9, target: 4.5, reportId: 'rep-inad-1', reportName: 'Relatório Inadimplência Q4 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Carteira pressionada por recuperação lenta.' },
      { year: 2023, value: 4.3, target: 4.2, reportId: 'rep-inad-2', reportName: 'Estratégias Recuperação Crédito.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Ações segmentadas começam a reduzir risco.' },
      { year: 2024, value: 3.8, target: 4.0, reportId: 'rep-inad-1', reportName: 'Relatório Inadimplência Q4 2024.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Abaixo da meta, cenário favorável.' },
      { year: 2025, value: 3.6, target: 3.8, reportId: 'rep-inad-2', reportName: 'Estratégias Recuperação Crédito.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com cobrança preditiva.' },
      { year: 2026, value: 3.4, target: 3.7, reportId: 'manual-58225b4d-dab7-4519-9a1a-15eb3878c88c--iar_e_pce', reportName: 'IAR e PCE.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção para comparação multi-relatório.' },
    ],
  },
  {
    id: 'ind-tma',
    acronym: 'TMA',
    name: 'Tempo Médio de Atendimento',
    unit: 's',
    direction: 'lower-is-better',
    businessQuestion: 'Quanto tempo uma interação leva para ser resolvida?',
    goodFor: ['eficiência de atendimento', 'dimensionamento de equipe', 'picos de demanda', 'produtividade'],
    avoidFor: ['medir satisfação sozinho', 'avaliar continuidade da rede'],
    related: ['SLA', 'ISQP'],
    aliases: ['tempo medio', 'call center', 'chamada', 'produtividade'],
    series: [
      { year: 2022, value: 226, target: 210, reportId: 'rep-6a', reportName: 'TMA por Tipo de Chamada.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Tempo alto por baixa automação de triagem.' },
      { year: 2023, value: 199, target: 195, reportId: 'rep-6c', reportName: 'Análise Picos de Demanda.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Queda com roteamento por motivo de contato.' },
      { year: 2024, value: 180, target: 185, reportId: 'rep-6', reportName: 'Dashboard Call Center.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Melhor que a meta; validar se houve queda de qualidade.' },
      { year: 2025, value: 172, target: 180, reportId: 'rep-6b', reportName: 'Relatório Produtividade Agentes.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com automação de respostas simples.' },
      { year: 2026, value: 166, target: 176, reportId: 'rep-6c', reportName: 'Análise Picos de Demanda.pdf', companyId: 'coelba', companyName: 'Neoenergia Coelba', note: 'Projeção com estabilização de filas.' },
    ],
  },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const indicatorsFromCatalog = companies.flatMap((company) =>
  company.superintendences.flatMap((superintendence) =>
    superintendence.managements.flatMap((management) =>
      management.projects.flatMap((project) => project.indicators)
    )
  )
);

export const indicatorProfiles = profiles;

export const findIndicatorProfile = (query: string): IndicatorProfile | undefined => {
  const normalized = normalize(query);
  return profiles.find((profile) => {
    const terms = [profile.acronym, profile.name, profile.id, ...profile.aliases, ...profile.related].map(normalize);
    return terms.some((term) => normalized.includes(term));
  });
};

export const findIndicatorProfiles = (query: string): IndicatorProfile[] => {
  const normalized = normalize(query);

  return profiles.filter((profile) => {
    const directTerms = [profile.acronym, profile.name, profile.id, ...profile.aliases].map(normalize);
    return directTerms.some((term) => normalized.includes(term));
  });
};

export const getIndicatorProfileById = (id: string) =>
  profiles.find((profile) => profile.id === id || normalize(profile.acronym) === normalize(id));

export const findMockIndicator = (profileId: string): Indicator | undefined =>
  indicatorsFromCatalog.find((indicator) => indicator.id === profileId);

export const extractYears = (query: string) => {
  const years = Array.from(query.matchAll(/\b(20[2-3][0-9])\b/g)).map((match) => Number(match[1]));
  return Array.from(new Set(years)).filter((year) => year >= 2022 && year <= 2026);
};

export const formatValue = (profile: IndicatorProfile, value: number) =>
  `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)} ${profile.unit}`;

export const calculateDelta = (profile: IndicatorProfile, from: IndicatorYearPoint, to: IndicatorYearPoint) => {
  const rawDelta = to.value - from.value;
  const percent = from.value === 0 ? 0 : (rawDelta / from.value) * 100;
  const improved = profile.direction === 'lower-is-better' ? rawDelta < 0 : rawDelta > 0;
  return { rawDelta, percent, improved };
};

export const buildIndicatorAssessment = (profile: IndicatorProfile, requestedYears?: number[]) => {
  const years = requestedYears?.length ? requestedYears : [2023, 2024];
  const selected = years
    .map((year) => profile.series.find((point) => point.year === year))
    .filter((point): point is IndicatorYearPoint => Boolean(point));
  const latest = selected.at(-1) ?? profile.series.at(-1)!;
  const previous = selected.length > 1 ? selected[0] : profile.series[profile.series.indexOf(latest) - 1] ?? profile.series[0];
  const delta = calculateDelta(profile, previous, latest);
  const targetGap = profile.direction === 'lower-is-better' ? latest.target - latest.value : latest.value - latest.target;

  return {
    profile,
    selected,
    latest,
    previous,
    delta,
    targetGap,
    verdict: delta.improved
      ? `${profile.acronym} faz sentido para essa busca e mostra melhora no recorte.`
      : `${profile.acronym} faz sentido para essa busca, mas o recorte pede investigação.`,
    targetVerdict: targetGap >= 0 ? 'Dentro ou melhor que a meta.' : 'Fora da meta, vale detalhar causas por região/unidade.',
  };
};

export const scoreIndicatorFit = (profile: IndicatorProfile, query: string) => {
  const normalized = normalize(query);
  const positiveTerms = [profile.businessQuestion, ...profile.goodFor, ...profile.aliases].map(normalize);
  const cautionTerms = profile.avoidFor.map(normalize);
  const positiveHits = positiveTerms.filter((term) =>
    term
      .split(/\s+/)
      .filter((part) => part.length > 3)
      .some((part) => normalized.includes(part))
  );
  const cautionHits = cautionTerms.filter((term) =>
    term
      .split(/\s+/)
      .filter((part) => part.length > 3)
      .some((part) => normalized.includes(part))
  );
  const score = Math.max(0.35, Math.min(0.98, 0.58 + positiveHits.length * 0.08 - cautionHits.length * 0.1));

  return {
    score,
    positiveHits,
    cautionHits,
    label: score >= 0.78 ? 'alta aderencia' : score >= 0.58 ? 'aderencia moderada' : 'aderencia baixa'
  };
};
