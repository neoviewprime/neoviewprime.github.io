import { ragPipeline } from "../rag/ragPipeline";
import { memoryService } from "./memoryService";
import { getDbClient } from "../db/connection";
import { randomUUID } from "crypto";
import type { JwtPayload } from "../middleware/auth";
import { userManagementService } from "./userManagementService";

export type ChatPageContext = {
  page: "register" | "workspace" | "reports" | "approvals" | "generic";
  title: string;
  summary: string;
  hints?: string[];
};

type ContextUser = {
  id?: string;
  full_name?: string;
  email?: string;
};

type ChatFeedbackRequest = {
  sessionId?: string;
  messageId?: string;
  rating: "positive" | "negative";
  question?: string;
  answer?: string;
  metadata?: {
    sources?: Array<{ id?: unknown }>;
    intent?: string;
    retrievalMode?: string;
  } & Record<string, unknown>;
};

const toTokenStream = async function* (text: string): AsyncGenerator<string> {
  const parts = text.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    yield `${part} `;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

const ensureChatUser = async (authUser: JwtPayload): Promise<string> => {
  const db = await getDbClient();
  const userId = authUser.userId;
  const email = authUser.email.trim().toLowerCase();

  const existing = await db.query<{ id: string }>("SELECT id FROM users WHERE id = $1 LIMIT 1", [userId]);
  if (existing.rows[0]) return userId;
  const existingByEmail = await db.query<{ id: string }>("SELECT id FROM users WHERE email = $1 LIMIT 1", [email]);
  if (existingByEmail.rows[0]) return existingByEmail.rows[0].id;

  await db.query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)", [
    userId,
    email,
    email.split("@")[0] || `Usuário ${randomUUID().slice(0, 8)}`
  ]);
  return userId;
};

const buildContextualQuestion = (
  question: string,
  pageContext?: ChatPageContext,
  user?: ContextUser | null
) => {
  if (!pageContext) return question;

  const pageInstructions: Record<ChatPageContext["page"], string> = {
    register:
      "Ajude o usuário a preencher cadastro, explicar campos obrigatórios, validar senha, hierarquia, empresa, unidade, cargo e mensagens de erro sem responder de forma genérica.",
    workspace:
      "Resuma o workspace do próprio usuário, priorize pendências, indicadores pessoais, decisões recentes e próximos passos com base no resumo recebido.",
    reports:
      "Ajude com submissão por link externo, rascunho, status, filtros, métricas e navegação dos relatórios visíveis para o usuário.",
    approvals:
      "Resuma a fila de aprovação, destaque pendências, destino automático, histórico e oriente o usuário sobre o que exige decisão agora.",
    generic:
      "Responda considerando a tela atual e use o resumo fornecido para evitar respostas genericas."
  };

  const userLabel = user?.full_name || user?.email || authUserFallback(user?.id);
  return [
    `Contexto da tela atual do NeoView: ${pageContext.title}.`,
    `Pagina tecnica: ${pageContext.page}.`,
    userLabel ? `Usuário atual: ${userLabel}.` : "",
    `Resumo especifico da tela: ${pageContext.summary}`,
    pageContext.hints?.length ? `Pistas adicionais: ${pageContext.hints.join(" | ")}` : "",
    `Instrucao: ${pageInstructions[pageContext.page]}`,
    `Pergunta do usuário: ${question}`
  ]
    .filter(Boolean)
    .join("\n");
};

const authUserFallback = (value?: string) => (value ? `ID ${value}` : "");

export const chatService = {
  async resolveUser(authUser: JwtPayload) {
    return ensureChatUser(authUser);
  },

  async ask(question: string, sessionId: string | undefined, authUser: JwtPayload, pageContext?: ChatPageContext) {
    const safeUserId = await ensureChatUser(authUser);
    const activeSessionId = sessionId ?? (await memoryService.createSession(safeUserId));
    await memoryService.storeMessage(activeSessionId, "user", question);

    const history = await memoryService.getSessionHistory(activeSessionId);
    const resolvedUser = await userManagementService.getUserById(safeUserId);
    const contextualQuestion = buildContextualQuestion(question, pageContext, resolvedUser ?? { id: safeUserId });
    const rag = await ragPipeline.run(contextualQuestion, history, resolvedUser ?? { id: safeUserId });

    await memoryService.storeMessage(activeSessionId, "assistant", rag.answer);

    return {
      sessionId: activeSessionId,
      answer: rag.answer,
      sources: rag.sources,
      cached: rag.cached,
      totalSources: rag.totalSources
    };
  },

  async askStream(question: string, sessionId: string | undefined, authUser: JwtPayload, pageContext?: ChatPageContext) {
    const response = await this.ask(question, sessionId, authUser, pageContext);
    return {
      ...response,
      stream: toTokenStream(response.answer)
    };
  },

  async listSessions(authUser: JwtPayload, limit?: number) {
    const safeUserId = await ensureChatUser(authUser);
    return memoryService.listSessions(safeUserId, limit);
  },

  async getSession(sessionId: string, authUser: JwtPayload) {
    const safeUserId = await ensureChatUser(authUser);
    const session = await memoryService.getSession(sessionId);
    if (!session.session || session.session.user_id !== safeUserId) {
      return null;
    }

    return session;
  },

  async storeFeedback(payload: ChatFeedbackRequest, authUser: JwtPayload) {
    const safeUserId = await ensureChatUser(authUser);
    const sourceIds = (payload.metadata?.sources ?? [])
      .map((source) => String(source.id ?? ""))
      .filter(Boolean);

    return memoryService.storeFeedback(safeUserId, {
      sessionId: payload.sessionId,
      messageId: payload.messageId,
      rating: payload.rating,
      question: payload.question,
      answer: payload.answer,
      intent: payload.metadata?.intent,
      retrievalMode: payload.metadata?.retrievalMode,
      sourceIds,
      metadata: payload.metadata
    });
  },

  async getLearningSummary(authUser: JwtPayload) {
    const safeUserId = await ensureChatUser(authUser);
    return memoryService.getFeedbackSummary(safeUserId);
  }
};
