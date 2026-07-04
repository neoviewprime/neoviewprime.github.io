import { useEffect, useMemo, useState } from 'react';
import { Search, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type WorkspaceSectionListItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  detail?: string;
  badge?: string;
  onSelect?: () => void;
  actionLabel?: string;
  onAction?: () => void;
};

type WorkspaceSectionProps = {
  value: string;
  isOpen: boolean;
  badge: string;
  title: string;
  description: string;
  count: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  recentItems?: WorkspaceSectionListItem[];
  resultItems?: WorkspaceSectionListItem[];
  emptyRecentMessage?: string;
  emptyResultsMessage?: string;
  suggestions?: unknown;
  emptySuggestionMessage?: string;
  accentClassName: string;
  icon: LucideIcon;
  children?: ReactNode;
};

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return text;

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const after = text.slice(matchIndex + query.length);

  return (
    <>
      {before}
      <mark className="rounded-sm bg-emerald-500/15 px-0.5 text-foreground">{match}</mark>
      {after}
    </>
  );
};

const SectionList = ({
  items,
  query,
  emptyMessage,
}: {
  items: WorkspaceSectionListItem[];
  query: string;
  emptyMessage: string;
}) => {
  if (items.length === 0) {
    return (
      <div className="rounded-[22px] border border-dashed border-border/60 bg-transparent px-4 py-4 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-[22px] border border-border/60 bg-background/70 px-4 py-3 transition-colors duration-200 hover:border-emerald-500/25"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {item.onSelect ? (
                  <button
                    type="button"
                    onClick={item.onSelect}
                    className="truncate text-left text-sm font-medium text-foreground transition-colors hover:text-emerald-600"
                  >
                    {highlightMatch(item.title, query)}
                  </button>
                ) : (
                  <p className="truncate text-sm font-medium text-foreground">{highlightMatch(item.title, query)}</p>
                )}
                {item.badge ? (
                  <Badge variant="outline" className="rounded-full border-border/70 text-[11px]">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{highlightMatch(item.subtitle, query)}</p>
              {item.meta ? (
                <p className="mt-2 text-sm text-foreground/90">{highlightMatch(item.meta, query)}</p>
              ) : null}
              {item.detail ? (
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {highlightMatch(item.detail, query)}
                </p>
              ) : null}
            </div>

            {item.onAction && item.actionLabel ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 rounded-full px-3 text-xs text-foreground hover:bg-muted"
                onClick={item.onAction}
              >
                {item.actionLabel}
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
};

export const WorkspaceSection = ({
  value,
  isOpen,
  badge,
  title,
  description,
  count,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  recentItems = [],
  resultItems = [],
  emptyRecentMessage = 'Nenhuma sugestão disponível nesta seção.',
  emptyResultsMessage = 'Nenhum item encontrado para esta seção.',
  accentClassName,
  icon: Icon,
  children,
}: WorkspaceSectionProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const trimmedQuery = searchValue.trim();
  const suggestionItems = useMemo(() => recentItems, [recentItems]);
  const visibleItems = trimmedQuery ? resultItems : suggestionItems;
  const emptyMessage = trimmedQuery ? emptyResultsMessage : emptyRecentMessage;

  useEffect(() => {
    if (!isOpen) {
      setIsSearchOpen(false);
    }
  }, [isOpen]);

  return (
    <AccordionItem value={value} className="overflow-hidden rounded-[30px] border border-border/70 bg-transparent px-0 shadow-sm">
      <AccordionTrigger className="px-5 py-5 text-left hover:no-underline [&>svg]:text-muted-foreground">
        <div className="flex flex-1 flex-col gap-4">
          <div className="space-y-3">
            <Badge className={cn('w-fit rounded-full border px-3 py-1 hover:bg-transparent', accentClassName)}>
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {badge}
            </Badge>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                <Badge variant="outline" className="rounded-full">{count}</Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {isOpen ? 'Clique novamente para recolher esta seção.' : 'Clique para expandir e explorar esta seção.'}
              </p>
            </div>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-5 pb-5">
        <div className="border-t border-border/60 pt-5">
          {children ? <div className="mb-4">{children}</div> : null}
          <div className="rounded-[26px] border border-border/70 bg-background/70 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => {
                  onSearchChange(event.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
                placeholder={searchPlaceholder}
                className="h-11 rounded-2xl border-border/70 bg-background pl-11 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {isSearchOpen ? (
              <div className="mt-3 rounded-[24px] border border-border/70 bg-background/95 shadow-xl">
                <div className="border-b border-border/60 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {trimmedQuery
                          ? `Resultados filtrados em tempo real para "${trimmedQuery}".`
                          : 'Clique em uma sugestão ou comece a digitar para refinar a busca.'}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full">
                      {visibleItems.length}
                    </Badge>
                  </div>
                </div>

                <div className="max-h-[24rem] overflow-y-auto px-4 py-4 pr-2 overscroll-contain">
                  <SectionList items={visibleItems} query={trimmedQuery} emptyMessage={emptyMessage} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
