import React from 'react';
import { ArrowRight, BarChart3, Calendar, CheckCircle2, Clock3, Eye, FileText, MessageCircle, Send, Upload, XCircle } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { DecisionList, FilterButton, PageTitle, Panel, ReportsTable, SearchControl, SmallArrowRow, StatCard } from '@/components/neo/NeoReferenceUI';

const reportTabs = ['Todos', 'Rascunhos 12', 'Pendentes 18', 'Aprovados 86', 'Rejeitados 6'];

const Reports: React.FC = () => {
  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageTitle
            title="Meus Relatórios"
            description="Acompanhe, gerencie e compartilhe seus relatórios com segurança e agilidade."
            actions={<button className="neo-primary-button"><Upload className="h-4 w-4" /> Enviar relatório</button>}
          />

          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={FileText} label="Total" value="128" trend="+12% vs mês anterior ↗" tone="green" />
                <StatCard icon={Clock3} label="Pendentes" value="18" trend="+8% vs mês anterior ↘" tone="amber" />
                <StatCard icon={CheckCircle2} label="Aprovados" value="86" trend="+15% vs mês anterior ↗" tone="green" />
                <StatCard icon={XCircle} label="Rejeitados" value="6" trend="-25% vs mês anterior ↘" tone="red" />
                <StatCard icon={BarChart3} label="Engajamento médio" value="78%" trend="+9 p.p. vs mês anterior ↘" tone="purple" />
              </div>

              <Panel>
                <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <SearchControl placeholder="Buscar por nome, destino ou responsável..." />
                  <button className="neo-action-button"><Calendar className="h-4 w-4" /> 01/05/2024 - 31/05/2024</button>
                  <FilterButton />
                  <button className="neo-icon-button"><BarChart3 className="h-4 w-4" /></button>
                </div>
                <div className="neo-mobile-scroll mb-4 rounded-xl border border-border/70 bg-white/[0.035] text-sm">
                  <div className="neo-scroll-content grid grid-cols-5 text-center">
                    {reportTabs.map((tab, index) => (
                      <button
                        key={tab}
                        className={`min-w-[8.6rem] px-4 py-3 ${index === 0 ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <ReportsTable />
                <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>Mostrando 1 a 6 de 128 relatórios</span>
                  <div className="neo-mobile-scroll -mx-1 px-1">
                    <div className="neo-scroll-content flex gap-2">
                    {['‹', '1', '2', '3', '...', '22', '›'].map((item) => <button key={item} className={`neo-icon-button h-9 w-9 ${item === '1' ? 'bg-primary text-primary-foreground' : ''}`}>{item}</button>)}
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            <aside className="min-w-0 space-y-4">
              <Panel title="Relatórios em destaque" action={<button className="text-sm font-medium text-emerald-400">Ver todos</button>}>
                <div className="rounded-xl border border-border/60 bg-white/[0.025] p-4 text-center">
                  <div className="mx-auto flex h-28 w-20 items-center justify-center rounded-md bg-gradient-to-br from-white to-emerald-500 p-2 text-[9px] font-bold leading-3 text-emerald-950">
                    RELATÓRIO SLA COMERCIAL Q4
                  </div>
                  <p className="mt-3 break-words text-sm font-semibold text-foreground">Relatório SLA Comercial Q4 2024.pdf</p>
                  <p className="mt-1 text-xs text-muted-foreground">Aprovado em 19/12/2024</p>
                  <span className="mt-4 inline-flex rounded-full bg-emerald-500/16 px-3 py-1 text-xs text-emerald-300">Mais visualizado</span>
                  <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-4 w-4" />245 visualizações</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />6 comentários</span>
                  </div>
                  <button className="neo-action-button mt-4 w-full">Abrir relatório <ArrowRight className="h-4 w-4" /></button>
                </div>
              </Panel>

              <Panel title="Atividade recente" action={<button className="text-sm font-medium text-emerald-400">Ver tudo</button>}>
                <div className="space-y-2">
                  <SmallArrowRow title="Maria Silva visualizou um relatório" subtitle="Relatório SLA Comercial Q4 2024.pdf" tone="green" />
                  <SmallArrowRow title="Carlos Lima comentou" subtitle="Dashboard Operacional Dezembro.pdf" tone="amber" />
                  <SmallArrowRow title="Ana Costa aprovou um relatório" subtitle="Estratégias Recuperação de Energia 2024.pdf" tone="purple" />
                  <SmallArrowRow icon={Send} title="Relatório enviado para validação" subtitle="Comparativo Geração x Consumo 2024.xlsx" tone="green" />
                </div>
              </Panel>

              <Panel>
                <DecisionList />
              </Panel>
            </aside>
          </div>
        </div>
      </div>
      <FloatingAssistant currentLevel="reports" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default Reports;
