import React, { useState, useRef, useEffect } from 'react';
import { ScanEye, X, Send, Minimize2, Maximize2, Sparkles, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChatbot } from '@/hooks/useChatbot';
import { ChatMessage } from './ChatMessage';
import { ChatSources } from './ChatSources';
import type { ChatPageContext, ChatSession } from '@/types/backend';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ChatWidgetProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
  fabOnly?: boolean;
  embedded?: boolean;
  pageContext?: ChatPageContext | null;
}

export function ChatWidget({
  className,
  isOpen: controlledOpen,
  onClose,
  onToggle,
  fabOnly,
  embedded,
  pageContext,
}: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const {
    messages,
    session,
    isLoading,
    isTyping,
    error,
    sendMessage,
    startNewSession,
    loadSession,
    getSessions,
    rateMessage
  } = useChatbot(pageContext);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      void startNewSession();
    }
  }, [isOpen, messages.length, startNewSession]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsSessionsLoading(true);
    getSessions()
      .then((items) => {
        if (!active) return;
        setSessions(items);
      })
      .catch(() => {
        if (!active) return;
        setSessions([]);
      })
      .finally(() => {
        if (active) setIsSessionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, getSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !fabOnly) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, fabOnly]);

  const refreshSessions = async () => {
    setIsSessionsLoading(true);
    try {
      const items = await getSessions();
      setSessions(items);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
    await refreshSessions().catch(() => undefined);
  };

  const sendInput = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
    await refreshSessions().catch(() => undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendInput();
    }
  };

  const handleToggle = () => {
    if (onToggle) onToggle();
    else setInternalOpen(!internalOpen);
  };

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const handleNewChat = async () => {
    setShowHistory(false);
    await startNewSession();
    await refreshSessions().catch(() => undefined);
  };

  const handleLoadSession = async (sessionId: string) => {
    await loadSession(sessionId);
    setShowHistory(false);
    await refreshSessions().catch(() => undefined);
  };

  if (fabOnly) {
    return (
      <Button
        onClick={handleToggle}
        size="lg"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Fechar chat IRIS' : 'Abrir chat IRIS'}
        className={cn(
          'rounded-full w-14 h-14 shadow-lg transition-transform duration-300 hover:scale-110 bg-gradient-to-br from-primary to-primary/80'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden />
        ) : (
          <ScanEye className="w-9 h-9" strokeWidth={2} absoluteStrokeWidth aria-hidden />
        )}
      </Button>
    );
  }

  if (embedded) {
    if (!isOpen) return null;
    return (
      <div
        className={cn(
          'bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col',
          isMobile
            ? 'h-[min(72dvh,640px)] w-[min(92vw,420px)]'
            : isExpanded
              ? 'w-[500px] h-[600px]'
              : 'w-[380px] h-[500px]'
        )}
      >
        {renderChatContent()}
      </div>
    );
  }

  return (
    <div className={cn(isMobile ? 'fixed bottom-4 right-4 z-50' : 'fixed bottom-6 right-6 z-50', className)}>
      {isOpen && (
        <div
          className={cn(
            'mb-4 bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col',
            isMobile
              ? 'h-[min(76dvh,680px)] w-[min(calc(100vw-2rem),420px)]'
              : isExpanded
                ? 'w-[500px] h-[600px]'
                : 'w-[380px] h-[500px]',
            mounted && 'transition-transform duration-300 animate-scale-in'
          )}
        >
          {renderChatContent()}
        </div>
      )}
      <Button
        onClick={handleToggle}
        size="lg"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Fechar chat IRIS' : 'Abrir chat IRIS'}
        className={cn(
          isMobile ? 'h-12 w-12 rounded-2xl' : 'h-14 w-14 rounded-full',
          'shadow-lg transition-transform duration-300 hover:scale-110 bg-gradient-to-br from-primary to-primary/80'
        )}
      >
        {isOpen ? (
          <X className="w-6 h-6" aria-hidden />
        ) : (
          <ScanEye className="w-9 h-9" strokeWidth={2} absoluteStrokeWidth aria-hidden />
        )}
      </Button>
    </div>
  );

  function renderChatContent() {
    return (
      <>
        <div className="flex items-center justify-between px-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-[52px]">
          <div className="flex items-center gap-2 min-w-0">
            <ScanEye className="w-5 h-5 flex-shrink-0" strokeWidth={2.25} absoluteStrokeWidth aria-hidden />
            <div className="min-w-0">
              <span className="font-bold text-sm leading-tight block">IRIS</span>
              <p className="text-[10px] opacity-80 leading-tight truncate">
                {pageContext?.title ? `Assistente da tela: ${pageContext.title}` : 'Assistente de Busca'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => void handleNewChat()}
              title="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20',
                showHistory && 'bg-primary-foreground/15'
              )}
              onClick={() => setShowHistory((value) => !value)}
              title="Histórico"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {showHistory && (
          <div className="border-b border-border bg-muted/30 px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conversas recentes
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => void refreshSessions()}
                disabled={isSessionsLoading}
              >
                Atualizar
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2">
              {isSessionsLoading && (
                <div className="text-xs text-muted-foreground">Carregando conversas...</div>
              )}

              {!isSessionsLoading && sessions.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  Nenhuma conversa salva ainda no backend.
                </div>
              )}

              {sessions.map((chatSession) => (
                <button
                  key={chatSession.id}
                  type="button"
                  onClick={() => void handleLoadSession(chatSession.id)}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-left transition-colors',
                    session?.id === chatSession.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted'
                  )}
                >
                  <div className="text-sm font-medium truncate">
                    {chatSession.title || 'Nova conversa'}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {new Date(chatSession.updated_at).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <ChatMessage message={message} onRate={(messageId, rating) => void rateMessage(messageId, rating)} />
              {message.role === 'assistant' && message.metadata?.sources && (
                <ChatSources
                  sources={message.metadata.sources}
                  totalSources={message.metadata.totalSources}
                />
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary animate-spin" />
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">IRIS esta pensando</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte para IRIS..."
              aria-label="Mensagem para IRIS"
              className="flex-1 px-4 py-2 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full bg-primary hover:bg-primary/90"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </>
    );
  }
}

export default ChatWidget;
