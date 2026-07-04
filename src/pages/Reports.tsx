import React from 'react';
import { ArrowRight, BarChart3, Calendar, CheckCircle2, Clock3, Eye, FileText, MessageCircle, Send, Upload, XCircle } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { DecisionList, FilterButton, PageTitle, Panel, ReportsTable, SearchControl, SmallArrowRow, StatCard } from '@/components/neo/NeoReferenceUI';

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

          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <StatCard icon={FileText} label="Total" value="128" trend="+12% vs mês anterior ↗" tone="green" />
                <StatCard icon={Clock3} label="Pendentes" value="18" trend="+8% vs mês anterior ↘" tone="amber" />
                <StatCard icon={CheckCircle2} label="Aprovados" value="86" trend="+15% vs mês anterior ↗" tone="green" />
                <StatCard icon={XCircle} label="Rejeitados" value="6" trend="-25% vs mês anterior ↘" tone="red" />
                <StatCard icon={BarChart3} label="Engajamento médio" value="78%" trend="+9 p.p. vs mês anterior ↘" tone="purple" />
              </div>

              <Panel>
                <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
                  <SearchControl placeholder="Buscar por nome, destino ou responsável..." />
                  <button className="neo-action-button"><Calendar className="h-4 w-4" /> 01/05/2024 - 31/05/2024</button>
                  <FilterButton />
                  <button className="neo-icon-button"><BarChart3 className="h-4 w-4" /></button>
                </div>
                <div className="mb-4 grid grid-cols-5 overflow-hidden rounded-xl border border-border/70 bg-white/[0.035] text-center text-sm">
                  {['Todos', 'Rascunhos 12', 'Pendentes 18', 'Aprovados 86', 'Rejeitados 6'].map((tab, index) => (
                    <button key={tab} className={`px-4 py-3 ${index === 0 ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground'}`}>{tab}</button>
                  ))}
                </div>
                <ReportsTable />
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Mostrando 1 a 6 de 128 relatórios</span>
                  <div className="flex gap-2">
                    {['‹', '1', '2', '3', '...', '22', '›'].map((item) => <button key={item} className={`neo-icon-button h-9 w-9 ${item === '1' ? 'bg-primary text-primary-foreground' : ''}`}>{item}</button>)}
                  </div>
                </div>
              </Panel>
            </div>

            <aside className="space-y-4">
              <Panel title="Relatórios em destaque" action={<button className="text-sm font-medium text-emerald-400">Ver todos</button>}>
                <div className="rounded-xl border border-border/60 bg-white/[0.025] p-4 text-center">
                  <div className="mx-auto h-28 w-20 rounded-md bg-gradient-to-br from-white to-emerald-500 p-2 text-[9px] font-bold text-emerald-950">RELATÓRIO SLA COMERCIAL Q4</div>
                  <p className="mt-3 text-sm font-semibold text-foreground">Relatório SLA Comercial Q4 2024.pdf</p>
                  <p className="mt-1 text-xs text-muted-foreground">Aprovado em 19/12/2024</p>
                  <span className="mt-4 inline-flex rounded-full bg-emerald-500/16 px-3 py-1 text-xs text-emerald-300">Mais visualizado</span>
                  <div className="mt-4 flex justify-center gap-5 text-xs text-muted-foreground">
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
