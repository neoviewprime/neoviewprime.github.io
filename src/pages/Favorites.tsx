import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { ReportCard } from '@/components/ReportCard';
import { Star, FileText, BarChart3, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FloatingAssistant } from '@/components/FloatingAssistant';
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
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            Favoritos
          </h1>
          <p className="text-muted-foreground mt-1">
            Relatorios marcados com estrela e mantidos com as mesmas interacoes da hierarquia final.
          </p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            Relatorios
          </button>

          <button
            onClick={() => setActiveTab('indicators')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'indicators'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Indicadores
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar nos favoritos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {activeTab === 'reports' && (
          <>
            {filteredReports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum favorito encontrado</h3>
                  <p className="text-muted-foreground">
                    Marque com estrela um relatório na hierarquia final para ele aparecer aqui.
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="text-sm text-primary hover:underline"
                    >
                      Ir para a hierarquia de relatorios
                    </button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((entry) => (
                  <div key={entry.report.id} className="space-y-2">
                    {entry.path.length ? (
                      <p className="text-xs text-muted-foreground">
                        Caminho: {entry.path.join(' > ')}
                      </p>
                    ) : null}
                    <ReportCard
                      report={entry.report}
                      reportPath={entry.path}
                      companyId={entry.companyId}
                      onMetricsChange={(reportId, metrics) => updateFavoriteReportMetrics(reportId, metrics, user?.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'indicators' && (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum indicador favoritado</h3>
              <p className="text-muted-foreground">
                Por enquanto os favoritos ativos estao ligados aos relatorios da hierarquia final.
              </p>
            </CardContent>
          </Card>
        )}
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
