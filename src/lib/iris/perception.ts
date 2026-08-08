import type { ChatPageContext } from '@/types/backend';
import type { IrisAction, IrisPerception } from './types';

const stopWords = new Set([
  'a',
  'as',
  'ao',
  'aos',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'eu',
  'me',
  'minha',
  'meu',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
  'para',
  'por',
  'qual',
  'quais',
  'que',
  'um',
  'uma'
]);

const tokenAliases: Record<string, string> = {
  aprovacoes: 'aprovacao',
  aprovados: 'aprovado',
  empresas: 'empresa',
  indicadores: 'indicador',
  metricas: 'metrica',
  relatorios: 'relatorio',
  superintendencias: 'superintendencia',
  validacoes: 'validacao',
  visualizacoes: 'views'
};

const companyAliases: Record<string, string[]> = {
  coelba: ['coelba', 'bahia', 'neoenergia coelba'],
  cosern: ['cosern', 'rio grande do norte', 'rn', 'neoenergia cosern'],
  brasilia: ['brasilia', 'brasília', 'df', 'neoenergia brasilia', 'neoenergia brasília'],
  elektro: ['elektro', 'sao paulo', 'sp', 'neoenergia elektro'],
  pernambuco: ['pernambuco', 'pe', 'neoenergia pernambuco']
};

const indicatorAliases: Record<string, string[]> = {
  dec: ['dec', 'duracao', 'duração', 'continuidade'],
  fec: ['fec', 'frequencia', 'frequência', 'interrupcoes', 'interrupções'],
  isqp: ['isqp', 'satisfacao', 'satisfação', 'qualidade percebida'],
  sla: ['sla', 'prazo', 'nivel de servico', 'nível de serviço'],
  tma: ['tma', 'tempo medio', 'tempo médio', 'atendimento'],
  inadimplencia: ['inadimplencia', 'inadimplência', 'credito', 'crédito', 'cobranca', 'cobrança'],
  ipce: ['ipce'],
  iar: ['iar'],
  dce: ['dce'],
  gd: ['gd', 'geracao distribuida', 'geração distribuída']
};

export const normalizeIrisText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const tokenizeIrisText = (value: string) =>
  normalizeIrisText(value)
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map((token) => tokenAliases[token] ?? token)
    .filter((token) => token.length > 1 && !stopWords.has(token));

const hasAny = (normalized: string, tokens: string[], terms: string[]) =>
  terms.some((term) => normalized.includes(normalizeIrisText(term)) || tokens.includes(normalizeIrisText(term)));

const inferAction = (normalized: string, tokens: string[]): IrisAction => {
  if (/^(oi|ola|bom dia|boa tarde|boa noite|opa|e ai)\b/u.test(normalized)) return 'greeting';
  if (hasAny(normalized, tokens, ['obrigado', 'obrigada', 'valeu', 'vlw'])) return 'thanks';
  if (hasAny(normalized, tokens, ['o que voce faz', 'como voce ajuda', 'capacidades', 'como funciona', 'o que consegue'])) return 'capabilities';
  if (hasAny(normalized, tokens, ['aprendizado', 'treino', 'feedback', 'avaliacao', 'aprendeu', 'memoria'])) return 'memory';
  if (hasAny(normalized, tokens, ['comparar', 'compara', 'comparativo', 'versus', 'contra', 'ranking', 'melhor', 'pior', 'cruze', 'cruzar'])) return 'compare';
  if (hasAny(normalized, tokens, ['faz sentido', 'adequado', 'serve', 'usar', 'aderencia', 'recomendacao'])) return 'assess';
  if (hasAny(normalized, tokens, ['onde', 'abrir', 'buscar', 'encontrar', 'traga', 'mostre relatorio'])) return 'find';
  if (hasAny(normalized, tokens, ['ajuda', 'guie', 'orienta', 'como faco', 'como faço'])) return 'guide';
  return 'show';
};

const extractYears = (question: string) =>
  Array.from(new Set(Array.from(question.matchAll(/\b(20[2-3][0-9])\b/g)).map((match) => Number(match[1]))))
    .filter((year) => year >= 2022 && year <= 2026);

const extractAliasMatches = (normalized: string, aliases: Record<string, string[]>) =>
  Object.entries(aliases)
    .filter(([, terms]) => terms.some((term) => normalized.includes(normalizeIrisText(term))))
    .map(([id]) => id);

export const perceiveIrisRequest = (
  question: string,
  pageContext?: ChatPageContext | null
): IrisPerception => {
  const normalizedQuestion = normalizeIrisText(question);
  const tokens = tokenizeIrisText(question);
  const companies = extractAliasMatches(normalizedQuestion, companyAliases);
  const indicators = extractAliasMatches(normalizedQuestion, indicatorAliases);

  return {
    normalizedQuestion,
    tokens,
    action: inferAction(normalizedQuestion, tokens),
    years: extractYears(question),
    companies,
    indicators,
    wantsCompanyComparison:
      companies.length > 1 || hasAny(normalizedQuestion, tokens, ['empresa', 'empresas', 'distribuidora', 'distribuidoras', 'grupo', 'ranking']),
    wantsIndicatorComparison:
      indicators.length > 1 || hasAny(normalizedQuestion, tokens, ['indicadores', 'kpis', 'cruze', 'cruzar', 'relacao', 'correlacao']),
    isNavigationLike: hasAny(normalizedQuestion, tokens, ['onde', 'abrir', 'acessar', 'entrar', 'ir para', 'caminho', 'tela', 'menu']),
    pageContext
  };
};
