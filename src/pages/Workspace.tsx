import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  Clock3,
  FileText,
  Lightbulb,
  Save,
  TrendingUp,
  Users,
} from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import {
  CompanySelect,
  DecisionList,
  MiniChart,
  PageTitle,
  Panel,
  SmallArrowRow,
  StatCard,
} from '@/components/neo/NeoReferenceUI';

const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [period, setPeriod] = useState('Últimos 6 meses');

  const openReport = (name: string) => {
    toast.success('Relatório aberto', {
      description: `${name} foi carregado na visão demonstrativa.`,
    });
  };

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <div className="mb-6 flex flex-col justify-end gap-3 sm:flex-row">
            <CompanySelect onClick={() => navigate('/dashboard?company=coelba')} />
            <button type="button" onClick={() => setFiltersOpen((current) => !current)} className={`neo-action-button ${filtersOpen ? 'border-primary/50 bg-primary/10 text-primary' : ''}`}>Filtros</button>
          </div>
          {filtersOpen ? (
            <div className="neo-surface mb-4 rounded-xl p-4 text-sm">
              <p className="font-medium text-foreground">Filtros do workspace</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="neo-chip border-primary/30 bg-primary/10 text-primary">Neoenergia Coelba</span>
                <span className="neo-chip">Diretoria Executiva</span>
                <span className="neo-chip">Apenas pendências críticas</span>
              </div>
            </div>
          ) : null}

          <PageTitle
            title="Bem-vindo, João 👋"
            description="Aqui está o panorama executivo da Neoenergia Coelba para apoiar suas decisões."
          />

          <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={CheckSquare} label="Relatórios aprovados" value="44" trend="+10% vs mês anterior ↗" tone="green" />
            <StatCard icon={Clock3} label="Pendências críticas" value="2" trend="-20% vs mês anterior ↘" tone="amber" />
            <StatCard icon={Save} label="Relatórios salvos" value="18" trend="+8% vs mês anterior ↗" tone="blue" />
            <StatCard icon={BarChart3} label="Gráficos criados" value="36" trend="+15% vs mês anterior ↗" tone="purple" />
            <StatCard icon={Clock3} label="Tempo médio de aprovação" value="1,8h" trend="-0,6h vs mês anterior ↘" tone="blue" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_1.18fr_0.88fr]">
            <Panel title="Prioridades da sua fila" action={<button type="button" onClick={() => navigate('/approvals')} className="text-sm font-medium text-emerald-400">Ver fila completa</button>}>
              <div className="space-y-1">
                {[
                  ['Relatório SLA Comercial Q4 2024.pdf', 'Enviado por Maria Silva  •  19/12/2024', 'Alta prioridade', 'text-red-300 bg-red-500/16'],
                  ['Dashboard Operacional Dezembro.pdf', 'Enviado por Carlos Lima  •  18/12/2024', 'Média prioridade', 'text-amber-300 bg-amber-500/16'],
                  ['Estratégias Recuperação Crédito.pdf', 'Enviado por Ana Costa  •  17/12/2024', 'Baixa prioridade', 'text-sky-300 bg-sky-500/16'],
                ].map(([title, meta, tag, tagClass]) => (
                  <button type="button" key={title} onClick={() => navigate('/approvals')} className="flex w-full flex-col gap-3 border-b border-border/60 py-3 text-left last:border-0 sm:flex-row sm:items-center">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <FileText className="hidden h-5 w-5 shrink-0 text-red-300 sm:block" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-foreground">{title}</p>
                      <p className="mt-1 break-words text-xs text-muted-foreground">{meta}</p>
                    </div>
                    <span className={`w-fit rounded-lg px-2 py-1 text-xs ${tagClass}`}>{tag}</span>
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>Atualizado agora há poucos minutos</span>
                <button type="button" onClick={() => navigate('/approvals')} className="neo-action-button py-2 text-xs"><Users className="h-4 w-4" /> Atribuir delegações</button>
              </div>
            </Panel>

            <Panel title="Aprovações nos últimos 6 meses" action={<button type="button" onClick={() => setPeriod(period === 'Últimos 6 meses' ? 'Últimos 30 dias' : 'Últimos 6 meses')} className="neo-action-button py-2 text-xs">{period}</button>}>
              <MiniChart />
              <p className="mt-3 text-emerald-300">↗ +12% de aprovações no período</p>
            </Panel>

            <Panel title="Decisões recentes" action={<button type="button" onClick={() => navigate('/approvals')} className="text-sm font-medium text-emerald-400">Ver todas</button>}>
              <DecisionList />
              <button type="button" onClick={() => navigate('/approvals')} className="neo-action-button mt-3">Ir para validações <ArrowRight className="h-4 w-4" /></button>
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[0.92fr_0.98fr_1fr]">
            <Panel title="Relatórios de destaque" action={<button type="button" onClick={() => navigate('/reports')} className="text-sm font-medium text-emerald-400">Ver todos</button>}>
              <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-white/[0.025] p-4 sm:flex-row sm:items-center">
                <div className="flex h-24 w-full items-center justify-center rounded-md bg-gradient-to-br from-white to-emerald-500 p-2 text-center text-[9px] font-bold leading-3 text-emerald-950 sm:w-20 sm:shrink-0">RELATÓRIO SLA COMERCIAL Q4</div>
                <div className="min-w-0 flex-1">
                  <p className="break-words font-medium text-foreground">Relatório SLA Comercial Q4 2024.pdf</p>
                  <p className="mt-2 text-sm text-muted-foreground">Neoenergia Coelba</p>
                  <p className="mt-3 text-xs text-muted-foreground">v1 · PDF · 19/12/2024</p>
                  <button type="button" onClick={() => openReport('Relatório SLA Comercial Q4 2024.pdf')} className="neo-action-button mt-3">Abrir relatório <ArrowRight className="h-4 w-4" /></button>
                </div>
              </div>
            </Panel>

            <Panel title="Atividade compartilhada" action={<button type="button" onClick={() => navigate('/reports')} className="text-sm font-medium text-emerald-400">Ver tudo</button>}>
              <div className="space-y-2">
                <SmallArrowRow onClick={() => openReport('Relatório Recuperação Energia 2024.pdf')} title="Maria Silva compartilhou um relatório com você" subtitle="Relatório Recuperação Energia 2024.pdf" tone="green" />
                <SmallArrowRow onClick={() => openReport('Dashboard Operacional Dezembro.pdf')} title="Carlos Lima comentou no relatório" subtitle="Dashboard Operacional Dezembro.pdf" tone="amber" />
                <SmallArrowRow onClick={() => navigate('/indicators')} title="Ana Costa compartilhou um gráfico com você" subtitle="Gráfico: Inadimplência por Região" tone="blue" />
              </div>
            </Panel>

            <Panel title="Insights rápidos">
              <div className="space-y-2">
                <SmallArrowRow onClick={() => navigate('/indicators')} icon={TrendingUp} title="Crescimento nas aprovações" subtitle="As aprovações aumentaram 12% nos últimos 6 meses." tone="green" />
                <SmallArrowRow onClick={() => navigate('/indicators')} icon={Clock3} title="Redução no tempo médio" subtitle="O tempo médio de aprovação caiu 0,6h vs mês anterior." tone="purple" />
                <SmallArrowRow onClick={() => toast.info('Insight salvo', { description: 'Esse insight foi marcado para acompanhamento no workspace.' })} icon={Lightbulb} title="Mais colaboração" subtitle="A atividade compartilhada aumentou 18% este mês." tone="amber" />
              </div>
            </Panel>
          </div>

          <div className="neo-surface mt-4 flex flex-col gap-3 rounded-xl p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="flex min-w-0 items-start gap-2"><Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /> <span className="break-words">Dica: Use delegações para garantir agilidade nas aprovações durante ausências e férias.</span></span>
            <button type="button" onClick={() => navigate('/approvals')} className="neo-action-button">Configurar delegações <ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      <FloatingAssistant currentLevel="companies" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default Workspace;
