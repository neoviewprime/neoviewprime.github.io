import type { ChatPageContext } from '@/types/backend';

export const IRIS_IDENTITY = [
  'IRIS e a assistente do NeoView para indicadores, relatorios, aprovacoes e decisoes executivas.',
  'Toda resposta ao usuario final deve usar portugues brasileiro natural por padrao.',
  'A resposta deve ser direta, contextual e sustentada pelos dados disponiveis.',
  'Quando nao houver informacao suficiente, a IRIS deve dizer isso sem inventar.'
].join('\n');

export const buildIrisWelcomeMessage = (pageContext?: ChatPageContext | null): string => {
  if (!pageContext) {
    return 'Olá. Sou a IRIS. Posso analisar indicadores, comparar anos, cruzar empresas, localizar relatórios e transformar perguntas soltas em uma visão de decisão. Experimente perguntar: "como está o DEC em 2024?", "compare DEC e FEC" ou "qual empresa está melhor em SLA?".';
  }

  const pageOpeners: Partial<Record<ChatPageContext['page'], string>> = {
    home: 'Estou na visão inicial com você. Posso montar uma leitura executiva, apontar indicadores prioritários ou comparar empresas antes de você entrar nos detalhes.',
    workspace: 'Estou considerando a hierarquia atual. Posso filtrar por empresa, área, projeto, indicador ou relatório e te ajudar a chegar na fonte certa.',
    reports: 'Estou olhando como curadora de relatórios. Posso encontrar a melhor fonte, resumir o que ela sustenta e sugerir comparações por período ou empresa.',
    indicators: 'Estou em modo análise de indicadores. Posso avaliar tendência, meta, aderência da pergunta, comparação anual, cruzamento entre KPIs e diferença entre empresas.',
    approvals: 'Estou olhando pelo ângulo de governança. Posso separar pendências, riscos, relatórios que precisam de decisão e evidências para aprovar ou questionar.',
    favorites: 'Estou nos seus acessos rápidos. Posso recuperar itens salvos e sugerir acompanhamentos recorrentes por indicador ou área.',
    settings: 'Estou no apoio de configuração. Posso guiar preferências, perfil, tema, notificações e ajustes de conta.',
    help: 'Estou em modo orientação. Posso explicar fluxos, indicar onde clicar e traduzir dúvidas em caminhos dentro do NeoView.',
    register: 'Estou na área de cadastro. Posso orientar perfil, hierarquia, aprovador e permissão adequada para cada usuário.'
  };

  const hints = (pageContext.hints ?? []).slice(0, 2).join(' ');
  return [pageOpeners[pageContext.page] ?? `Estou considerando a tela ${pageContext.title}.`, hints].filter(Boolean).join(' ');
};
