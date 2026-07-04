import React, { useCallback, useMemo, useState } from "react";
import { BotMessageSquare, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatWidget } from "@/components/Chatbot/ChatWidget";
import { RankingPanel } from "@/components/RankingPanel";
import type { ChatPageContext } from "@/types/backend";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** ============================
 *  Configurações de animação
 *  ============================ */
const CHAT_DURATION = 650;                 // Chat mais lento (ms)
const RANK_FADE_DURATION = 240;            // Ranking (aparecer/desaparecer)
const RANK_SHIFT_WITH_CHAT_DURATION = 650; // Ranking acompanhando o chat (mais suave)
const EASE_BASE = "cubic-bezier(0.16, 1, 0.3, 1)";   // "expo out" suave
const EASE_SOFT = "cubic-bezier(0.22, 1, 0.36, 1)";  // easeOutQuart ainda mais cremosa
const RANK_SHIFT_X_PX = 14;                // Deslocamento do ranking para a direita
const PANELS_GAP_CLASS = "gap-6";          // Gap maior entre painéis

/** ============================
 *  Tipos + helpers
 *  ============================ */
interface FloatingAssistantProps {
  /** Escolha o modo: ambos, só chat ou só ranking */
  variant?: "both" | "chat" | "ranking";

  currentLevel?: "companies" | "superintendences" | "managements" | "projects" | "indicators";
  selectedCompanyId?: string | number | null;
  selectedSupId?: string | number | null;
  selectedMgmtId?: string | number | null;
  selectedProjId?: string | number | null;

  /** (Opcional) estados iniciais */
  defaultChatOpen?: boolean;
  defaultRankingOpen?: boolean;
  pageContext?: ChatPageContext | null;
}

const toStr = (v: string | number | null | undefined): string | undefined =>
  v == null ? undefined : String(v);

// Memo para evitar renders desnecessários; apenas se props mudarem de fato
const StableRankingPanel = React.memo(RankingPanel);

export function FloatingAssistant({
  variant = "both",
  currentLevel,
  selectedCompanyId,
  selectedSupId,
  selectedMgmtId,
  selectedProjId,
  defaultChatOpen = false,
  defaultRankingOpen = false,
  pageContext,
}: FloatingAssistantProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  /**
   * Habilitações com base no variant
   * - enableChat: renderiza Chat e seu botão
   * - enableRanking: renderiza Ranking e seu botão
   */
  const enableChat = variant !== "ranking";
  const enableRanking = !isMobile && variant !== "chat";

  /**
   * CHAT:
   *  - isChatVisible: controla apenas se o chat está visível.
   *  - Nunca desmontamos o ChatWidget quando enableChat=true => transições interrompíveis
   *    e o tamanho (expandido) persiste ao fechar/abrir.
   */
  const [isChatVisible, setChatVisible] = useState<boolean>(defaultChatOpen);

  /** RANKING */
  const [isRankingOpen, setRankingOpen] = useState<boolean>(defaultRankingOpen);

  /** IDs normalizadas para atender tipos do RankingPanel (evita TS2322) */
  const normalizedCompanyId = useMemo(() => toStr(selectedCompanyId), [selectedCompanyId]);
  const normalizedSupId = useMemo(() => toStr(selectedSupId), [selectedSupId]);
  const normalizedMgmtId = useMemo(() => toStr(selectedMgmtId), [selectedMgmtId]);
  const normalizedProjId = useMemo(() => toStr(selectedProjId), [selectedProjId]);

  /** Handlers estáveis */
  const toggleChat = useCallback(() => {
    if (!enableChat) return;
    setChatVisible((v) => !v);
  }, [enableChat]);

  const toggleRanking = useCallback(() => {
    if (!enableRanking) return;
    setRankingOpen((prev) => !prev);
  }, [enableRanking]);

  /** Derivados:
   *  - Ranking acompanha o chat apenas quando ele está visível e o ranking está aberto
   *  - Só faz sentido "acompanhar" se o chat existir (enableChat)
   */
  const shouldShiftRanking = enableChat && isRankingOpen && isChatVisible;

  const rankTransitionDuration = shouldShiftRanking
    ? RANK_SHIFT_WITH_CHAT_DURATION
    : RANK_FADE_DURATION;

  const rankEase = shouldShiftRanking ? EASE_SOFT : EASE_BASE;

  /** Classes do Chat (sempre montado quando enableChat) */
  const chatClasses = isChatVisible
    ? "opacity-100 translate-x-3"
    : "opacity-0 translate-x-full pointer-events-none"; // escondido e sem bloquear clique por baixo

  /** Classes do Ranking */
  const rankingBase = isRankingOpen
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-4 pointer-events-none";

  // Se não existe chat, não desloca o ranking para a direita.
  const rankingShiftClass = enableChat
    ? (shouldShiftRanking ? "translate-x-[var(--rank-shift-x)]" : "translate-x-9")
    : "translate-x-0";

  // Gap entre painéis só se ambos existem
  const panelsGapClass = enableChat && enableRanking ? PANELS_GAP_CLASS : "gap-0";
  const cssVars: React.CSSProperties & Record<`--${string}`, string> = {
    '--chat-duration': `${CHAT_DURATION}ms`,
    '--rank-duration': `${rankTransitionDuration}ms`,
    '--rank-ease': rankEase,
    '--chat-ease': EASE_BASE,
    '--rank-shift-x': `${RANK_SHIFT_X_PX}px`,
  };

  return (
    <div
      className={cn(
        "fixed z-50",
        isMobile ? "bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4" : "bottom-6 right-6"
      )}
      style={cssVars}
    >
      {/* Linha dos painéis */}
      <div className={cn("flex items-end mb-4", panelsGapClass)}>
        {/* RANKING (montado somente se enableRanking) */}
        {enableRanking && (
          <div
            className={cn(
              "origin-bottom-right will-change-transform will-change-opacity",
              "transform transition-[transform,opacity]",
              rankingBase,
              rankingShiftClass
            )}
            style={{
              transitionDuration: "var(--rank-duration)",
              transitionTimingFunction: "var(--rank-ease)",
            }}
          >
            <StableRankingPanel
              isOpen={isRankingOpen}
              onClose={toggleRanking}
              currentLevel={currentLevel}
              selectedCompanyId={normalizedCompanyId}
              selectedSupId={normalizedSupId}
              selectedMgmtId={normalizedMgmtId}
              selectedProjId={normalizedProjId}
              embedded
            />
          </div>
        )}

        {/* CHAT (montado somente se enableChat para preservar estado interno) */}
        {enableChat && (
          <div
            className={cn(
              "origin-bottom-right will-change-transform will-change-opacity",
              "transform transition-[transform,opacity]",
              chatClasses
            )}
            style={{
              transitionDuration: "var(--chat-duration)",
              transitionTimingFunction: "var(--chat-ease)",
            }}
          >
            <ChatWidget isOpen={isChatVisible} onClose={toggleChat} embedded pageContext={pageContext} />
          </div>
        )}
      </div>

      {/* BOTÕES */}
      <div className={cn("flex justify-end gap-3", isMobile && "gap-2")}>
        {enableRanking && (
          <button
            onClick={toggleRanking}
            style={{ transitionTimingFunction: "var(--chat-ease)" }}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-full shadow-lg font-medium text-sm",
              "transition-transform duration-200 hover:scale-105 active:scale-95",
              isRankingOpen
                ? "bg-gradient-to-r from-yellow-600 to-amber-500 text-white"
                : "bg-card border border-border text-foreground hover:bg-muted"
            )}
            aria-expanded={isRankingOpen}
          >
            <Trophy className="w-5 h-5" aria-hidden />
            <span>Ranking</span>
          </button>
        )}

        {enableChat && (
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
        )}
      </div>
    </div>
  );
}

export default FloatingAssistant;

/** Exports auxiliares para facilitar o consumo */
export const FloatingChatOnly = (props: Omit<FloatingAssistantProps, "variant">) => (
  <FloatingAssistant {...props} variant="chat" />
);

export const FloatingRankingOnly = (props: Omit<FloatingAssistantProps, "variant">) => (
  <FloatingAssistant {...props} variant="ranking" />
);
