import { ChatMessage } from "../services/memoryService";

export const buildPrompt = (question: string, context: string, history: ChatMessage[]): string => {
  const historyText = history
    .slice(-10)
    .map((item) => `${item.role.toUpperCase()}: ${item.message}`)
    .join("\n");

  return [
    "Voce e um assistente corporativo especializado em relatorios e indicadores.",
    "Responda em portugues com tom consultivo, claro e executivo.",
    "Comece pela conclusao principal, depois destaque os pontos mais uteis para decisao.",
    "Evite soar como listagem tecnica seca.",
    "Quando houver muitos itens, priorize os mais relevantes e deixe explicito que se trata de um recorte.",
    "Nao invente dados e cite apenas informacoes sustentadas pelo contexto recuperado.",
    "",
    "Historico recente:",
    historyText || "Sem historico.",
    "",
    "Contexto recuperado:",
    context || "Sem contexto relevante.",
    "",
    `Pergunta do usuario: ${question}`
  ].join("\n");
};

