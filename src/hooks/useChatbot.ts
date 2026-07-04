import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatPageContext, ChatSession, SearchSource } from '@/types/backend';
import { API_URL } from '@/lib/api';

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('neoview_token') : null;
  return token
    ? {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    : {
        'Content-Type': 'application/json'
      };
};

interface UseChatbotReturn {
  messages: ChatMessage[];
  session: ChatSession | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  startNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  getSessions: () => Promise<ChatSession[]>;
  rateMessage: (messageId: string, rating: 'positive' | 'negative') => Promise<void>;
}

const buildWelcomeMessage = (pageContext?: ChatPageContext | null): string => {
  if (!pageContext) {
    return 'Ola. Sou a IRIS, sua assistente de busca do NeoView. Posso encontrar relatorios e indicadores por empresa, superintendencia, gerencia, unidade ou tema, entender siglas e variantes como DEC, FEC, IAR, IPCE e DCE, e te ajudar a refinar a busca ao longo da conversa. Experimente perguntar algo como: "Quais indicadores a Coelba possui?", "Traga os relatorios que contenham IAR e IPCE" ou "Mostre os relatorios de DEC da Coelba".';
  }

  const hints = (pageContext.hints ?? []).slice(0, 3).join(' ');
  return [
    `Ola. Sou a IRIS e estou te apoiando na tela "${pageContext.title}".`,
    pageContext.summary,
    hints || 'Posso resumir o que esta na tela, explicar validacoes, apontar proximos passos e te ajudar com a hierarquia e os relatorios visiveis daqui.'
  ]
    .filter(Boolean)
    .join(' ');
};

interface ApiSource {
  type?: string;
  id?: string;
  name?: string;
  title?: string;
  description?: string;
  meta?: string;
  path?: unknown[];
  hierarchy?: {
    companyId?: unknown;
    superintendenceId?: unknown;
    managementId?: unknown;
    projectId?: unknown;
  };
  company?: string;
  indicators?: unknown[];
  relevance_score?: number;
}

interface StreamEvent {
  event: string;
  data: string;
}

interface ChatDonePayload {
  sources?: ApiSource[];
  totalSources?: number;
  intent?: string;
  confidence?: number;
  retrievalMode?: string;
}

interface SessionApiItem {
  id: string;
  user_id?: string;
  title?: string;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  preview?: string;
}

const mapSource = (source: ApiSource, index: number): SearchSource => ({
  type: source?.type === 'indicator' || source?.type === 'project' || source?.type === 'report' ? source.type : 'report',
  id: String(source?.id ?? `src-${index}`),
  name: String(source?.name ?? source?.title ?? `Fonte ${index + 1}`),
  description: typeof source?.description === 'string' ? source.description : undefined,
  meta: typeof source?.meta === 'string' ? source.meta : undefined,
  path: Array.isArray(source?.path)
    ? source.path.map((x: unknown) => String(x))
    : [String(source?.company ?? ''), ...(Array.isArray(source?.indicators) ? source.indicators.map((x: unknown) => String(x)) : [])].filter(Boolean),
  relevance_score: typeof source?.relevance_score === 'number' ? source.relevance_score : undefined
  ,
  hierarchy: source?.hierarchy
    ? {
        companyId: source.hierarchy.companyId ? String(source.hierarchy.companyId) : undefined,
        superintendenceId: source.hierarchy.superintendenceId ? String(source.hierarchy.superintendenceId) : undefined,
        managementId: source.hierarchy.managementId ? String(source.hierarchy.managementId) : undefined,
        projectId: source.hierarchy.projectId ? String(source.hierarchy.projectId) : undefined
      }
    : undefined
});

const readSseEvents = async (
  response: Response,
  onEvent: (event: StreamEvent) => void
): Promise<void> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming indisponivel na resposta do servidor.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';

    for (const chunk of chunks) {
      const lines = chunk.split('\n');
      let event = 'message';
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim());
        }
      }

      if (dataLines.length > 0) {
        onEvent({ event, data: dataLines.join('\n') });
      }
    }
  }
};

const mapSession = (sessionItem: SessionApiItem): ChatSession => ({
  id: sessionItem.id,
  user_id: sessionItem.user_id ?? 'usr-current',
  title: sessionItem.title ?? 'Nova conversa',
  is_active: sessionItem.is_active ?? true,
  created_at: sessionItem.created_at,
  updated_at: sessionItem.updated_at ?? sessionItem.created_at
});

const mapHistoryMessage = (
  message: { id: string; session_id: string; role: 'user' | 'assistant' | 'system'; message: string; created_at: string }
): ChatMessage => ({
  id: message.id,
  session_id: message.session_id,
  role: message.role,
  content: message.message,
  created_at: message.created_at
});

export function useChatbot(pageContext?: ChatPageContext | null): UseChatbotReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startNewSession = useCallback(async () => {
    const newSession: ChatSession = {
      id: `sess-temp-${Date.now()}`,
      user_id: 'usr-current',
      title: 'Nova conversa',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSession(newSession);
    setMessages([
      {
        id: 'msg-welcome',
        session_id: newSession.id,
        role: 'assistant',
        content: buildWelcomeMessage(pageContext),
        created_at: new Date().toISOString()
      }
    ]);
    setError(null);
  }, [pageContext]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      session_id: session?.id || 'temp',
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    const pendingAssistantId = `msg-${Date.now()}-assistant`;
    let activeSessionId = session?.id || 'temp';
    let accumulatedAnswer = '';

    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: pendingAssistantId,
        session_id: activeSessionId,
        role: 'assistant',
        content: '',
        metadata: {
          sources: [],
          model: 'local-rag',
          tokens_used: undefined
        },
        created_at: new Date().toISOString()
      }
    ]);
    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          message: content.trim(),
          sessionId: session?.id?.startsWith('sess-temp-') ? undefined : session?.id,
          pageContext: pageContext ?? undefined
        })
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || `HTTP ${response.status}`);
      }

      await readSseEvents(response, ({ event, data }) => {
        if (event === 'session') {
          const payload = JSON.parse(data) as { sessionId: string };
          activeSessionId = payload.sessionId;

          const activeSession: ChatSession = {
            id: payload.sessionId,
            user_id: session?.user_id ?? 'usr-current',
            title: session?.title ?? 'Nova conversa',
            is_active: true,
            created_at: session?.created_at ?? new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          setSession(activeSession);

          setMessages((prev) =>
            prev.map((message) =>
              message.id === pendingAssistantId || message.id === userMessage.id
                ? { ...message, session_id: payload.sessionId }
                : message
            )
          );
          return;
        }

        if (event === 'token') {
          const payload = JSON.parse(data) as { token?: string };
          accumulatedAnswer += payload.token ?? '';

          setMessages((prev) =>
            prev.map((message) =>
              message.id === pendingAssistantId
                ? { ...message, session_id: activeSessionId, content: accumulatedAnswer }
                : message
            )
          );
          return;
        }

        if (event === 'done') {
          const payload = JSON.parse(data) as ChatDonePayload;
          const sources = (payload.sources ?? []).map(mapSource);
          const finalAnswer = accumulatedAnswer.trim() || 'Nao consegui gerar uma resposta.';

          setMessages((prev) =>
            prev.map((message) =>
              message.id === pendingAssistantId
                ? {
                    ...message,
                    session_id: activeSessionId,
                    content: finalAnswer,
                    metadata: {
                      sources,
                      model: 'local-rag',
                      tokens_used: undefined,
                      totalSources: typeof payload.totalSources === 'number' ? payload.totalSources : undefined,
                      intent: payload.intent,
                      confidence: payload.confidence,
                      retrievalMode: payload.retrievalMode
                    }
                  }
                : message
            )
          );
          return;
        }

        if (event === 'error') {
          const payload = JSON.parse(data) as { error?: string };
          throw new Error(payload.error || 'Falha no streaming do chat.');
        }
      });
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== pendingAssistantId));
      if ((err as Error).name !== 'AbortError') {
        setError(`Erro ao processar mensagem: ${(err as Error).message}`);
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }, [pageContext, session, isLoading]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSession(null);
    setError(null);
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setError(null);

    const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const raw = await response.text();
      throw new Error(raw || `HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      session: SessionApiItem;
      messages: Array<{ id: string; session_id: string; role: 'user' | 'assistant' | 'system'; message: string; created_at: string }>;
    };

    setSession(mapSession(payload.session));
    setMessages(payload.messages.map(mapHistoryMessage));
  }, []);

  const getSessions = useCallback(async (): Promise<ChatSession[]> => {
    const response = await fetch(`${API_URL}/chat/sessions?limit=12`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const raw = await response.text();
      throw new Error(raw || `HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { sessions: SessionApiItem[] };
    return (payload.sessions ?? []).map(mapSession);
  }, []);

  const rateMessage = useCallback(async (messageId: string, rating: 'positive' | 'negative') => {
    const message = messages.find((item) => item.id === messageId);
    const previousUserMessage = [...messages]
      .slice(0, messages.findIndex((item) => item.id === messageId))
      .reverse()
      .find((item) => item.role === 'user');

    setMessages((prev) =>
      prev.map((item) =>
        item.id === messageId
          ? { ...item, metadata: { ...item.metadata, evaluation: rating } }
          : item
      )
    );

    await fetch(`${API_URL}/chat/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        messageId,
        sessionId: message?.session_id ?? session?.id,
        rating,
        question: previousUserMessage?.content,
        answer: message?.content,
        metadata: message?.metadata
      })
    }).catch(() => undefined);
  }, [messages, session?.id]);

  return {
    messages,
    session,
    isLoading,
    isTyping,
    error,
    sendMessage,
    clearChat,
    startNewSession,
    loadSession,
    getSessions,
    rateMessage
  };
}

export default useChatbot;
