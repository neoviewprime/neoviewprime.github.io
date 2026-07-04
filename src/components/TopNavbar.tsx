import React, { useState } from 'react';
import { Menu, Home, Star, HelpCircle, LogOut, ChevronLeft, Bell, Share2, ShieldCheck, Clock3 } from 'lucide-react';
import { NeoLogo } from './NeoLogo';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ThemeToggle';
import { useNavigate } from 'react-router-dom';
import { useHierarchyNav } from '@/context/HierarchyNavContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TopNavbarProps {
  onToggleSidebar: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  isAuthenticated,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { canGoBack, triggerBack } = useHierarchyNav();
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { items, unreadCount, isLoading, markAllAsRead, markAsRead } = useNotifications(isAuthenticated && Boolean(user?.id));
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    await markAsRead(notificationId).catch(() => undefined);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type === 'report_shared') return Share2;
    if (type.includes('delegation')) return ShieldCheck;
    return Clock3;
  };

  return (
    <header className="sticky top-0 z-50 border-b neo-topbar">
      <div className="px-3 pb-2 pt-[max(0.65rem,env(safe-area-inset-top))] sm:px-4 sm:pb-0 sm:pt-0">
        <div className="flex min-h-14 items-center justify-between gap-2 sm:min-h-16 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <button
                onClick={onToggleSidebar}
                className="rounded-xl p-2 text-foreground transition-colors hover:bg-muted"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            ) : null}

            <button onClick={() => navigate(isAuthenticated ? '/home' : '/')} className="shrink-0">
              <NeoLogo size="md" />
            </button>
          </div>

          {isAuthenticated && !isMobile ? (
            <div className="hidden flex-1 justify-center px-4 sm:flex">
              <GlobalSearch />
            </div>
          ) : null}

          <nav className="flex shrink-0 items-center gap-1">
            {isAuthenticated && canGoBack ? (
              <button
                onClick={triggerBack}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted sm:px-3"
                aria-label="Voltar nivel"
                title="Voltar nivel"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden md:inline">Voltar</span>
              </button>
            ) : null}

            <ThemeToggle />

            {isAuthenticated ? (
              <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-xl text-foreground hover:bg-muted"
                    aria-label="Notificacoes"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="neo-surface-strong w-[min(92vw,360px)] overflow-hidden rounded-2xl p-0"
                  onInteractOutside={(event) => {
                    const target = event.target as HTMLElement | null;
                    if (target?.closest('[data-theme-toggle="true"]')) {
                      event.preventDefault();
                    }
                  }}
                >
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Notificacoes</p>
                      <p className="text-xs text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} pendente(s)` : 'Sem pendencias novas'}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => markAllAsRead().catch(() => undefined)} disabled={unreadCount === 0}>
                      Marcar tudo como lido
                    </Button>
                  </div>

                  <ScrollArea className="h-[320px]">
                    <div className="space-y-1 p-2">
                      {isLoading ? (
                        <div className="flex min-h-[304px] items-center px-3 py-6 text-sm text-muted-foreground">
                          Carregando notificacoes...
                        </div>
                      ) : items.length === 0 ? (
                        <div className="flex min-h-[304px] items-center px-3 py-6 text-sm text-muted-foreground">
                          Nenhuma notificacao ainda.
                        </div>
                      ) : (
                        items.map((item) => {
                          const Icon = getNotificationIcon(item.type);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleNotificationClick(item.id, item.action_url)}
                              className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted"
                            >
                              <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                                  {!item.is_read ? <span className="mt-1 h-2 w-2 rounded-full bg-red-500" /> : null}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{item.message}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {new Date(item.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            ) : null}

            {isAuthenticated ? (
              <>
                {!isMobile ? (
                  <>
                    <button
                      onClick={() => navigate('/home')}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline">Inicio</span>
                    </button>
                    <button
                      onClick={() => navigate('/favorites')}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <Star className="h-4 w-4" />
                      <span className="hidden sm:inline">Favoritos</span>
                    </button>
                    <button
                      onClick={() => navigate('/help')}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      <HelpCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Ajuda</span>
                    </button>
                  </>
                ) : null}

                {!isMobile ? (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 sm:px-3"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden md:inline">Sair</span>
                  </button>
                ) : null}
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Entrar
              </button>
            )}
          </nav>
        </div>

        {isAuthenticated ? (
          <div className="pt-2 md:hidden">
            <GlobalSearch />
          </div>
        ) : null}
      </div>
    </header>
  );
};
