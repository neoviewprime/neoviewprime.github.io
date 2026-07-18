const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const stopWords = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "com",
  "para",
  "por",
  "a",
  "o",
  "as",
  "os"
]);

const knownIndicatorAliases: Record<string, string[]> = {
  iar: ["iar", "i a r"],
  ipce: ["ipce", "i p c e"],
  dce: ["dce", "d c e"],
  dec: ["dec", "duracao equivalente por consumidor"],
  fec: ["fec", "frequencia equivalente por consumidor"],
  gd: ["gd", "geracao distribuida"],
  sla: ["sla", "nivel de servico", "service level agreement"],
  isqp: ["isqp", "indice de satisfacao", "indice de satisfacao com a qualidade percebida"],
  tma: ["tma", "tempo medio de atendimento"],
  mtbf: ["mtbf", "tempo medio entre falhas", "confiabilidade"],
  mttr: ["mttr", "tempo medio de reparo"],
  perdas: ["perdas", "perdas tecnicas", "indice de perdas"],
  cobertura: ["cobertura", "indice de cobertura"],
  disponibilidade: ["disponibilidade", "disponibilidade da rede"],
  satisfacao: ["satisfacao", "clientes corporativos", "nps"]
};

const buildAcronym = (value: string): string => {
  const tokens = normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !stopWords.has(token));

  if (tokens.length === 0) return "";

  return tokens
    .map((token) => token[0])
    .join("");
};

const splitTokens = (value: string): string[] =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const buildIndicatorAliasMap = (knownIndicators: string[]) => {
  const aliasMap = new Map<string, Set<string>>();

  knownIndicators.forEach((indicator) => {
    const normalizedIndicator = normalize(indicator).trim();
    if (!normalizedIndicator) return;

    const variants = new Set<string>();
    variants.add(normalizedIndicator);

    normalizedIndicator
      .split(/\s*-\s*/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => variants.add(part));

    const acronym = buildAcronym(indicator);
    if (acronym.length >= 2) variants.add(acronym);

    const compact = splitTokens(indicator).join("");
    if (compact.length >= 2) variants.add(compact);

    Object.entries(knownIndicatorAliases).forEach(([canonicalAlias, aliases]) => {
      if (
        canonicalAlias === acronym ||
        aliases.some((alias) => normalizedIndicator.includes(normalize(alias)))
      ) {
        aliases.forEach((alias) => variants.add(normalize(alias)));
        variants.add(canonicalAlias);
      }
    });

    aliasMap.set(indicator, variants);
  });

  return aliasMap;
};

const extractAcronymsFromQuestion = (question: string): string[] => {
  const rawTokens = question.match(/\b[A-Za-z]{2,6}\b/g) ?? [];
  return rawTokens.map((token) => normalize(token));
};

const buildRequestedTerms = (question: string): string[] => {
  const normalizedQuestion = normalize(question);
  const terms = new Set<string>();

  extractAcronymsFromQuestion(question).forEach((term) => terms.add(term));

  normalizedQuestion
    .split(/[,;/]|(?:\be\b)|(?:\bou\b)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      const compact = splitTokens(chunk).join(" ");
      if (compact.length >= 2) terms.add(compact);
      const acronym = buildAcronym(chunk);
      if (acronym.length >= 2) terms.add(acronym);
    });

  Object.entries(knownIndicatorAliases).forEach(([canonicalAlias, aliases]) => {
    if ([canonicalAlias, ...aliases].some((alias) => normalizedQuestion.includes(normalize(alias)))) {
      terms.add(canonicalAlias);
      aliases.forEach((alias) => terms.add(normalize(alias)));
    }
  });

  return Array.from(terms);
};

export interface InterpretedChatQuery {
  normalizedQuestion: string;
  wantsReportsByIndicators: boolean;
  wantsIndicators: boolean;
  wantsCompanyIndicators: boolean;
  wantsMetrics: boolean;
  isGreeting: boolean;
  asksCapabilities: boolean;
  isThanks: boolean;
  requestedIndicatorTerms: string[];
  matchedIndicators: string[];
  matchedCompanies: string[];
}

export const chatQueryInterpreter = {
  normalize,

  interpret(question: string, knownIndicators: string[], knownCompanies: string[] = []): InterpretedChatQuery {
    const normalizedQuestion = normalize(question);
    const indicatorAliasMap = buildIndicatorAliasMap(knownIndicators);
    const requestedIndicatorTerms = buildRequestedTerms(question);
    const matchedCompanies = knownCompanies.filter((company) => {
      const normalizedCompany = normalize(company);
      const simplifiedCompany = normalizedCompany.replace(/^neoenergia\s+/, "").trim();
      return (
        normalizedQuestion.includes(normalizedCompany) ||
        (simplifiedCompany.length > 0 && normalizedQuestion.includes(simplifiedCompany))
      );
    });

    const matchedIndicators = Array.from(indicatorAliasMap.entries())
      .filter(([, aliases]) =>
        requestedIndicatorTerms.some((term) => {
          const normalizedTerm = normalize(term);
          return Array.from(aliases).some(
            (alias) =>
              alias === normalizedTerm ||
              alias.includes(normalizedTerm) ||
              normalizedTerm.includes(alias)
          );
        })
      )
      .map(([indicator]) => indicator);

    const wantsReportsByIndicators =
      (normalizedQuestion.includes("relatorio") || normalizedQuestion.includes("relatorios")) &&
      (
        normalizedQuestion.includes("indicador") ||
        normalizedQuestion.includes("indicadores") ||
        normalizedQuestion.includes("associado") ||
        normalizedQuestion.includes("associados") ||
        normalizedQuestion.includes("relacionado") ||
        normalizedQuestion.includes("relacionados") ||
        normalizedQuestion.includes("ligado") ||
        normalizedQuestion.includes("ligados") ||
        normalizedQuestion.includes("tem") ||
        normalizedQuestion.includes("quais") ||
        normalizedQuestion.includes("contenha") ||
        normalizedQuestion.includes("contem") ||
        normalizedQuestion.includes("traga") ||
        normalizedQuestion.includes("liste") ||
        normalizedQuestion.includes("mostre") ||
        normalizedQuestion.includes("procure")
      );

    return {
      normalizedQuestion,
      wantsReportsByIndicators,
      wantsIndicators: normalizedQuestion.includes("indicador") || normalizedQuestion.includes("indicadores"),
      wantsCompanyIndicators:
        matchedCompanies.length > 0 &&
        (
          normalizedQuestion.includes("quais indicadores") ||
          normalizedQuestion.includes("que indicadores") ||
          normalizedQuestion.includes("indicadores") ||
          normalizedQuestion.includes("possui") ||
          normalizedQuestion.includes("tem")
        ),
      wantsMetrics:
        normalizedQuestion.includes("metrica") ||
        normalizedQuestion.includes("metricas") ||
        normalizedQuestion.includes("engajamento") ||
        normalizedQuestion.includes("visualizacao") ||
        normalizedQuestion.includes("visualizacoes") ||
        normalizedQuestion.includes("views") ||
        normalizedQuestion.includes("curtida") ||
        normalizedQuestion.includes("curtidas") ||
        normalizedQuestion.includes("likes") ||
        normalizedQuestion.includes("comentario") ||
        normalizedQuestion.includes("comentarios") ||
        normalizedQuestion.includes("comments") ||
        normalizedQuestion.includes("compartilhamento") ||
        normalizedQuestion.includes("compartilhamentos") ||
        normalizedQuestion.includes("shares"),
      isGreeting: ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai", "opa"].some((greeting) =>
        normalizedQuestion.includes(greeting)
      ),
      asksCapabilities:
        normalizedQuestion.includes("o que voce faz") ||
        normalizedQuestion.includes("como voce ajuda") ||
        normalizedQuestion.includes("o que consegue") ||
        normalizedQuestion.includes("me orienta") ||
        normalizedQuestion.includes("me guie") ||
        normalizedQuestion.includes("capacidades") ||
        normalizedQuestion.includes("como funciona"),
      isThanks: ["obrigado", "obrigada", "valeu", "vlw", "show", "perfeito"].some((token) => normalizedQuestion.includes(token)),
      requestedIndicatorTerms,
      matchedIndicators,
      matchedCompanies
    };
  }
};
