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
  currentLevel?: "companies" | "superintendences" | "managements" | "projects" | "indicators";
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

  return (
    <div
      className={cn(
        "fixed z-50",
        isMobile ? "bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] right-4" : "bottom-6 right-6"
      )}
      style={{
        '--chat-duration': `${CHAT_DURATION}ms`,
        '--chat-ease': EASE_BASE,
      } as CSSProperties & Record<`--${string}`, string>}
    >
      <div className="mb-4 flex items-end justify-end">
        <div
          className={cn(
            "origin-bottom-right will-change-transform will-change-opacity",
            "transform transition-[transform,opacity]",
            isChatVisible ? "opacity-100 translate-x-3" : "opacity-0 translate-x-full pointer-events-none"
          )}
          style={{
            transitionDuration: "var(--chat-duration)",
            transitionTimingFunction: "var(--chat-ease)",
          }}
        >
          <ChatWidget isOpen={isChatVisible} onClose={toggleChat} embedded pageContext={pageContext} />
        </div>
      </div>

      <div className={cn("flex justify-end", isMobile && "gap-2")}>
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
