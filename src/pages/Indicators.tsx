import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart3, CheckCircle2, Clock3, Download, LineChart, Plus, RefreshCcw, Save, Share2, WalletCards, XCircle } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { CompanySelect, MiniChart, PageTitle, Panel, QuickTabs, StatCard } from '@/components/neo/NeoReferenceUI';

const Indicators: React.FC = () => {
  const navigate = useNavigate();
  const [activeModel, setActiveModel] = useState(0);
  const [activePeriod, setActivePeriod] = useState(1);
  const [activeGroup, setActiveGroup] = useState(0);
  const [chartType, setChartType] = useState('Linha');
  const [metrics, setMetrics] = useState(['Aprovados', 'Rejeitados']);
  const [showValues, setShowValues] = useState(true);
  const [showComparison, setShowComparison] = useState(true);
  const [showAverage, setShowAverage] = useState(false);

  const addMetric = () => {
    const candidates = ['Pendentes', 'No prazo', 'Visualizações', 'Comentários'];
    const nextMetric = candidates.find((item) => !metrics.includes(item));
    if (!nextMetric) {
      toast.info('Todas as métricas da demonstração já foram adicionadas.');
      return;
    }
    setMetrics((items) => [...items, nextMetric]);
    toast.success('Métrica adicionada', { description: `${nextMetric} entrou na configuração do gráfico.` });
  };

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageTitle
            icon={BarChart3}
            title="Estatísticas"
            description="Crie gráficos personalizados com dados confiáveis para análises estratégicas."
            actions={
              <>
                <button type="button" onClick={() => toast.success('Link copiado', { description: 'O link do painel de estatísticas foi copiado para compartilhamento.' })} className="neo-action-button"><Share2 className="h-4 w-4" /> Compartilhar</button>
                <button type="button" onClick={() => toast.success('Exportação preparada', { description: 'O arquivo PNG do gráfico foi preparado na demonstração.' })} className="neo-action-button"><Download className="h-4 w-4" /> Exportar</button>
                <button type="button" onClick={() => toast.success('Modelo salvo', { description: `${['Visão Executiva', 'Desempenho Operacional', 'Indicadores ESG', 'Financeiro Consolidado'][activeModel] ?? 'Modelo'} foi salvo como favorito.` })} className="neo-primary-button"><Save className="h-4 w-4" /> Salvar como modelo</button>
              </>
            }
          />

          <Panel className="mb-3">
            <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Empresa</p>
                <CompanySelect onClick={() => navigate('/dashboard?company=coelba')} />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Modelos salvos</p>
                <QuickTabs
                  items={['Visão Executiva', 'Desempenho Operacional', 'Indicadores ESG', 'Financeiro Consolidado', '+ Ver todos']}
                  active={activeModel}
                  onChange={(index, item) => {
                    if (item.startsWith('+')) {
                      toast.info('Modelos disponíveis', { description: '4 modelos salvos estão disponíveis nesta demonstração.' });
                      return;
                    }
                    setActiveModel(index);
                  }}
                />
              </div>
            </div>
          </Panel>

          <Panel className="mb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-sm font-medium text-foreground">Período</span>
              <button type="button" onClick={() => toast.info('Período personalizado', { description: '01/05/2024 a 31/05/2024 aplicado ao gráfico.' })} className="neo-action-button">01/05/2024 - 31/05/2024</button>
              <QuickTabs items={['7D', '30D', '3M', '6M', '12M', 'Personalizado']} active={activePeriod} onChange={(index) => setActivePeriod(index)} />
              <span className="text-sm font-medium text-foreground sm:ml-auto">Comparar com</span>
              <button type="button" onClick={() => setShowComparison((value) => !value)} className={`neo-action-button ${showComparison ? 'border-primary/40 text-primary' : ''}`}>Período anterior</button>
            </div>
          </Panel>

          <div className="grid gap-3 xl:grid-cols-[1fr_500px]">
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-4">
                <StatCard icon={WalletCards} label="Total" value="128" trend="+12% vs período anterior" tone="blue" />
                <StatCard icon={CheckCircle2} label="Aprovados" value="86" trend="+15% vs período anterior" tone="green" />
                <StatCard icon={Clock3} label="Pendentes" value="18" trend="-8% vs período anterior" tone="amber" />
                <StatCard icon={XCircle} label="Rejeitados" value="6" trend="-25% vs período anterior" tone="red" />
              </div>

              <Panel>
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-foreground">Evolução de aprovações e rejeições</h2>
                    <p className="mt-1 break-words text-sm text-muted-foreground">Período: 01/05/2024 a 31/05/2024 • Comparação: Período anterior</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={() => setChartType('Linha')} className="neo-action-button"><LineChart className="h-4 w-4" /> {chartType}</button>
                    <button type="button" onClick={() => setActiveGroup((index) => (index + 1) % 3)} className="neo-action-button">{['Por dia', 'Por semana', 'Por mês'][activeGroup]}</button>
                  </div>
                </div>
                <MiniChart />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-white/[0.025] p-4">
                    <p className="text-sm text-muted-foreground">Média diária de aprovações</p>
                    <p className="mt-2 break-words text-2xl font-semibold text-foreground">46,2 <span className="text-sm text-emerald-300">↗ 11% vs período anterior</span></p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-white/[0.025] p-4">
                    <p className="text-sm text-muted-foreground">Média diária de rejeições</p>
                    <p className="mt-2 break-words text-2xl font-semibold text-foreground">3,1 <span className="text-sm text-red-300">↘ 9% vs período anterior</span></p>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Configurar gráfico">
              <p className="mb-4 text-sm text-muted-foreground">Selecione os dados e o formato para sua visualização.</p>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Métricas</p>
                  {metrics.map((item, index) => (
                    <div key={item} className="mb-2 flex items-center justify-between rounded-lg border border-border/70 bg-white/[0.025] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />{item}</span>
                      <button type="button" onClick={() => setMetrics((items) => items.filter((metric) => metric !== item))} className="text-muted-foreground hover:text-red-300" aria-label={`Remover métrica ${item}`}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMetric} className="neo-action-button w-full justify-between"><span><Plus className="mr-2 inline h-4 w-4" />Adicionar métrica</span>⌄</button>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Agrupar por</p>
                  <QuickTabs items={['Dia', 'Semana', 'Mês', 'Trimestre', 'Personalizado']} active={activeGroup} onChange={(index) => setActiveGroup(index)} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Tipo de gráfico</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Linha', 'Colunas', 'Barras', 'Área', 'Pizza', 'Rosca'].map((type) => (
                      <button type="button" onClick={() => setChartType(type)} key={type} className={`rounded-lg border px-3 py-3 text-sm ${chartType === type ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border/70 bg-white/[0.025] text-muted-foreground'}`}>
                        <BarChart3 className="mx-auto mb-1 h-5 w-5" />{type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={showValues} onChange={() => setShowValues((value) => !value)} className="rounded border-border bg-transparent" />Mostrar valores</label>
                  <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={showComparison} onChange={() => setShowComparison((value) => !value)} className="rounded border-border bg-transparent" />Mostrar comparação</label>
                  <label className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" checked={showAverage} onChange={() => setShowAverage((value) => !value)} className="rounded border-border bg-transparent" />Mostrar média</label>
                </div>
                <button type="button" onClick={() => toast.success('Gráfico atualizado', { description: `${chartType} com ${metrics.length} métrica(s), agrupado por ${['dia', 'semana', 'mês', 'trimestre', 'personalizado'][activeGroup]}.` })} className="neo-primary-button w-full"><RefreshCcw className="h-4 w-4" /> Aplicar alterações</button>
              </div>
            </Panel>
          </div>
        </div>
      </div>
      <FloatingAssistant currentLevel="indicators" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default Indicators;
