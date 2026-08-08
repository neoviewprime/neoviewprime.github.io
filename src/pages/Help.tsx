import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowRight, Bot, CheckCircle2, Headphones, Mail } from 'lucide-react';
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
          <div className="hidden min-h-36 overflow-hidden rounded-xl border border-border/70 bg-background/70 p-4 dark:bg-white/[0.035] xl:block">
            <div className="flex h-full items-center gap-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <img src="/neoview-icon-192.png" alt="IRIS NeoView" className="h-16 w-16 rounded-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">IRIS pronta para orientar</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Encontre respostas, abra relatórios e compare indicadores sem sair do fluxo de trabalho.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="neo-chip border-primary/30 text-primary">Busca guiada</span>
                  <span className="neo-chip">Suporte</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
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
              <div className="mt-4 grid gap-2">
                {['Como aprovar um relatório?', 'Compare DEC 2023 e 2024'].map((item) => (
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
