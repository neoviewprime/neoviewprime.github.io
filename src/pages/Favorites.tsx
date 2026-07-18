import React from 'react';
import { AlertTriangle, BarChart3, Clock3, FileSpreadsheet, FileText, Folder, Star, TrendingUp, Zap } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, QuickTabs, SearchControl, SmallArrowRow } from '@/components/neo/NeoReferenceUI';

const Favorites: React.FC = () => (
  <>
    <div className="neo-page">
      <div className="neo-page-inner">
        <PageTitle
          icon={Star}
          iconTone="amber"
          title="Favoritos"
          description="Acesso rápido aos relatórios e indicadores mais importantes para você."
          actions={<button className="neo-action-button text-amber-300"><Star className="h-4 w-4" /> Gerenciar favoritos</button>}
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <QuickTabs items={['Relatórios', 'Indicadores']} />
          <div className="w-full sm:max-w-xs"><SearchControl placeholder="Buscar nos favoritos..." /></div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <Panel title="Coleções" action={<button className="text-sm font-medium text-emerald-400">Ver todas ›</button>}>
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  ['Executive Overview', 'Visão geral estratégica', '8 relatórios', 'green'],
                  ['Financeiro & Contábil', 'Análises financeiras', '6 relatórios', 'purple'],
                  ['Operações & Produção', 'Performance operacional', '7 relatórios', 'amber'],
                  ['Comercial & Vendas', 'Inteligência comercial', '5 relatórios', 'blue'],
                ].map(([title, sub, count, tone]) => (
                  <div key={title} className="min-w-0 rounded-xl border border-border/60 bg-white/[0.025] p-4">
                    <Folder className={`mb-3 h-9 w-9 ${tone === 'green' ? 'text-emerald-300' : tone === 'purple' ? 'text-violet-300' : tone === 'amber' ? 'text-amber-300' : 'text-sky-300'}`} />
                    <div className="flex min-w-0 justify-between gap-3"><p className="break-words font-medium text-foreground">{title}</p><Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" /></div>
                    <p className="mt-2 break-words text-sm text-muted-foreground">{sub}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{count}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Relatórios favoritos" action={<button className="text-sm font-medium text-emerald-400">Ver todas ›</button>}>
              <div className="grid gap-3 md:grid-cols-2">
                {['Relatório S.A. Comercial Q4 2024', 'DRE Consolidado Dezembro', 'Estratégia de Expansão 2025', 'Dashboard Operacional - Dezembro', 'Fluxo de Caixa Projetado', 'Plano Comercial 2025'].map((title, index) => (
                  <div key={title} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-white/[0.025] p-3">
                    {index % 3 === 0 ? <FileText className="h-9 w-9 shrink-0 text-red-300" /> : <FileSpreadsheet className="h-9 w-9 shrink-0 text-emerald-300" />}
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium text-foreground">{title}</p>
                      <p className="text-sm text-muted-foreground">{index % 2 ? 'Financeiro' : 'Comercial'}</p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">19/12/2024</span>
                    <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Acesso recente">
              {['Comparativo Geração x Consumo 2024', 'Pesquisa Satisfação Corporativa 2024', 'Apresentação Resultados do Mês', 'Análise de Custos e Despesas', 'Relatório de Sustentabilidade 2024'].map((title) => (
                <div key={title} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3 text-sm last:border-0">
                  <span className="min-w-0 flex-1 break-words text-foreground">{title}</span><span className="shrink-0 text-muted-foreground">15/12/2024</span><Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" />
                </div>
              ))}
            </Panel>
          </div>

          <aside className="space-y-4">
            <Panel title="Insights para você">
              <SmallArrowRow icon={TrendingUp} title="Crescimento nas vendas" subtitle="+12% vs. mês anterior" tone="green" />
              <SmallArrowRow icon={Zap} title="Redução de custos operacionais" subtitle="-8% vs. orçamento" tone="amber" />
              <SmallArrowRow icon={AlertTriangle} title="3 alertas não visualizados" subtitle="Validações críticas pendentes" tone="purple" />
            </Panel>
            <Panel title="Atividade dos favoritos">
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
                <div className="grid h-32 w-32 place-items-center rounded-full border-[14px] border-sky-500 bg-emerald-500/20 text-center">
                  <span className="text-3xl font-bold text-foreground">28</span>
                </div>
                <div className="space-y-3 text-sm">
                  <p><span className="text-sky-300">●</span> Relatórios vistos 18</p>
                  <p><span className="text-emerald-300">●</span> Relatórios criados 6</p>
                  <p><span className="text-amber-300">●</span> Indicadores 4</p>
                </div>
              </div>
            </Panel>
            <Panel title="Recomendações">
              <SmallArrowRow icon={FileSpreadsheet} title="Análise de Rentabilidade por Produto" subtitle="Popular entre usuários da sua área" tone="green" />
            </Panel>
          </aside>
        </div>
      </div>
    </div>
    <FloatingAssistant currentLevel="favorites" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
  </>
);

export default Favorites;
