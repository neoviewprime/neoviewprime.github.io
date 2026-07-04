import React, { useEffect, useRef, useState } from 'react';
import { Search, FileText, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';
import { COELBA_UTD_FLOW_ID, isCoelbaUtdPath } from '@/lib/coelbaUtd';

type GlobalSearchResult = {
  type: 'report' | 'indicator';
  sourceReportId: string;
  reportName: string;
  reportDescription?: string;
  reportDate?: string | null;
  companyId: string;
  companyName: string;
  superintendenceId: string;
  superintendenceName: string;
  managementId: string;
  managementName: string;
  projectId: string;
  projectName: string;
  indicatorName?: string;
  indicatorNames: string[];
  path: string[];
  score: number;
};

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setHighlightedIndex(0);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const token = getStoredAuthToken();
        const params = new URLSearchParams({
          q: query.trim(),
          limit: '8'
        });
        const response = await fetch(`${API_URL}/search/catalog?${params.toString()}`, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = (await response.json()) as { items?: GlobalSearchResult[] };
        setResults(payload.items ?? []);
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setResults([]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const handleResultClick = (result: GlobalSearchResult) => {
    const params = new URLSearchParams({
      company: result.companyId,
      label: result.type === 'indicator' ? result.indicatorName ?? result.reportName : result.reportName
    });

    if (result.superintendenceId) params.set('sup', result.superintendenceId);
    if (result.managementId) params.set('mgmt', result.managementId);
    if (result.projectId) params.set('proj', result.projectId);
    if (
      isCoelbaUtdPath({
        companyId: result.companyId,
        superintendenceId: result.superintendenceId,
        managementId: result.managementId
      })
    ) {
      params.set('view', COELBA_UTD_FLOW_ID);
    }

    if (result.type === 'indicator') {
      params.set('indicator', result.indicatorName ?? result.reportName);
    } else {
      params.set('report', result.sourceReportId);
      params.set('reportName', result.reportName);
      params.set('openReport', '1');
    }

    navigate(`/dashboard?${params.toString()}`);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setHighlightedIndex(0);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={(event) => {
            if (!isOpen || results.length === 0) {
              if (event.key === 'Escape') setIsOpen(false);
              return;
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setHighlightedIndex((current) => (current + 1) % results.length);
              return;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setHighlightedIndex((current) => (current - 1 + results.length) % results.length);
              return;
            }

            if (event.key === 'Enter') {
              event.preventDefault();
              handleResultClick(results[highlightedIndex] ?? results[0]);
              return;
            }

            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Buscar relatórios e indicadores..."
          className="search-input pl-12 pr-4"
        />
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg border border-border shadow-lg overflow-hidden z-50 animate-fade-in">
          <div className="p-2">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.sourceReportId}-${index}`}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${highlightedIndex === index ? 'bg-muted' : 'hover:bg-muted'}`}
              >
                <div className={`mt-0.5 p-2 rounded-lg ${result.type === 'indicator' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                  {result.type === 'indicator' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {result.type === 'indicator' ? result.indicatorName ?? result.reportName : result.reportName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {result.type === 'indicator' ? `Relatório: ${result.reportName}` : result.reportDescription || result.companyName}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 flex-wrap">
                    {result.path.slice(0, 4).map((segment, i) => (
                      <React.Fragment key={i}>
                        <span className="truncate max-w-[100px]">{segment}</span>
                        {i < Math.min(result.path.length, 4) - 1 && (
                          <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg border border-border shadow-lg p-4 text-center text-muted-foreground z-50">
          Buscando resultados na plataforma...
        </div>
      )}

      {isOpen && !isLoading && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-lg border border-border shadow-lg p-4 text-center text-muted-foreground z-50">
          Nenhum resultado encontrado para "{query}"
        </div>
      )}
    </div>
  );
};
