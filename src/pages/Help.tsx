import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Book, Bot, CheckCircle2, FileText, Headphones, HelpCircle, LifeBuoy, Mail, Search, Video } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, SearchControl, SmallArrowRow } from '@/components/neo/NeoReferenceUI';

const faqs = [
  ['Como faço para acessar os relatórios da minha empresa?', 'Use a busca global, a tela Meus Relatórios ou navegue pela hierarquia da empresa no dashboard.'],
  ['Como funciona o sistema de aprovação de relatórios?', 'Relatórios enviados entram na fila de validação, onde aprovadores podem analisar, aprovar, rejeitar ou delegar.'],
  ['Posso favoritar relatórios para acesso rápido?', 'Sim. Use a estrela em relatórios e indicadores para mantê-los na página de Favoritos.'],
  ['O que é a IRIS e como ela pode me ajudar?', 'A IRIS entende perguntas em linguagem natural e ajuda a encontrar relatórios, indicadores e caminhos do sistema.'],
  ['Como altero entre o tema claro e escuro?', 'Use o ícone de tema no topo da interface para alternar entre claro e escuro.'],
  ['Onde posso ver os relatórios mais acessados?', 'Na área de relatórios em destaque, no ranking e nos cards de engajamento dos relatórios.'],
];

const Help: React.FC = () => {
  const [query, setQuery] = useState('');
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqs[0][0]);
  const [assistantKey, setAssistantKey] = useState(0);

  const filteredFaqs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return faqs;
    return faqs.filter(([question, answer]) => `${question} ${answer}`.toLowerCase().includes(normalized));
  }, [query]);

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
        <PageTitle title="Central de Ajuda, João 👋" description="Estamos aqui para ajudar você a tirar o máximo do NeoView." />
        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_460px]">
          <SearchControl placeholder="Como podemos ajudar você hoje?" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="hidden min-h-36 rounded-xl bg-[radial-gradient(circle_at_center,rgba(34,197,94,.32),transparent_35%),linear-gradient(90deg,transparent,rgba(14,165,233,.12),transparent)] xl:block" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <Panel title="Acesso rápido">
              <div className="grid gap-4 md:grid-cols-4">
                <SmallArrowRow onClick={() => toast.info('Guia aberto', { description: 'Passo 1: busque relatórios; passo 2: favorite; passo 3: valide quando necessário.' })} icon={FileText} title="Guia de início rápido" subtitle="Aprenda o essencial em 5 minutos" tone="green" />
                <SmallArrowRow onClick={() => toast.info('Manual do usuário', { description: 'Manual demonstrativo carregado com navegação, relatórios e aprovações.' })} icon={Book} title="Manual do usuário" subtitle="Documentação completa e detalhada" tone="blue" />
                <SmallArrowRow onClick={() => toast.info('Tutoriais em vídeo', { description: 'Lista de vídeos da demonstração preparada para treinamento.' })} icon={Video} title="Tutoriais em vídeo" subtitle="Aprenda visualmente passo a passo" tone="purple" />
                <SmallArrowRow onClick={() => toast.info('Dica rápida', { description: 'Use a IRIS para encontrar relatórios sem lembrar o nome exato.' })} icon={HelpCircle} title="Dicas e truques" subtitle="Seja mais produtivo no dia a dia" tone="amber" />
              </div>
            </Panel>

            <Panel title="Perguntas frequentes" action={<button type="button" onClick={() => setQuery('')} className="text-sm text-muted-foreground">Ver todas as perguntas ›</button>}>
              {filteredFaqs.map(([q, answer]) => (
                <button type="button" onClick={() => setOpenQuestion(openQuestion === q ? null : q)} key={q} className="w-full border-b border-border/60 px-4 py-3 text-left text-sm text-foreground last:border-0">
                  <span className="flex items-center justify-between gap-3">
                    <span>{q}</span><span className="text-muted-foreground">{openQuestion === q ? '⌃' : '⌄'}</span>
                  </span>
                  {openQuestion === q ? <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{answer}</span> : null}
                </button>
              ))}
              {!filteredFaqs.length ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma pergunta encontrada para essa busca.</p> : null}
              <p className="mt-4 text-center text-sm text-muted-foreground">Não encontrou o que procura? <span className="text-emerald-400">Fale com o suporte</span></p>
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel title="IRIS · Assistente NeoView">
              <div className="flex gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-300"><Bot /></div>
                <div className="rounded-xl border border-border/60 bg-white/[0.035] p-4 text-sm text-muted-foreground">
                  Olá, João! Sou a IRIS, sua assistente inteligente. Posso te ajudar a encontrar relatórios, entender indicadores ou tirar dúvidas sobre o sistema.
                </div>
              </div>
              <button type="button" onClick={() => setAssistantKey((key) => key + 1)} className="neo-action-button mt-4 w-full justify-between border-primary/50 text-primary">Pergunte algo para a IRIS <ArrowRight className="h-4 w-4" /></button>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Como criar um relatório?', 'Como aprovar um relatório?', 'Quais relatórios foram acessados hoje?'].map((item) => (
                  <button type="button" onClick={() => {
                    setAssistantKey((key) => key + 1);
                    toast.info('Sugestão enviada para a IRIS', { description: item });
                  }} key={item} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">{item}</button>
                ))}
              </div>
            </Panel>

            <Panel title="Fale com o suporte">
              <SmallArrowRow onClick={() => toast.success('E-mail preparado', { description: 'suporte@neoenergia.com foi selecionado como canal de atendimento.' })} icon={Mail} title="suporte@neoenergia.com" subtitle="Resposta em até 2h úteis" tone="blue" />
              <SmallArrowRow onClick={() => toast.success('Chamado aberto', { description: 'Protocolo DEMO-2042 criado para acompanhamento.' })} icon={Headphones} title="Abrir chamado" subtitle="Acompanhe suas solicitações" tone="green" />
              <p className="mt-3 text-xs text-muted-foreground">Horário de atendimento: Seg - Sex, 08h às 18h</p>
            </Panel>
          </aside>
        </div>

        <div className="neo-surface mt-4 flex flex-col gap-3 rounded-xl p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" /> Status do sistema <span className="text-muted-foreground">Todos os sistemas operando normalmente</span></span>
          <button type="button" onClick={() => toast.info('Histórico do sistema', { description: 'Últimos 30 dias sem incidentes críticos registrados.' })} className="neo-action-button">Ver histórico <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
      <FloatingAssistant key={assistantKey} defaultChatOpen={assistantKey > 0} currentLevel="help" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default Help;
