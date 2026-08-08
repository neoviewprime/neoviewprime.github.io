import type { IrisAnswer } from './types';

const englishMarkers = [
  'as an ai',
  'i can help',
  'the report',
  'the indicator',
  'you should',
  'based on'
];

const forbiddenClaims = [
  'segundo o banco de dados real',
  'confirmado no sistema de produção',
  'garanto que',
  'sem nenhuma incerteza'
];

export const validateIrisAnswer = (answer: IrisAnswer): { answer: IrisAnswer; warnings: string[] } => {
  const warnings: string[] = [];
  const normalized = answer.answer.toLowerCase();

  if (englishMarkers.some((marker) => normalized.includes(marker))) {
    warnings.push('possible-non-pt-br-response');
  }

  if (forbiddenClaims.some((claim) => normalized.includes(claim))) {
    warnings.push('overconfident-or-unsupported-claim');
  }

  const safeAnswer = answer.answer.trim()
    ? answer.answer
    : 'Não consegui montar uma resposta útil com o contexto disponível agora.';

  return {
    answer: {
      ...answer,
      answer: safeAnswer,
      confidence: Math.max(0.1, Math.min(0.99, answer.confidence)),
      totalSources: Math.max(0, answer.totalSources),
      sources: answer.sources.slice(0, 12)
    },
    warnings
  };
};
