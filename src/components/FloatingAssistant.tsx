import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import { BotMessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/Chatbot/ChatWidget";
import type { ChatPageContext } from "@/types/backend";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface FloatingAssistantProps {
  variant?: "both" | "chat" | "ranking";
  currentLevel?:
    | "companies"
    | "superintendences"
    | "managements"
    | "projects"
    | "indicators"
    | "reports"
    | "approvals"
    | "favorites"
    | "settings"
    | "help";
  selectedCompanyId?: string | number | null;
  selectedSupId?: string | number | null;
  selectedMgmtId?: string | number | null;
  selectedProjId?: string | number | null;
  defaultChatOpen?: boolean;
  defaultRankingOpen?: boolean;
  pageContext?: ChatPageContext | null;
}

const CHAT_DURATION = 650;
const EASE_BASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function FloatingAssistant({
  variant = "chat",
  defaultChatOpen = false,
  currentLevel,
  pageContext,
}: FloatingAssistantProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isChatVisible, setChatVisible] = useState<boolean>(defaultChatOpen);
  const enableChat = variant !== "ranking";

  const toggleChat = useCallback(() => {
    if (!enableChat) return;
    setChatVisible((value) => !value);
  }, [enableChat]);

  if (!enableChat) return null;

  const resolvedPageContext = pageContext ?? buildPageContext(currentLevel);

  return (
    <div
      className={cn(
        "fixed z-50",
        isMobile ? "inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.35rem)]" : "bottom-6 right-6"
      )}
      style={{
        '--chat-duration': `${CHAT_DURATION}ms`,
        '--chat-ease': EASE_BASE,
      } as CSSProperties & Record<`--${string}`, string>}
    >
      <div className={cn("mb-3 flex items-end", isMobile ? "justify-center" : "justify-end")}>
        <div
          className={cn(
            "origin-bottom-right will-change-transform will-change-opacity",
            "transform transition-[transform,opacity]",
            isMobile
              ? isChatVisible ? "w-full opacity-100 translate-y-0" : "w-full opacity-0 translate-y-6 pointer-events-none"
              : isChatVisible ? "opacity-100 translate-x-3" : "opacity-0 translate-x-full pointer-events-none"
          )}
          style={{
            transitionDuration: "var(--chat-duration)",
            transitionTimingFunction: "var(--chat-ease)",
          }}
        >
          <ChatWidget isOpen={isChatVisible} onClose={toggleChat} embedded pageContext={resolvedPageContext} />
        </div>
      </div>

      <div className={cn("flex", isMobile ? "justify-end gap-2 pr-1" : "justify-end")}>
        <Button
          onClick={toggleChat}
          size="lg"
          aria-expanded={isChatVisible}
          aria-label={isChatVisible ? "Fechar chat" : "Abrir chat"}
          style={{ transitionTimingFunction: "var(--chat-ease)" }}
          className={cn(
            isMobile ? "h-12 w-12 rounded-2xl" : "h-14 w-14 rounded-full",
            "shadow-lg",
            "transition-transform duration-200 hover:scale-110 active:scale-95",
            "bg-gradient-to-br from-primary to-primary/80"
          )}
        >
          {isChatVisible ? (
            <X className="w-6 h-6" aria-hidden />
          ) : (
            <BotMessageSquare className="w-9 h-9" aria-hidden />
          )}
        </Button>
      </div>
    </div>
  );
}

export default FloatingAssistant;

export const FloatingChatOnly = (props: Omit<FloatingAssistantProps, "variant">) => (
  <FloatingAssistant {...props} variant="chat" />
);

export const FloatingRankingOnly = (_props: Omit<FloatingAssistantProps, "variant">) => null;

const buildPageContext = (level?: FloatingAssistantProps["currentLevel"]): ChatPageContext | null => {
  const contexts: Partial<Record<NonNullable<FloatingAssistantProps["currentLevel"]>, ChatPageContext>> = {
    companies: {
      page: 'home',
      title: 'Início',
      summary: 'Tela de entrada para visão executiva, busca global, empresas, relatórios recentes e atalhos de decisão.',
      hints: [
        'Sugira perguntas amplas sobre indicadores, empresas e relatórios prioritários.',
        'Ajude o usuário a escolher entre analisar indicador, abrir relatório, comparar empresas ou ver pendências.',
        'Quando a pergunta for vaga, proponha uma visão executiva inicial.'
      ]
    },
    superintendences: {
      page: 'workspace',
      title: 'Hierarquia organizacional',
      summary: 'Navegação por empresa, superintendência, gerência, projeto, indicadores e relatórios.',
      hints: [
        'Considere filtros de hierarquia quando o usuário citar área, unidade ou responsável.',
        'Ajude a descer ou subir na estrutura do NeoView.'
      ]
    },
    managements: {
      page: 'workspace',
      title: 'Gerências',
      summary: 'Recorte de gestão para localizar projetos, indicadores e relatórios da área selecionada.',
      hints: ['Priorize respostas por gerência, indicador e relatório associado.']
    },
    projects: {
      page: 'workspace',
      title: 'Projetos',
      summary: 'Recorte por projeto com indicadores, relatórios e evidências operacionais.',
      hints: ['Relacione projeto com KPI, relatório fonte e próximos passos de análise.']
    },
    indicators: {
      page: 'indicators',
      title: 'Inteligência de Indicadores',
      summary: 'Área para comparar anos, validar aderência do indicador e cruzar KPIs.',
      hints: [
        'Responda com leitura de tendência, meta, aderência da pergunta e indicadores complementares.',
        'Se houver ano na pergunta, use o recorte temporal.'
      ]
    },
    reports: {
      page: 'reports',
      title: 'Relatórios',
      summary: 'Catálogo de relatórios com fontes, indicadores, responsáveis e detalhes para consulta.',
      hints: [
        'Quando o usuário pedir um relatório, sugira a fonte mais provável e o indicador relacionado.',
        'Se houver ano, empresa ou área, trate como filtro.'
      ]
    },
    approvals: {
      page: 'approvals',
      title: 'Aprovações',
      summary: 'Fila de validações, pendências, histórico de decisão e governança dos relatórios.',
      hints: ['Priorize risco, pendência, status de aprovação e ação recomendada.']
    },
    favorites: {
      page: 'favorites',
      title: 'Favoritos',
      summary: 'Relatórios e indicadores salvos para acesso rápido.',
      hints: ['Ajude a recuperar itens salvos e sugerir acompanhamento recorrente.']
    },
    settings: {
      page: 'settings',
      title: 'Configurações',
      summary: 'Preferências de perfil, tema, notificações e conta.',
      hints: ['Responda como guia de configuração e personalização.']
    },
    help: {
      page: 'help',
      title: 'Ajuda',
      summary: 'Central de suporte, dúvidas frequentes e orientação de uso da plataforma.',
      hints: ['Explique fluxos com clareza e sugira onde clicar no NeoView.']
    }
  };

  return level ? contexts[level] ?? null : null;
};
