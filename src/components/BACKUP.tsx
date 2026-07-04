// /**
//  * FloatingAssistant - Chat deslizando da DIREITA → ESQUERDA
//  * E fechando da ESQUERDA → DIREITA
//  */

// import React, { useState } from "react";
// import { BotMessageSquare, X, Trophy } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { ChatWidget } from "@/components/Chatbot/ChatWidget"
// import { RankingPanel } from "@/components/RankingPanel";

// const EXIT_DURATION = 100;

// export function FloatingAssistant({
//   currentLevel,
//   selectedCompanyId,
//   selectedSupId,
//   selectedMgmtId,
//   selectedProjId,
// }) {
//   const [chatOpen, setChatOpen] = useState(false);
//   const [rankingOpen, setRankingOpen] = useState(false);

//   const [chatClosing, setChatClosing] = useState(false);
//   const [rankingClosing, setRankingClosing] = useState(false);

//   const toggleChat = () => {
//     if (chatOpen) {
//       setChatClosing(true);
//       setTimeout(() => {
//         setChatClosing(false);
//         setChatOpen(false);
//       }, EXIT_DURATION);
//     } else {
//       setChatOpen(true);
//     }
//   };

//   const toggleRanking = () => {
//     if (rankingOpen) {
//       setRankingClosing(true);
//       setTimeout(() => {
//         setRankingClosing(false);
//         setRankingOpen(false);
//       }, EXIT_DURATION);
//     } else {
//       setRankingOpen(true);
//     }
//   };

//   const chatActive = chatOpen || chatClosing;
//   const rankingActive = rankingOpen || rankingClosing;

//   return (
//     <div className="fixed bottom-6 right-6 z-50">

//       {/* Painéis */}
//       <div className="flex items-end gap-3 mb-3">

//         {/* Painel Ranking */}
//         <div
//           className={cn(
//             "transform origin-bottom-right transition-all duration-300 ease-out",
//             rankingActive
//               ?? rankingClosing
//                 ?? "opacity-0 translate-y-1 scale-95"
//                 : "opacity-100 translate-y-0 scale-100"
//               : "opacity-0 translate-y-2 scale-95 pointer-events-none",

//             // Ranking se move ligeiramente para direita se o chat está ativo
//             chatActive ? "translate-x-0" : "translate-x-[6px]"
//           )}
//         >
//           <RankingPanel
//             isOpen={rankingOpen}
//             onClose={toggleRanking}
//             currentLevel={currentLevel}
//             selectedCompanyId={selectedCompanyId}
//             selectedSupId={selectedSupId}
//             selectedMgmtId={selectedMgmtId}
//             selectedProjId={selectedProjId}
//             embedded
//           />
//         </div>

//         {/* Painel Chat – horizontal */}
//         <div
//           className={cn(
//             "transform origin-center transition-all duration-300 ease-out",

//             chatActive
//               ?? chatClosing
//                 // ➜ Fechar: esquerda → direita
//                 ?? "opacity-0 translate-x-full scale-95"
//                 : "opacity-100 translate-x-0 scale-100"
//               : "opacity-0 translate-x-full scale-95 pointer-events-none"
//           )}
//         >
//           <ChatWidget isOpen={chatOpen} onClose={toggleChat} embedded />
//         </div>

//       </div>

//       {/* FABs */}
//       <div className="flex items-center justify-end gap-3">

//         {/* Ranking FAB */}
//         <button
//           onClick={toggleRanking}
//           className={cn(
//             "flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95 font-medium text-sm",
//             rankingOpen
//               ?? "bg-gradient-to-r from-yellow-600 to-amber-500 text-white"
//               : "bg-card border border-border text-foreground hover:bg-muted"
//           )}
//         >
//           <Trophy className="w-5 h-5" />
//           <span>Ranking</span>
//         </button>

//         {/* FAB do Chat */}
//         <Button
//           onClick={toggleChat}
//           size="lg"
//           aria-expanded={chatOpen}
//           aria-label={chatOpen ? "Fechar chat" : "Abrir chat"}
//           className={cn(
//             "rounded-full w-14 h-14 shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br from-primary to-primary/80"
//           )}
//         >
//           {chatOpen ? (
//             <X className="w-6 h-6" />
//           ) : (
//             <BotMessageSquare className="w-9 h-9" />
//           )}
//         </Button>
//       </div>
//     </div>
//   );
// }

// export default FloatingAssistant;

