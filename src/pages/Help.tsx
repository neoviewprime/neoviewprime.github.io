import React from 'react';
import { ArrowRight, Book, Bot, CheckCircle2, FileText, Headphones, HelpCircle, LifeBuoy, Mail, Search, Video } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, SearchControl, SmallArrowRow } from '@/components/neo/NeoReferenceUI';

const Help: React.FC = () => (
  <>
    <div className="neo-page">
      <div className="neo-page-inner">
        <PageTitle title="Central de Ajuda, João 👋" description="Estamos aqui para ajudar você a tirar o máximo do NeoView." />
        <div className="mb-6 grid gap-6 xl:grid-cols-[1fr_460px]">
          <SearchControl placeholder="Como podemos ajudar você hoje?" />
          <div className="hidden min-h-36 rounded-xl bg-[radial-gradient(circle_at_center,rgba(34,197,94,.32),transparent_35%),linear-gradient(90deg,transparent,rgba(14,165,233,.12),transparent)] xl:block" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <Panel title="Acesso rápido">
              <div className="grid gap-4 md:grid-cols-4">
                <SmallArrowRow icon={FileText} title="Guia de início rápido" subtitle="Aprenda o essencial em 5 minutos" tone="green" />
                <SmallArrowRow icon={Book} title="Manual do usuário" subtitle="Documentação completa e detalhada" tone="blue" />
                <SmallArrowRow icon={Video} title="Tutoriais em vídeo" subtitle="Aprenda visualmente passo a passo" tone="purple" />
                <SmallArrowRow icon={HelpCircle} title="Dicas e truques" subtitle="Seja mais produtivo no dia a dia" tone="amber" />
              </div>
            </Panel>

            <Panel title="Perguntas frequentes" action={<button className="text-sm text-muted-foreground">Ver todas as perguntas ›</button>}>
              {[
                'Como faço para acessar os relatórios da minha empresa?',
                'Como funciona o sistema de aprovação de relatórios?',
                'Posso favoritar relatórios para acesso rápido?',
                'O que é a IRIS e como ela pode me ajudar?',
                'Como altero entre o tema claro e escuro?',
                'Onde posso ver os relatórios mais acessados?',
              ].map((q) => (
                <button key={q} className="flex w-full items-center justify-between border-b border-border/60 px-4 py-3 text-left text-sm text-foreground last:border-0">
                  {q}<span className="text-muted-foreground">⌄</span>
                </button>
              ))}
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
              <button className="neo-action-button mt-4 w-full justify-between border-primary/50 text-primary">Pergunte algo para a IRIS <ArrowRight className="h-4 w-4" /></button>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Como criar um relatório?', 'Como aprovar um relatório?', 'Quais relatórios foram acessados hoje?'].map((item) => <span key={item} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-muted-foreground">{item}</span>)}
              </div>
            </Panel>

            <Panel title="Fale com o suporte">
              <SmallArrowRow icon={Mail} title="suporte@neoenergia.com" subtitle="Resposta em até 2h úteis" tone="blue" />
              <SmallArrowRow icon={Headphones} title="Abrir chamado" subtitle="Acompanhe suas solicitações" tone="green" />
              <p className="mt-3 text-xs text-muted-foreground">Horário de atendimento: Seg - Sex, 08h às 18h</p>
            </Panel>
          </aside>
        </div>

        <div className="neo-surface mt-4 flex items-center justify-between rounded-xl p-4 text-sm">
          <span className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="h-5 w-5" /> Status do sistema <span className="text-muted-foreground">Todos os sistemas operando normalmente</span></span>
          <button className="neo-action-button">Ver histórico <ArrowRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
    <FloatingAssistant currentLevel="help" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
  </>
);

export default Help;
