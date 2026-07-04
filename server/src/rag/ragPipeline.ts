import { env } from "../config/env";
import { cacheService } from "../services/cacheService";
import { rerankService } from "../services/rerankService";
import { vectorSearchService } from "../services/vectorSearchService";
import { buildContext } from "./contextBuilder";
import { buildPrompt } from "./promptBuilder";
import { ChatMessage } from "../services/memoryService";
import { reportCatalogService } from "../services/reportCatalogService";
import { CatalogJsonDoc, reportCatalogFileQueryService } from "../services/reportCatalogFileQueryService";
import { chatQueryInterpreter } from "../services/chatQueryInterpreter";
import { canUserAccessHierarchy, userHasGlobalCatalogAccess } from "../services/reportVisibilityService";

const normalize = (text: string): string =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isGreeting = (question: string): boolean => {
  const q = normalize(question);
  return ["oi", "ola", "bom dia", "boa tarde", "boa noite", "e ai"].some((g) => q.includes(g));
};

const asksCapabilities = (question: string): boolean => {
  const q = normalize(question);
  return (
    q.includes("o que voce faz") ||
    q.includes("como voce ajuda") ||
    q.includes("capacidades") ||
    q.includes("como funciona")
  );
};

const shouldCrossReportsByIndicator = (question: string): boolean => {
  const q = normalize(question);
  return (
    (q.includes("relatorio") || q.includes("relatorios")) &&
    (q.includes("indicador") || q.includes("indicadores") || q.includes("tem") || q.includes("possui") || q.includes("quais"))
  );
};

const hasHierarchyFilter = (question: string): boolean => {
  const q = normalize(question);
  return (
    q.includes("empresa") ||
    q.includes("superintendencia") ||
    q.includes("gerencia") ||
    q.includes("unidade") ||
    q.includes("projeto")
  );
};

const isReportLookupIntent = (question: string): boolean => {
  const q = normalize(question);
  return (
    q.includes("relatorio") ||
    q.includes("relatorios") ||
    q.includes("descricao") ||
    q.includes("descreva") ||
    q.includes("resuma") ||
    q.includes("quero saber")
  );
};

const isDirectIdentifierLookup = (question: string): boolean => {
  const q = normalize(question).trim();
  return /^(ind|rep|mock|manual)-[a-z0-9-]+$/.test(q) || q.startsWith("ind-") || q.startsWith("rep-");
};

const isIndicatorOnlyQuery = (question: string): boolean => {
  const q = normalize(question).trim();
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 4) return false;
  return !isGreeting(question) && !asksCapabilities(question);
};

const isShortIndicatorKeyword = (question: string): boolean => {
  const q = normalize(question).trim();
  return /^(ind-[a-z0-9-]+|[a-z]{2,8}|[a-z]{2,8}-[a-z0-9-]+)$/.test(q);
};

const asksMetrics = (question: string): boolean => {
  const q = normalize(question);
  return (
    q.includes("metrica") ||
    q.includes("metricas") ||
    q.includes("views") ||
    q.includes("visualiz") ||
    q.includes("curtida") ||
    q.includes("like") ||
    q.includes("coment") ||
    q.includes("share") ||
    q.includes("compart")
  );
};

const extractIndicatorMatches = (question: string, knownIndicators: string[]): string[] => {
  const nq = normalize(question);
  const qTokens = new Set(nq.split(/\s+/).filter(Boolean));

  return knownIndicators.filter((name) => {
    const nName = normalize(name);
    if (nq.includes(nName)) return true;
    const nameTokens = nName.split(/\s+/).filter(Boolean);
    const overlap = nameTokens.filter((t) => qTokens.has(t)).length;
    return overlap >= Math.max(1, Math.ceil(nameTokens.length * 0.5));
  });
};

const buildHistoryHints = (history: ChatMessage[]): string => {
  const recent = history
    .filter((m) => m.role === "user")
    .slice(-3)
    .map((m) => m.message.trim())
    .filter(Boolean);
  if (recent.length === 0) return "";
  return recent.join(" | ");
};

const getLastUserQuestion = (history: ChatMessage[]): string => {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const message = history[index];
    if (message.role === "user" && message.message.trim()) {
      return message.message.trim();
    }
  }
  return "";
};

const isShortFollowUp = (question: string): boolean => {
  const q = normalize(question).trim();
  if (!q) return false;

  const tokens = q.split(/\s+/).filter(Boolean);
  return (
    tokens.length <= 6 &&
    (
      q.startsWith("e ") ||
      q.startsWith("e da ") ||
      q.startsWith("e de ") ||
      q.includes("dessa") ||
      q.includes("desse") ||
      q.includes("deles") ||
      q.includes("delas") ||
      q.includes("qual deles") ||
      q.includes("filtra") ||
      q.includes("refina") ||
      q.includes("agora da") ||
      q.includes("so da") ||
      q.includes("somente da")
    )
  );
};

const enrichQuestionWithHistory = (question: string, history: ChatMessage[]): string => {
  if (!isShortFollowUp(question)) return question;

  const lastQuestion = getLastUserQuestion(history.slice(0, -1));
  if (!lastQuestion) return question;

  return `${lastQuestion}\nRefinamento do usuario: ${question}`;
};

const buildNextStepSuggestions = (sources: Array<Record<string, unknown>>): string[] => {
  if (sources.length === 0) {
    return [
      "Proximo passo sugerido: posso tentar novamente com filtro por empresa, indicador, periodo ou parte da descricao."
    ];
  }

  const uniquePaths = new Set(
    sources
      .map((source) => (Array.isArray(source.path) ? source.path.filter(Boolean).join(" > ") : ""))
      .filter(Boolean)
  );

  return [
    uniquePaths.size > 1
      ? "Proximo passo sugerido: posso comparar esses resultados por empresa ou nivel da hierarquia."
      : "Proximo passo sugerido: posso detalhar esse resultado por indicador, periodo ou hierarquia.",
    "Tambem posso restringir para os relatorios mais recentes ou resumir um item especifico."
  ];
};

const buildHierarchySource = (input: {
  companyId?: string;
  superintendenceId?: string;
  managementId?: string;
  projectId?: string;
}) => ({
  companyId: input.companyId,
  superintendenceId: input.superintendenceId,
  managementId: input.managementId,
  projectId: input.projectId
});

const formatReportDate = (value?: string | null): string => {
  if (!value) return "sem data";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("pt-BR").format(new Date(parsed));
};

const summarizeIndicators = (indicatorNames: string[], focusTerms: string[] = [], limit = 3): string => {
  if (indicatorNames.length === 0) return "sem indicadores";

  const normalizedFocusTerms = focusTerms.map((term) => normalize(term)).filter(Boolean);
  const prioritized = indicatorNames.filter((name) =>
    normalizedFocusTerms.some((term) => normalize(name).includes(term) || term.includes(normalize(name)))
  );
  const extras = indicatorNames.filter((name) => !prioritized.includes(name));
  const ordered = [...prioritized, ...extras];
  const visible = ordered.slice(0, limit);
  const suffix = ordered.length > visible.length ? ` +${ordered.length - visible.length}` : "";
  return `${visible.join(", ")}${suffix}`;
};

const buildDistributionSummary = (rows: Array<{ company_name?: string | null }>): string => {
  const grouped = new Map<string, number>();
  rows.forEach((row) => {
    const company = row.company_name?.trim() || "Sem empresa";
    grouped.set(company, (grouped.get(company) ?? 0) + 1);
  });

  return Array.from(grouped.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([company, count]) => `${company}: ${count}`)
    .join(" | ");
};

const buildConsultiveAnswer = (input: {
  headline: string;
  signal?: string;
  lead?: string;
  bullets?: string[];
  overflowNote?: string;
  nextStep?: string;
}) =>
  [
    input.headline,
    input.signal ? `Leitura rapida: ${input.signal}` : "",
    input.lead ?? "",
    ...(input.bullets ?? []),
    input.overflowNote ?? "",
    input.nextStep ? `Proximo passo sugerido: ${input.nextStep}` : ""
  ]
    .filter(Boolean)
    .join("\n");

const buildReportSource = (
  row: {
    source_report_id?: string | null;
    report_name: string;
    report_description?: string | null;
    report_date?: string | null;
    company_id?: string;
    company_name?: string;
    superintendence_id?: string;
    superintendence_name?: string;
    management_id?: string;
    management_name?: string;
    project_id?: string;
    project_name?: string;
    indicator_names?: string[];
    path?: string[];
    score?: number;
  },
  index: number,
  focusTerms: string[] = []
) => ({
  type: "report",
  id: row.source_report_id ?? `report-${index}`,
  name: row.report_name,
  description: row.report_description?.trim() || `Relatorio catalogado em ${row.company_name ?? "hierarquia nao identificada"}.`,
  meta: [
    row.company_name,
    formatReportDate(row.report_date),
    `Indicadores: ${summarizeIndicators(row.indicator_names ?? [], focusTerms)}`
  ]
    .filter(Boolean)
    .join(" | "),
  path:
    row.path && row.path.length > 0
      ? row.path
      : [row.company_name, row.superintendence_name, row.management_name, row.project_name].filter(Boolean),
  relevance_score: row.score,
  hierarchy: buildHierarchySource({
    companyId: row.company_id,
    superintendenceId: row.superintendence_id,
    managementId: row.management_id,
    projectId: row.project_id
  })
});

const buildIndicatorSource = (
  item: {
    indicatorName: string;
    reports: number;
    latestReport: string | null;
    companyName: string;
    companyId: string;
  },
  index: number
) => ({
  type: "indicator",
  id: `company-indicator-${index}`,
  name: item.indicatorName,
  description: `${item.reports} relatorio(s) catalogado(s) para esse indicador.`,
  meta: [item.companyName, item.latestReport ? `Ultimo relatorio em ${formatReportDate(item.latestReport)}` : "Sem data de relatorio"]
    .filter(Boolean)
    .join(" | "),
  path: [item.companyName, item.indicatorName],
  relevance_score: item.reports,
  hierarchy: buildHierarchySource({
    companyId: item.companyId
  })
});

const localAnswer = (question: string, context: string, history: ChatMessage[]): string => {
  if (!context.trim()) {
    return "Nao encontrei contexto suficiente para uma resposta confiavel. Se voce me passar empresa, indicador, periodo ou parte do nome do relatorio, eu consigo refinar melhor.";
  }

  const sections = context.split("\n\n").slice(0, 4);
  const bullets = sections.map((section) => `- ${section.replace(/^Fonte \d+ \([^)]+\):\s*/, "")}`);
  const hint = buildHistoryHints(history);

  return buildConsultiveAnswer({
    headline: `Minha leitura para a sua pergunta "${question}" e a seguinte:` ,
    signal: "consolidei apenas o contexto mais relevante recuperado dos relatorios.",
    lead: "Pontos que merecem atencao:",
    bullets,
    overflowNote: hint ? `Contexto recente considerado: ${hint}` : "",
    nextStep: "posso transformar isso em um recorte por empresa, indicador, periodo ou relatorio especifico."
  });
};

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 20000): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const generateWithOllama = async (prompt: string): Promise<string | null> => {
  const response = await fetchWithTimeout(
    `${env.OLLAMA_URL.replace(/\/$/, "")}/api/chat`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "Voce e a IRIS, assistente corporativa de analise de relatorios. Responda em portugues com tom consultivo e executivo, comece pela principal conclusao, priorize clareza, nao invente dados e so use o que estiver sustentado pelas fontes."
          },
          { role: "user", content: prompt }
        ],
        options: { temperature: 0.2 }
      })
    },
    25000
  );

  if (!response.ok) return null;
  const payload = (await response.json()) as { message?: { content?: string } };
  const content = payload.message?.content?.trim();
  return content && content.length > 0 ? content : null;
};

const generateWithOpenAi = async (prompt: string): Promise<string | null> => {
  if (!env.OPENAI_API_KEY) return null;

  const response = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: env.OPENAI_CHAT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "Voce e a IRIS, assistente corporativa de analise de relatorios. Responda em portugues com tom consultivo e executivo, comece pela principal conclusao, priorize clareza, nao invente dados e so use o que estiver sustentado pelas fontes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2
      })
    },
    20000
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  return content && content.length > 0 ? content : null;
};

const generateAnswerWithLlm = async (prompt: string, fallback: string): Promise<string> => {
  try {
    if (env.LLM_PROVIDER === "local") return fallback;

    if (env.LLM_PROVIDER === "ollama") {
      return (await generateWithOllama(prompt)) ?? fallback;
    }

    if (env.LLM_PROVIDER === "openai") {
      return (await generateWithOpenAi(prompt)) ?? fallback;
    }

    const autoLocal = await generateWithOllama(prompt);
    if (autoLocal) return autoLocal;

    const autoOpenAi = await generateWithOpenAi(prompt);
    if (autoOpenAi) return autoOpenAi;

    return fallback;
  } catch {
    return fallback;
  }
};

export interface RagResponse {
  answer: string;
  sources: Array<Record<string, unknown>>;
  cached: boolean;
  totalSources?: number;
}

type ChatUserScope = {
  id?: string;
  company_id?: string;
  company_name?: string;
  superintendence_id?: string;
  superintendence_name?: string;
  management_id?: string;
  management_name?: string;
  project_id?: string;
  project_name?: string;
  roles?: string[];
};

const filterCatalogRowsForUser = <T extends {
  company_id?: string;
  company_name?: string;
  superintendence_id?: string;
  superintendence_name?: string;
  management_id?: string;
  management_name?: string;
  project_id?: string;
  project_name?: string;
}>(rows: T[], user?: ChatUserScope | null): T[] => {
  if (!user || userHasGlobalCatalogAccess(user)) return rows;
  return rows.filter((row) =>
    canUserAccessHierarchy(user, {
      companyId: row.company_id,
      companyName: row.company_name,
      superintendenceId: row.superintendence_id,
      superintendenceName: row.superintendence_name,
      managementId: row.management_id,
      managementName: row.management_name,
      projectId: row.project_id,
      projectName: row.project_name
    })
  );
};

const filterFileMatchesForUser = (
  matches: Array<{ doc: CatalogJsonDoc; score: number }>,
  user?: ChatUserScope | null
) => {
  if (!user || userHasGlobalCatalogAccess(user)) return matches;
  return matches.filter(({ doc }) =>
    canUserAccessHierarchy(user, {
      companyId: doc.hierarchy.company.id,
      companyName: doc.hierarchy.company.name,
      superintendenceId: doc.hierarchy.superintendence.id,
      superintendenceName: doc.hierarchy.superintendence.name,
      managementId: doc.hierarchy.management.id,
      managementName: doc.hierarchy.management.name,
      projectId: doc.hierarchy.project.id,
      projectName: doc.hierarchy.project.name
    })
  );
};

export const ragPipeline = {
  async run(question: string, history: ChatMessage[], user?: ChatUserScope | null): Promise<RagResponse> {
    const effectiveQuestion = enrichQuestionWithHistory(question, history);
    const hasGlobalAccess = userHasGlobalCatalogAccess(user);
    const [knownIndicators, knownCompanies] = await Promise.all([
      reportCatalogService.listKnownIndicators().catch(() => []),
      reportCatalogService.listKnownCompanies().catch(() => [])
    ]);
    const interpreted = chatQueryInterpreter.interpret(effectiveQuestion, knownIndicators, knownCompanies);

    if (interpreted.isGreeting || isGreeting(question)) {
      return {
        answer:
          "Ola. Sou a IRIS. Posso te ajudar a encontrar relatorios, cruzar indicadores e resumir rapidamente o que importa para decisao. Se quiser, ja me diga um indicador, uma empresa ou um tema.",
        sources: [],
        cached: false
      };
    }

    if (interpreted.isThanks) {
      return {
        answer: "Perfeito. Se fizer sentido, no proximo passo eu posso refinar isso por empresa, indicador, periodo ou nivel da hierarquia.",
        sources: [],
        cached: false
      };
    }

    if (interpreted.asksCapabilities || asksCapabilities(question)) {
      return {
        answer:
          "Eu consigo localizar relatorios por indicador ou tema, resumir conteudo com base nas fontes visiveis para voce, comparar resultados entre empresas ou niveis da hierarquia e manter o contexto da conversa para ir refinando a analise.",
        sources: [],
        cached: false
      };
    }

    if (interpreted.wantsCompanyIndicators && interpreted.matchedCompanies.length > 0) {
      const companyName = interpreted.matchedCompanies[0];
      if (!hasGlobalAccess && normalize(user?.company_name ?? "") !== normalize(companyName)) {
        return {
          answer: `Encontrei referencia a ${companyName}, mas ela nao esta na hierarquia visivel para sua conta.`,
          sources: [],
          cached: false
        };
      }
      const indicators = await reportCatalogService.listIndicatorsByCompany(companyName).catch(() => []);

      if (indicators.length > 0) {
        const preview = indicators.slice(0, 12);
        const lines = preview.map((item) => {
          const latest = item.latestReport ? `ultimo relatorio em ${formatReportDate(item.latestReport)}` : "sem data de relatorio";
          return `- ${item.indicatorName} | ${item.reports} relatorio(s) | ${latest}`;
        });

        return {
          answer: buildConsultiveAnswer({
            headline: `${companyName} possui ${indicators.length} indicador(es) com relatorios catalogados.`,
            signal:
              indicators.length > preview.length
                ? `destaquei ${preview.length} indicadores com mais atividade para manter a leitura objetiva.`
                : "segue abaixo a visao consolidada dos indicadores encontrados.",
            lead: "Indicadores em evidenca:",
            bullets: lines,
            overflowNote:
              indicators.length > preview.length
                ? `Ha mais ${indicators.length - preview.length} indicador(es) alem deste recorte.`
                : "",
            nextStep: "posso abrir agora os relatorios de um indicador especifico dessa empresa."
          }),
          sources: indicators.slice(0, 8).map((item, index) => buildIndicatorSource(item, index)),
          cached: false,
          totalSources: indicators.length
        };
      }
    }

    if (
      interpreted.requestedIndicatorTerms.length > 0 &&
      (interpreted.wantsReportsByIndicators || interpreted.wantsIndicators)
    ) {
      const rows = await reportCatalogService.findReportsByIndicatorTerms([
        ...interpreted.requestedIndicatorTerms,
        ...interpreted.matchedIndicators
      ]).catch(() => []);
      const visibleRows = filterCatalogRowsForUser(rows, user);

      if (visibleRows.length > 0) {
        const requestedTerms =
          interpreted.matchedIndicators.length > 0 ? interpreted.matchedIndicators : interpreted.requestedIndicatorTerms;
        const distribution = buildDistributionSummary(visibleRows);
        const previewRows = visibleRows.slice(0, 6);
        const listedRows = previewRows.map((row) => {
          const date = formatReportDate(row.report_date);
          return `- ${row.report_name} (${row.company_name}, ${date}) | foco: ${summarizeIndicators(row.indicator_names ?? [], requestedTerms)}`;
        });

        return {
          answer: buildConsultiveAnswer({
            headline: `Encontrei ${visibleRows.length} relatorios associados aos indicadores ${requestedTerms.join(", ")}.`,
            signal: distribution ? `distribuicao atual por empresa: ${distribution}.` : "",
            lead:
              previewRows.length < visibleRows.length
                ? `Para manter a resposta util, destaquei os ${previewRows.length} mais relevantes:`
                : "Relatorios encontrados:",
            bullets: listedRows,
            overflowNote:
              previewRows.length < visibleRows.length
                ? `Ainda ha mais ${visibleRows.length - previewRows.length} resultado(s) alem deste recorte.`
                : "",
            nextStep: "posso refinar por empresa, ou isolar apenas um dos indicadores consultados."
          }),
          sources: visibleRows.slice(0, 8).map((row, index) => buildReportSource(row, index, requestedTerms)),
          cached: false,
          totalSources: visibleRows.length
        };
      }
    }

    // Direct indicator query from JSON catalog files (ex: "DEC", "FEC", "Conexoes GD", "ind-gd")
    if (isIndicatorOnlyQuery(effectiveQuestion)) {
      const indicatorTerms = interpreted.requestedIndicatorTerms.length > 0
        ? interpreted.requestedIndicatorTerms
        : effectiveQuestion.split(/\s+/).filter(Boolean);
      const indicatorFileMatches = filterFileMatchesForUser(
        await reportCatalogFileQueryService.searchByIndicatorsStrict(indicatorTerms, 12).catch(() => []),
        user
      );
      if (indicatorFileMatches.length > 0) {
        const previewMatches = indicatorFileMatches.slice(0, 6);
        const lines = previewMatches.map(({ doc }) => {
          const indicators = summarizeIndicators((doc.indicators ?? []).map((i) => i.name), indicatorTerms);
          const hierarchy = `${doc.hierarchy.company.name} > ${doc.hierarchy.superintendence.name} > ${doc.hierarchy.management.name} > ${doc.hierarchy.project.name}`;
          return `- ID: ${doc.source_report_id} | Nome: ${doc.report.name} | Indicadores: ${indicators} | Hierarquia: ${hierarchy}`;
        });

        return {
          answer: buildConsultiveAnswer({
            headline: `Encontrei ${indicatorFileMatches.length} relatorios relacionados ao indicador informado.`,
            signal:
              previewMatches.length < indicatorFileMatches.length
                ? `listei apenas os ${previewMatches.length} mais aderentes para acelerar sua leitura.`
                : "estes sao os resultados mais aderentes encontrados.",
            lead: "Destaques:",
            bullets: lines,
            overflowNote:
              previewMatches.length < indicatorFileMatches.length
                ? `Ha mais ${indicatorFileMatches.length - previewMatches.length} resultado(s) alem deste recorte.`
                : "",
            nextStep: "se quiser, eu posso filtrar agora por empresa ou por uma parte do nome do relatorio."
          }),
          sources: indicatorFileMatches.slice(0, 8).map(({ doc, score }, index) => ({
            type: "report",
            id: doc.source_report_id || `indicator-file-${index}`,
            name: doc.report.name,
            description: doc.report.description || `Relatorio associado ao indicador consultado em ${doc.hierarchy.company.name}.`,
            meta: [
              doc.hierarchy.company.name,
              formatReportDate(doc.report.date),
              `Indicadores: ${summarizeIndicators((doc.indicators ?? []).map((i) => i.name), indicatorTerms)}`
            ].join(" | "),
            path:
              doc.path ??
              [doc.hierarchy.company.name, doc.hierarchy.superintendence.name, doc.hierarchy.management.name, doc.hierarchy.project.name],
            relevance_score: score,
            hierarchy: buildHierarchySource({
              companyId: doc.hierarchy.company.id,
              superintendenceId: doc.hierarchy.superintendence.id,
              managementId: doc.hierarchy.management.id,
              projectId: doc.hierarchy.project.id
            })
          })),
          cached: false,
          totalSources: indicatorFileMatches.length
        };
      }

      if (isShortIndicatorKeyword(effectiveQuestion)) {
        return {
          answer:
            `Nao encontrei resultados para "${question}" nos JSONs de catalogo. Verifique se o indicador existe no campo indicators.name ou indicators.id.`,
          sources: [],
          cached: false
        };
      }
    }

    // Indicator-only lookup: user may ask just by indicator name/code (no hierarchy filters)
    const matchedIndicatorOnly = extractIndicatorMatches(effectiveQuestion, knownIndicators);
    if (matchedIndicatorOnly.length > 0 && !hasHierarchyFilter(effectiveQuestion)) {
      const rows = await reportCatalogService.findReportsByIndicators(matchedIndicatorOnly).catch(() => []);
      const visibleRows = filterCatalogRowsForUser(rows, user);
      if (visibleRows.length > 0) {
        const summary = buildDistributionSummary(visibleRows);
        const previewRows = visibleRows.slice(0, 6);

        const lines = previewRows.map((row) => {
          const date = formatReportDate(row.report_date);
          return `- ${row.report_name} (${row.company_name}, ${date}) | foco: ${summarizeIndicators(row.indicator_names, matchedIndicatorOnly)}`;
        });

        return {
          answer: buildConsultiveAnswer({
            headline: `Encontrei ${visibleRows.length} relatorios para o(s) indicador(es): ${matchedIndicatorOnly.join(", ")}.`,
            signal: `distribuicao atual por empresa: ${summary}.`,
            lead:
              previewRows.length < visibleRows.length
                ? `Separei ${previewRows.length} resultados mais relevantes para leitura rapida:`
                : "Relatorios encontrados:",
            bullets: lines,
            overflowNote:
              previewRows.length < visibleRows.length
                ? `Ainda ha mais ${visibleRows.length - previewRows.length} resultado(s) fora deste recorte.`
                : "",
            nextStep: "posso refinar por empresa, periodo ou abrir diretamente um dos relatorios."
          }),
          sources: visibleRows.slice(0, 8).map((row, index) => buildReportSource(row, index, matchedIndicatorOnly)),
          cached: false,
          totalSources: visibleRows.length
        };
      }
    }

    if (asksMetrics(effectiveQuestion)) {
      const metricMatches = filterFileMatchesForUser(
        await reportCatalogFileQueryService.search(effectiveQuestion, 10).catch(() => []),
        user
      );
      if (metricMatches.length > 0) {
        const lines = metricMatches.slice(0, 10).map(({ doc }) => {
          const hierarchy = `${doc.hierarchy.company.name} > ${doc.hierarchy.superintendence.name} > ${doc.hierarchy.management.name} > ${doc.hierarchy.project.name}`;
          return `- ID: ${doc.source_report_id} | Nome: ${doc.report.name} | Hierarquia: ${hierarchy} | views=${doc.metrics?.views ?? 0}, likes=${doc.metrics?.likes ?? 0}, comments=${doc.metrics?.comments ?? 0}, shares=${doc.metrics?.shares ?? 0}`;
        });

        return {
          answer: ["Métricas encontradas diretamente nos JSONs de relatórios:", ...lines].join("\n"),
          sources: metricMatches.slice(0, 10).map(({ doc, score }, index) => ({
            type: "report",
            id: doc.source_report_id || `metric-${index}`,
            name: doc.report.name,
            path:
              doc.path ??
              [doc.hierarchy.company.name, doc.hierarchy.superintendence.name, doc.hierarchy.management.name, doc.hierarchy.project.name],
            relevance_score: score,
            hierarchy: buildHierarchySource({
              companyId: doc.hierarchy.company.id,
              superintendenceId: doc.hierarchy.superintendence.id,
              managementId: doc.hierarchy.management.id,
              projectId: doc.hierarchy.project.id
            })
          })),
          cached: false
        };
      }
    }

    if (shouldCrossReportsByIndicator(effectiveQuestion)) {
      const matchedIndicators = extractIndicatorMatches(effectiveQuestion, knownIndicators);

      if (matchedIndicators.length > 0) {
        const rows = await reportCatalogService.findReportsByIndicators(matchedIndicators);
        const visibleRows = filterCatalogRowsForUser(rows, user);
        if (visibleRows.length > 0) {
          const grouped = new Map<string, number>();
          visibleRows.forEach((row) => grouped.set(row.company_name, (grouped.get(row.company_name) ?? 0) + 1));
          const summary = Array.from(grouped.entries())
            .map(([company, count]) => `${company}: ${count}`)
            .join(" | ");

          const lines = visibleRows.slice(0, 12).map((row) => {
            const indicators = row.indicator_names.join(", ");
            const date = row.report_date ?? "sem data";
            return `- ${row.report_name} (${row.company_name}, ${date}) | indicadores: ${indicators}`;
          });

          return {
            answer: [
              `Encontrei ${visibleRows.length} relatorios relacionados: ${matchedIndicators.join(", ")}.`,
              `Distribuicao por empresa: ${summary}`,
              "Principais resultados:",
              ...lines
            ].join("\n"),
            sources: visibleRows.slice(0, 8).map((row, index) => ({
              type: "report",
              id: row.source_report_id ?? `catalog-${index}`,
              name: row.report_name,
              path: row.path ?? [row.company_name, row.superintendence_name, row.management_name, row.project_name],
              relevance_score: 1,
              hierarchy: buildHierarchySource({
                companyId: row.company_id,
                superintendenceId: row.superintendence_id,
                managementId: row.management_id,
                projectId: row.project_id
              })
            })),
            cached: false
          };
        }
      }
    }

    const { cached, embedding } = await cacheService.getCachedAnswer(effectiveQuestion);
    if (hasGlobalAccess && cached) {
      return {
        answer: cached.answer,
        sources: cached.sources,
        cached: true
      };
    }

    const catalogRows = filterCatalogRowsForUser(
      await reportCatalogService.searchReportsByText(effectiveQuestion, 15).catch(() => []),
      user
    );
    if (catalogRows.length > 0 && (isReportLookupIntent(effectiveQuestion) || isDirectIdentifierLookup(effectiveQuestion))) {
      const q = normalize(effectiveQuestion);
      const wantsDescription = q.includes("descricao") || q.includes("descreva") || q.includes("resuma");
      const wantsList = q.includes("quais") || q.includes("listar") || q.includes("lista");

      const lines = catalogRows.slice(0, 10).map((row) => {
        const hierarchy = `${row.company_name} > ${row.superintendence_name} > ${row.management_name} > ${row.project_name}`;
        const description = (row.report_description ?? "").trim();
        const shortDesc = description.length > 180 ? `${description.slice(0, 180)}...` : description;
        const inds = (row.indicator_names ?? []).join(", ");
        const parts = [
          `ID: ${row.source_report_id}`,
          `Nome: ${row.report_name}`,
          `Hierarquia: ${hierarchy}`,
          `Indicadores: ${inds}`
        ];
        if (wantsDescription || !wantsList) {
          parts.push(`Descricao: ${shortDesc || "sem descricao cadastrada"}`);
        }
        return `- ${parts.join(" | ")}`;
      });

      const sources = catalogRows.slice(0, 10).map((row, index) => ({
        type: "report",
        id: row.source_report_id ?? `catalog-${index}`,
        name: row.report_name,
        path: row.path ?? [row.company_name, row.superintendence_name, row.management_name, row.project_name],
        relevance_score: row.score,
        hierarchy: buildHierarchySource({
          companyId: row.company_id,
          superintendenceId: row.superintendence_id,
          managementId: row.management_id,
          projectId: row.project_id
        })
      }));

      const answer = [
        `Encontrei ${catalogRows.length} relatorios aderentes ao seu pedido.`,
        "Minha melhor leitura inicial e esta:",
        ...lines,
        ...buildNextStepSuggestions(sources)
      ].join("\n");

      if (hasGlobalAccess) {
        await cacheService.save(effectiveQuestion, embedding, { answer, sources });
      }
      return { answer, sources, cached: false };
    }

    if ((isReportLookupIntent(effectiveQuestion) || isDirectIdentifierLookup(effectiveQuestion)) && catalogRows.length === 0) {
      const fileMatches = filterFileMatchesForUser(
        await reportCatalogFileQueryService.search(effectiveQuestion, 10).catch(() => []),
        user
      );
      if (fileMatches.length > 0) {
        const withMetrics = asksMetrics(effectiveQuestion);
        const lines = fileMatches.slice(0, 8).map(({ doc }) => {
          const hierarchy = `${doc.hierarchy.company.name} > ${doc.hierarchy.superintendence.name} > ${doc.hierarchy.management.name} > ${doc.hierarchy.project.name}`;
          const indicators = (doc.indicators ?? []).map((i) => i.name).join(", ");
          const parts = [
            `ID: ${doc.source_report_id}`,
            `Nome: ${doc.report.name}`,
            `Hierarquia: ${hierarchy}`,
            `Indicadores: ${indicators || "sem indicadores"}`
          ];
          if (withMetrics) {
            parts.push(
              `Metricas: views=${doc.metrics?.views ?? 0}, likes=${doc.metrics?.likes ?? 0}, comments=${doc.metrics?.comments ?? 0}, shares=${doc.metrics?.shares ?? 0}`
            );
          } else {
            parts.push(`Descricao: ${(doc.report.description || "sem descricao").slice(0, 220)}`);
          }
          return `- ${parts.join(" | ")}`;
        });

        const sources = fileMatches.slice(0, 8).map(({ doc, score }, index) => ({
          type: "report",
          id: doc.source_report_id || `file-${index}`,
          name: doc.report.name,
          path:
            doc.path ??
            [doc.hierarchy.company.name, doc.hierarchy.superintendence.name, doc.hierarchy.management.name, doc.hierarchy.project.name],
          relevance_score: score,
          hierarchy: buildHierarchySource({
            companyId: doc.hierarchy.company.id,
            superintendenceId: doc.hierarchy.superintendence.id,
            managementId: doc.hierarchy.management.id,
            projectId: doc.hierarchy.project.id
          })
        }));

        return {
          answer: [
            `Encontrei ${fileMatches.length} relatorios no catalogo local disponivel para consulta.`,
            ...lines,
            ...buildNextStepSuggestions(sources)
          ].join("\n"),
          sources,
          cached: false
        };
      }

      return {
        answer:
          "Nao encontrei relatorios aderentes com os termos atuais. Se voce me passar empresa, superintendencia, gerencia, unidade, indicador ou um trecho da descricao, eu consigo fazer uma busca mais precisa.",
        sources: [],
        cached: false
      };
    }

    if (!hasGlobalAccess) {
      return {
        answer:
          "Nao encontrei relatorios visiveis para a sua hierarquia com os termos informados. Posso tentar um refinamento por empresa, superintendencia, gerencia, unidade ou indicador para aumentar a precisao.",
        sources: [],
        cached: false
      };
    }

    const historyHints = buildHistoryHints(history);
    const enrichedQuestion = historyHints ? `${effectiveQuestion}\nContexto anterior: ${historyHints}` : effectiveQuestion;
    const search = await vectorSearchService.search(enrichedQuestion, 10);
    const reranked = rerankService.rerank(effectiveQuestion, search.results).slice(0, 8);
    const context = buildContext(reranked, 8);
    const prompt = buildPrompt(effectiveQuestion, context, history);
    const fallback = localAnswer(effectiveQuestion, context, history);
    const answer = await generateAnswerWithLlm(prompt, fallback);

    const sources = reranked.slice(0, 6).map((item, index) => ({
      type: "report",
      id: item.id ?? `chunk-${index}`,
      name: String(item.metadata?.["title"] ?? "Relatorio"),
      path: [String(item.metadata?.["sourceFile"] ?? "fonte_local"), String(item.metadata?.["chunkIndex"] ?? index)],
      relevance_score: Number(item.score ?? 0)
    }));

    await cacheService.save(effectiveQuestion, embedding, { answer, sources });

    return { answer, sources, cached: false };
  }
};
