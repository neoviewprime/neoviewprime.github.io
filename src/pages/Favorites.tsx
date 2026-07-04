import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { ReportCard } from '@/components/ReportCard';
import { AlertTriangle, BarChart3, Clock3, FileSpreadsheet, FileText, Folder, Search, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { ActivityRow, EmptyState, FilterChip, PageHeader, PremiumPanel } from '@/components/premium/PremiumShell';
import {
  listFavoriteReports,
  subscribeFavoriteReports,
  syncFavoriteReportsFromBackend,
  updateFavoriteReportMetrics,
  type FavoriteReportEntry
} from '@/lib/reportFavorites';
import { useAuth } from '@/hooks/useAuth';
import type { ChatPageContext } from '@/types/backend';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'indicators'>('reports');
  const [favoriteReports, setFavoriteReports] = useState<FavoriteReportEntry[]>([]);

  useEffect(() => {
    const reload = () => setFavoriteReports(listFavoriteReports(user?.id));
    reload();
    void syncFavoriteReportsFromBackend(user?.id).then(reload);
    return subscribeFavoriteReports(reload);
  }, [user?.id]);

  const filteredReports = useMemo(
    () =>
      favoriteReports.filter((entry) =>
        `${entry.report.name} ${entry.report.description} ${entry.path.join(' ')}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [favoriteReports, searchQuery]
  );

  const chatPageContext = useMemo<ChatPageContext>(() => {
    const visibleNames = filteredReports.slice(0, 3).map((entry) => entry.report.name);
    return {
      page: 'generic',
      title: 'Favoritos',
      summary: [
        `O usuário está na tela de favoritos.`,
        `Existem ${favoriteReports.length} relatório(s) favorito(s) salvo(s) para esta conta.`,
        searchQuery ? `Busca atual nos favoritos: ${searchQuery}.` : 'Não há filtro digitado na busca de favoritos.',
        visibleNames.length ? `Favoritos mais visiveis agora: ${visibleNames.join(', ')}.` : 'Nenhum favorito aparece com os filtros atuais.'
      ].join(' '),
      hints: []
    };
  }, [favoriteReports.length, filteredReports, searchQuery]);

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageHeader
            icon={Star}
            title="Favoritos"
            description="Acesso rápido aos relatórios e indicadores mais importantes para você."
            actions={<button className="neo-pill px-4 py-2 text-sm font-medium text-foreground"><Star className="mr-2 inline h-4 w-4 text-amber-500" />Gerenciar favoritos</button>}
          />

          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <FilterChip active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}><FileText className="mr-2 inline h-4 w-4" />Relatórios</FilterChip>
              <FilterChip active={activeTab === 'indicators'} onClick={() => setActiveTab('indicators')}><BarChart3 className="mr-2 inline h-4 w-4" />Indicadores</FilterChip>
              <FilterChip active>Todos</FilterChip>
              <FilterChip>Acesso recente</FilterChip>
              <FilterChip>Área de atuação</FilterChip>
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nos favoritos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neo-control h-11 pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <PremiumPanel title="Coleções" actionLabel="Ver todas">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Executive Overview', 'Visão geral estratégica', '8 relatórios', 'green'],
                    ['Financeiro & Contábil', 'Análises financeiras', '6 relatórios', 'purple'],
                    ['Operações & Produção', 'Performance operacional', '7 relatórios', 'amber'],
                    ['Comercial & Vendas', 'Inteligência comercial', '5 relatórios', 'blue'],
                  ].map(([title, subtitle, meta, tone]) => (
                    <div key={title} className="rounded-[22px] border border-border/70 bg-background/55 p-4 dark:bg-white/[0.035]">
                      <div className="mb-4 flex items-center justify-between">
                        <Folder className={`h-8 w-8 ${tone === 'green' ? 'text-emerald-500' : tone === 'purple' ? 'text-violet-500' : tone === 'amber' ? 'text-amber-500' : 'text-sky-500'}`} />
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </div>
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                      <p className="mt-3 text-xs text-muted-foreground">{meta}</p>
                    </div>
                  ))}
                </div>
              </PremiumPanel>

              <PremiumPanel title={activeTab === 'reports' ? 'Relatórios favoritos' : 'Indicadores favoritos'} actionLabel="Ver todos">
                {activeTab === 'reports' && (
                  filteredReports.length === 0 ? (
                    <EmptyState
                      icon={Star}
                      title="Nenhum favorito encontrado"
                      description="Marque com estrela um relatório na hierarquia final para ele aparecer aqui."
                      actionLabel="Ir para relatórios"
                      onAction={() => navigate('/reports')}
                    />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {filteredReports.map((entry) => (
                        <div key={entry.report.id} className="space-y-2">
                          {entry.path.length ? <p className="text-xs text-muted-foreground">Caminho: {entry.path.join(' > ')}</p> : null}
                          <ReportCard
                            report={entry.report}
                            reportPath={entry.path}
                            companyId={entry.companyId}
                            onMetricsChange={(reportId, metrics) => updateFavoriteReportMetrics(reportId, metrics, user?.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )
                )}

                {activeTab === 'indicators' && (
                  <EmptyState
                    icon={BarChart3}
                    title="Nenhum indicador favoritado"
                    description="Quando você salvar indicadores estratégicos, eles aparecerão organizados nesta área."
                    actionLabel="Abrir estatísticas"
                    onAction={() => navigate('/indicators')}
                  />
                )}
              </PremiumPanel>

              <PremiumPanel title="Acesso recente" actionLabel="Ver todos">
                <div className="space-y-3">
                  {['Comparativo Geração x Consumo 2024', 'Pesquisa Satisfação Corporativa 2024', 'Apresentação Resultados do Mês', 'Análise de Custos e Despesas'].map((item, index) => (
                    <ActivityRow key={item} icon={index % 2 ? FileText : FileSpreadsheet} title={item} subtitle={index % 2 ? 'RH' : 'Planejamento'} meta={`${15 - index}/12/2024`} tone={index % 2 ? 'red' : 'green'} />
                  ))}
                </div>
              </PremiumPanel>
            </div>

            <aside className="space-y-6">
              <PremiumPanel title="Insights para você">
                <div className="space-y-3">
                  <ActivityRow icon={TrendingUp} title="Crescimento nas vendas" subtitle="+12% vs. mês anterior" tone="green" />
                  <ActivityRow icon={Zap} title="Redução de custos operacionais" subtitle="-8% vs. orçamento" tone="amber" />
                  <ActivityRow icon={AlertTriangle} title="3 alertas não visualizados" subtitle="Validações críticas pendentes" tone="purple" />
                </div>
              </PremiumPanel>

              <PremiumPanel title="Atividade dos favoritos">
                <div className="rounded-[24px] border border-border/70 bg-background/55 p-5 text-center dark:bg-white/[0.035]">
                  <p className="text-4xl font-semibold text-foreground">{favoriteReports.length || 28}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Acessos nos últimos 7 dias</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Relatórios vistos: <span className="float-right text-foreground">18</span></p>
                  <p>Relatórios criados: <span className="float-right text-foreground">6</span></p>
                  <p>Indicadores: <span className="float-right text-foreground">4</span></p>
                </div>
              </PremiumPanel>

              <PremiumPanel title="Recomendações">
                <ActivityRow icon={FileSpreadsheet} title="Análise de Rentabilidade por Produto" subtitle="Popular entre usuários da sua área" tone="green" />
                <button type="button" className="mt-4 w-full rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-primary">Ver mais recomendações</button>
              </PremiumPanel>
            </aside>
          </div>
        </div>
      </div>

      <FloatingAssistant
        currentLevel="companies"
        selectedCompanyId={undefined}
        selectedSupId={undefined}
        selectedMgmtId={undefined}
        selectedProjId={undefined}
        pageContext={chatPageContext}
      />
    </>
  );
};

export default Favorites;
