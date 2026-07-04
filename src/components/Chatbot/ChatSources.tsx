import React from 'react';
import { BarChart3, ChevronRight, FileText, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { SearchSource } from '@/types/backend';
import { COELBA_UTD_FLOW_ID, isCoelbaUtdPath } from '@/lib/coelbaUtd';

interface ChatSourcesProps {
  sources: SearchSource[];
  totalSources?: number;
  className?: string;
}

export function ChatSources({ sources, totalSources, className }: ChatSourcesProps) {
  const navigate = useNavigate();

  if (!sources || sources.length === 0) return null;

  const total = totalSources ?? sources.length;
  const shouldUseScrollableList = sources.length > 3;

  const getIcon = (type: string) => {
    switch (type) {
      case 'indicator':
        return <BarChart3 className="w-4 h-4" />;
      case 'project':
        return <FolderOpen className="w-4 h-4" />;
      case 'report':
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleSourceClick = (source: SearchSource) => {
    const companyId = source.hierarchy?.companyId;
    const superintendenceId = source.hierarchy?.superintendenceId;
    const managementId = source.hierarchy?.managementId;
    const projectId = source.hierarchy?.projectId;

    if (companyId) {
      const params = new URLSearchParams({ company: companyId });
      if (superintendenceId) params.set('sup', superintendenceId);
      if (managementId) params.set('mgmt', managementId);
      if (projectId) params.set('proj', projectId);
      if (
        isCoelbaUtdPath({
          companyId,
          superintendenceId,
          managementId
        })
      ) {
        params.set('view', COELBA_UTD_FLOW_ID);
      }
      if (source.type === 'report') {
        params.set('report', source.id);
        params.set('reportName', source.name);
        params.set('openReport', '1');
      }
      if (source.type === 'indicator') params.set('indicator', source.name);
      params.set('label', source.name);
      navigate(`/dashboard?${params.toString()}`);
      return;
    }

    if (source.type === 'indicator') {
      navigate(`/dashboard?indicator=${encodeURIComponent(source.name)}&label=${encodeURIComponent(source.name)}`);
      return;
    }

    if (source.type === 'report') {
      navigate(`/reports?source=${encodeURIComponent(source.id)}&label=${encodeURIComponent(source.name)}`);
      return;
    }

    navigate(`/dashboard?query=${encodeURIComponent(source.name)}&label=${encodeURIComponent(source.name)}`);
  };

  return (
    <div className={cn('mt-3 ml-11 space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fontes mais relevantes
          </p>
          <p className="text-[11px] text-muted-foreground">
            {total > sources.length
              ? `Exibindo ${sources.length} atalhos principais de ${total} resultado(s).`
              : `${sources.length} resultado(s) pronto(s) para abrir.`}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-2',
          shouldUseScrollableList && 'max-h-[300px] overflow-y-auto pr-2'
        )}
      >
        {sources.map((source, index) => (
          <button
            key={`${source.id}-${index}`}
            type="button"
            onClick={() => handleSourceClick(source)}
            className="w-full rounded-2xl border border-border bg-background/80 px-3 py-3 text-left transition-all hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                {getIcon(source.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{source.name}</p>
                    {source.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{source.description}</p>
                    ) : null}
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </div>

                {source.meta ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">{source.meta}</p>
                ) : null}

                {source.path && source.path.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground/80">
                    {source.path.slice(0, 4).map((segment, pathIndex) => (
                      <React.Fragment key={`${source.id}-path-${pathIndex}`}>
                        {pathIndex > 0 ? <span>/</span> : null}
                        <span className="max-w-[140px] truncate rounded-full bg-muted px-2 py-0.5">
                          {segment}
                        </span>
                      </React.Fragment>
                    ))}
                    {source.path.length > 4 ? <span>...</span> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      {shouldUseScrollableList ? (
        <p className="text-[11px] text-muted-foreground">
          Role a lista para ver todos os relatórios retornados pelo chat.
        </p>
      ) : null}
    </div>
  );
}

export default ChatSources;
