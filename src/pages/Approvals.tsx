import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Users, XCircle } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { DecisionList, FilterButton, PageTitle, Panel, ReportsTable, SmallArrowRow, StatCard } from '@/components/neo/NeoReferenceUI';

const Approvals: React.FC = () => {
  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageTitle
            title="Validações"
            description="Aprove, rejeite ou delegue relatórios com segurança e agilidade."
            actions={<button className="neo-action-button border-primary/50 text-primary"><ShieldCheck className="h-4 w-4" /> Analytics & SLA</button>}
          />

          <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={Clock3} label="Pendentes" value="12" helper="Aguardando" trend="+20% vs ontem" tone="amber" />
            <StatCard icon={CheckCircle2} label="Aprovados hoje" value="18" helper="Liberados para publicação" trend="+10% vs ontem" tone="green" />
            <StatCard icon={XCircle} label="Rejeitados hoje" value="3" helper="Devolvidos para correção" trend="-25% vs ontem" tone="red" />
            <StatCard icon={Clock3} label="Tempo médio" value="1,7h" helper="Entre submissão e decisão" trend="-0,3h vs ontem" tone="blue" />
            <StatCard icon={Clock3} label="No prazo" value="85%" helper="Dentro do SLA" trend="+8% vs ontem" tone="purple" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
            <Panel>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="neo-mobile-scroll -mx-1 px-1 text-sm">
                  <div className="neo-scroll-content flex gap-6">
                    {['Fila de aprovações 12', 'Minhas decisões', 'Delegações 2', 'Todos 56'].map((tab, index) => (
                      <button key={tab} className={`min-w-max ${index === 0 ? 'border-b-2 border-primary pb-3 text-foreground' : 'pb-3 text-muted-foreground'}`}>{tab}</button>
                    ))}
                  </div>
                </div>
                <FilterButton />
              </div>
              <ReportsTable approvals />
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>Mostrando 1 a 6 de 12 aprovações</span>
                <div className="neo-mobile-scroll -mx-1 px-1">
                  <div className="neo-scroll-content flex gap-2">
                    {['‹', '1', '2', '›'].map((item) => <button key={item} className={`neo-icon-button h-9 w-9 ${item === '1' ? 'bg-primary text-primary-foreground' : ''}`}>{item}</button>)}
                  </div>
                </div>
              </div>
            </Panel>

            <aside className="space-y-4">
              <Panel title="Histórico de decisões" action={<button className="text-sm font-medium text-emerald-400">Ver tudo</button>}>
                <DecisionList />
                <button className="neo-action-button mt-4 w-full justify-between">Ver todas as decisões <ArrowRight className="h-4 w-4" /></button>
              </Panel>
              <Panel title="Regras e delegações" action={<button className="text-sm font-medium text-emerald-400">Gerenciar</button>}>
                <div className="space-y-2">
                  <SmallArrowRow icon={ShieldCheck} title="Regras de aprovação" subtitle="2 regras ativas • SLA: 24h" tone="purple" />
                  <SmallArrowRow icon={Users} title="Minhas delegações" subtitle="2 delegações ativas" tone="amber" />
                  <SmallArrowRow icon={Users} title="Substitutos" subtitle="1 substituto configurado" tone="blue" />
                </div>
              </Panel>
            </aside>
          </div>

          <div className="neo-surface mt-4 rounded-xl p-4 text-sm text-muted-foreground">
            Dica: Use os filtros para focar no que precisa de atenção. Aprovações em atraso são destacadas em vermelho.
          </div>
        </div>
      </div>
      <FloatingAssistant currentLevel="approvals" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default Approvals;
