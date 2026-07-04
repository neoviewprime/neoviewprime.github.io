/**
 * RankingPanel - Top 5 reports ranking
 * Supports embedded mode (inline, no fixed positioning)
 */

import React, { useState } from 'react';
import { Trophy, Eye, Medal, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { companies, getAllReports } from '@/data/mockData';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface RankingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: 'companies' | 'superintendences' | 'managements' | 'projects' | 'indicators';
  selectedCompanyId?: string;
  selectedSupId?: string;
  selectedMgmtId?: string;
  selectedProjId?: string;
  /** If true, renders inline without fixed positioning */
  embedded?: boolean;
}

export function RankingPanel({
  isOpen,
  onClose,
  currentLevel,
  selectedCompanyId,
  embedded,
}: RankingPanelProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  // Novo: estado para expandir/reduzir, igual ao ChatWidget
  const [isExpanded, setIsExpanded] = useState(false);

  const getTitle = () => {
    switch (currentLevel) {
      case 'companies':
        return 'Top Relatórios - Todas Empresas';
      case 'superintendences': {
        const company = companies.find(c => c.id === selectedCompanyId);
        return `Top Relatórios - ${company?.name || 'Empresa'}`;
      }
      case 'managements':
        return 'Top Relatórios - Superintendência';
      case 'projects':
        return 'Top Relatórios - Gerência';
      case 'indicators':
        return 'Top Relatórios - Projeto';
      default:
        return 'Top Relatórios';
    }
  };

  const getFilteredReports = () => {
    const allReports = getAllReports();
    let filtered = allReports;
    if (selectedCompanyId) {
      filtered = filtered.filter(r => r.companyId === selectedCompanyId);
    }
    return filtered
      .map((r, index) => ({
        ...r,
        views: Math.floor(Math.random() * 500) + (filtered.length - index) * 10,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const topReports = getFilteredReports();

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Medal className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {position + 1}
          </span>
        );
    }
  };

  const getMedalBg = (position: number) => {
    switch (position) {
      case 0:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 1:
        return 'bg-gray-400/10 border-gray-400/30';
      case 2:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-muted/50 border-border';
    }
  };

  if (!isOpen && embedded) return null;

  // ===== Embedded mode - inline card (usado pelo FloatingAssistant) =====
  if (embedded) {
    return (
      <div
        className={cn(
          'bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col',
          isMobile
            ? 'h-[min(72dvh,640px)] w-[min(92vw,420px)]'
            : isExpanded
              ? 'w-[500px] h-[600px]'
              : 'w-[380px] h-[500px]'
        )}
      >
        {/* Header (altura alinhada ao ChatWidget: min-h-[48px], paddings iguais) */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-500 text-white min-h-[48px]">
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold text-sm leading-tight truncate">Ranking</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Toggle expand igual ao ChatWidget */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Reduzir Ranking' : 'Expandir Ranking'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            {/* Fechar */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
              aria-label="Fechar Ranking"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-sm text-foreground">{getTitle()}</h3>
          <p className="text-xs text-muted-foreground mt-1">Relatórios mais acessados</p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {topReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum relatório encontrado</p>
            </div>
          ) : (
            topReports.map((item, index) => (
              <div
                key={item.report.id}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-transform hover:scale-[1.02]',
                  getMedalBg(index)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getMedalIcon(index)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.report.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.path.slice(0, 2).join(' > ')}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.views} visualizações</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ===== Fixed mode (fallback) =====
  return (
    <div
      className={cn(
        'fixed right-0 top-16 h-[calc(100vh-4rem)] bg-card border-l border-border shadow-xl transition-transform duration-300 z-40 overflow-hidden',
        // largura variável conforme expandido
        isExpanded ? 'w-[500px]' : 'w-[380px]',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header com altura alinhada e botões de expandir/fechar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-yellow-600 to-amber-500 text-white min-h-[48px]">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-5 h-5" />
          <span className="font-semibold text-sm leading-tight truncate">Ranking</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Reduzir Ranking' : 'Expandir Ranking'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={onClose}
            aria-label="Fechar Ranking"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-medium text-sm text-foreground">{getTitle()}</h3>
        <p className="text-xs text-muted-foreground mt-1">Relatórios mais acessados</p>
      </div>

      <div className="overflow-y-auto h-[calc(100%-120px)] p-4 space-y-3">
        {topReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum relatório encontrado</p>
          </div>
        ) : (
          topReports.map((item, index) => (
            <div
              key={item.report.id}
              className={cn(
                'p-3 rounded-lg border cursor-pointer transition-transform hover:scale-[1.02]',
                getMedalBg(index)
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getMedalIcon(index)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.report.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.path.slice(0, 2).join(' > ')}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <Eye className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{item.views} visualizações</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RankingPanel;
