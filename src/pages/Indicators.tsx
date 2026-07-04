import React from 'react';
import { BarChart3, CheckCircle2, Clock3, Download, LineChart, Plus, RefreshCcw, Save, Share2, WalletCards, XCircle } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { CompanySelect, MiniChart, PageTitle, Panel, QuickTabs, StatCard } from '@/components/neo/NeoReferenceUI';

const Indicators: React.FC = () => {
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
                <button className="neo-action-button"><Share2 className="h-4 w-4" /> Compartilhar</button>
                <button className="neo-action-button"><Download className="h-4 w-4" /> Exportar</button>
                <button className="neo-primary-button"><Save className="h-4 w-4" /> Salvar como modelo</button>
              </>
            }
          />

          <Panel className="mb-3">
            <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Empresa</p>
                <CompanySelect />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Modelos salvos</p>
                <QuickTabs items={['Visão Executiva', 'Desempenho Operacional', 'Indicadores ESG', 'Financeiro Consolidado', '+ Ver todos']} />
              </div>
            </div>
          </Panel>

          <Panel className="mb-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-foreground">Período</span>
              <button className="neo-action-button">01/05/2024 - 31/05/2024</button>
              <QuickTabs items={['7D', '30D', '3M', '6M', '12M', 'Personalizado']} active={1} />
              <span className="ml-auto text-sm font-medium text-foreground">Comparar com</span>
              <button className="neo-action-button">Período anterior</button>
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
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Evolução de aprovações e rejeições</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Período: 01/05/2024 a 31/05/2024 • Comparação: Período anterior</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="neo-action-button"><LineChart className="h-4 w-4" /> Linha</button>
                    <button className="neo-action-button">Por dia</button>
                  </div>
                </div>
                <MiniChart />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-white/[0.025] p-4">
                    <p className="text-sm text-muted-foreground">Média diária de aprovações</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">46,2 <span className="text-sm text-emerald-300">↗ 11% vs período anterior</span></p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-white/[0.025] p-4">
                    <p className="text-sm text-muted-foreground">Média diária de rejeições</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">3,1 <span className="text-sm text-red-300">↘ 9% vs período anterior</span></p>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Configurar gráfico">
              <p className="mb-4 text-sm text-muted-foreground">Selecione os dados e o formato para sua visualização.</p>
              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Métricas</p>
                  {['Aprovados', 'Rejeitados'].map((item, index) => (
                    <div key={item} className="mb-2 flex items-center justify-between rounded-lg border border-border/70 bg-white/[0.025] px-3 py-2 text-sm">
                      <span className="flex items-center gap-2"><span className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />{item}</span>
                      <span className="text-muted-foreground">×</span>
                    </div>
                  ))}
                  <button className="neo-action-button w-full justify-between"><span><Plus className="mr-2 inline h-4 w-4" />Adicionar métrica</span>⌄</button>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Agrupar por</p>
                  <QuickTabs items={['Dia', 'Semana', 'Mês', 'Trimestre', 'Personalizado']} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Tipo de gráfico</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Linha', 'Colunas', 'Barras', 'Área', 'Pizza', 'Rosca'].map((type, index) => (
                      <button key={type} className={`rounded-lg border px-3 py-3 text-sm ${index === 0 ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border/70 bg-white/[0.025] text-muted-foreground'}`}>
                        <BarChart3 className="mx-auto mb-1 h-5 w-5" />{type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {['Mostrar valores', 'Mostrar comparação', 'Mostrar média'].map((item, index) => (
                    <label key={item} className="flex items-center gap-2 text-muted-foreground"><input type="checkbox" defaultChecked={index < 2} className="rounded border-border bg-transparent" />{item}</label>
                  ))}
                </div>
                <button className="neo-primary-button w-full"><RefreshCcw className="h-4 w-4" /> Aplicar alterações</button>
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
