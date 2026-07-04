/**
 * ============================================================
 * COMPONENT: ChatMessage
 * ============================================================
 * 
 * Renderiza uma mensagem individual do chat.
 * Suporta markdown para respostas do assistente.
 * ============================================================
 */

import React from 'react';
import { Bot, ThumbsDown, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType } from '@/types/backend';

interface ChatMessageProps {
  message: ChatMessageType;
  onRate?: (messageId: string, rating: 'positive' | 'negative') => void;
}

export function ChatMessage({ message, onRate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center text-xs text-muted-foreground py-2">
        {message.content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className="max-w-[80%]">
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted text-foreground rounded-bl-md'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <MessageContent content={message.content} />
            </div>
          )}
        </div>

        {!isUser && message.content.trim() && onRate ? (
          <div className="mt-1 flex items-center gap-1 text-muted-foreground">
            <span className="mr-1 text-[11px]">Avaliar</span>
            <Button
              type="button"
              variant={message.metadata?.evaluation === 'positive' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-full"
              aria-label="Resposta útil"
              onClick={() => onRate(message.id, 'positive')}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={message.metadata?.evaluation === 'negative' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-full"
              aria-label="Resposta não útil"
              onClick={() => onRate(message.id, 'negative')}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
            {message.metadata?.intent ? (
              <span className="ml-1 max-w-[9rem] truncate text-[11px]" title={`Intencao: ${message.metadata.intent}`}>
                {message.metadata.intent}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Renderiza conteúdo com markdown simples
 */
function MessageContent({ content }: { content: string }) {
  // Parse simples de markdown
  const parseContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h4 key={index} className="font-semibold mt-2 mb-1">
            {line.slice(4)}
          </h4>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={index} className="font-semibold mt-2 mb-1">
            {line.slice(3)}
          </h3>
        );
        return;
      }

      // List items
      if (line.startsWith('• ') || line.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-4">
            {parseInlineFormatting(line.slice(2))}
          </li>
        );
        return;
      }

      // Regular paragraph
      if (line.trim()) {
        elements.push(
          <p key={index} className="mb-1">
            {parseInlineFormatting(line)}
          </p>
        );
      } else if (index > 0) {
        elements.push(<br key={index} />);
      }
    });

    return elements;
  };

  // Parse inline formatting (bold, italic)
  const parseInlineFormatting = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={key++} className="font-semibold">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic *text*
      const italicMatch = remaining.match(/\*(.+?)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(remaining.slice(0, italicMatch.index));
        }
        parts.push(
          <em key={key++} className="italic">
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more formatting
      parts.push(remaining);
      break;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return <>{parseContent(content)}</>;
}

export default ChatMessage;
