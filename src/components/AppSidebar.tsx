import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Settings,
  CheckSquare,
  Home,
  Star,
  HelpCircle,
  Shield,
  User,
  X,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { NeoLogo } from '@/components/NeoLogo';

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

const DESKTOP_EXPANDED = 266;
const DESKTOP_COLLAPSED = 72;

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onToggle, onClose, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isCollapsed = isDesktop && !isOpen;
  const { roles, user } = useAuth();
  const isSuperadmin = roles.includes('superadmin');
  const firstName = user?.full_name?.trim().split(/\s+/)[0] ?? 'Usuário';

  const menuItems = useMemo(
    () => [
      { icon: Home, label: 'Início', path: '/home' },
      { icon: LayoutDashboard, label: 'Meu Workspace', path: '/workspace' },
      { icon: FileText, label: 'Meus Relatórios', path: '/reports' },
      { icon: BarChart3, label: 'Estatísticas', path: '/indicators' },
      { icon: CheckSquare, label: 'Validações', path: '/approvals' },
      { icon: Star, label: 'Favoritos', path: '/favorites' },
      { icon: HelpCircle, label: 'Ajuda', path: '/help' },
      { icon: Settings, label: 'Configurações', path: '/settings' },
    ],
    []
  );
  const adminItems = useMemo(
    () => (isSuperadmin ? [{ icon: Shield, label: 'Superadmin', path: '/superadmin' }] : []),
    [isSuperadmin]
  );

  const sidebarVariants = {
    desktopExpanded: { width: DESKTOP_EXPANDED, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    desktopCollapsed: { width: DESKTOP_COLLAPSED, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    mobileOpen: { x: 0, transition: { type: 'spring', stiffness: 280, damping: 28 } },
    mobileClosed: { x: '-100%', transition: { type: 'spring', stiffness: 280, damping: 28 } },
  } as const;

  const labelVariants = {
    show: { opacity: 1, x: 0, clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.2 } },
    hide: { opacity: 0, x: -8, clipPath: 'inset(0% 100% 0% 0%)', transition: { duration: 0.18 } },
  } as const;

  const listVariants = {
    animate: {
      transition: { staggerChildren: 0.03, delayChildren: 0.03 },
    },
  } as const;

  const handleCloseMobile = () => {
    if (!isDesktop) {
      localStorage.setItem('sidebar_open', 'false');
      onClose();
    }
  };

  const overlayVisible = !isDesktop && isOpen;

  return (
    <>
      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-40 bg-foreground/35 backdrop-blur-sm lg:hidden"
            onClick={handleCloseMobile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'neo-sidebar fixed left-0 z-50 overflow-hidden border-r',
          isDesktop ? 'top-0 block h-dvh' : 'top-0 h-dvh w-[min(84vw,340px)]',
          isCollapsed ? 'neo-sidebar-collapsed' : ''
        )}
        initial={false}
        variants={sidebarVariants}
        animate={isDesktop ? (isOpen ? 'desktopExpanded' : 'desktopCollapsed') : isOpen ? 'mobileOpen' : 'mobileClosed'}
        style={{
          willChange: isDesktop ? 'width' : 'transform',
        }}
      >
        <div className={cn('flex h-full flex-col pb-[calc(env(safe-area-inset-bottom)+0.75rem)]', isCollapsed ? 'items-center' : '')}>
          <div
            className={cn(
              'flex min-h-[4.6rem] w-full items-center border-b border-sidebar-border p-4',
              isCollapsed ? 'justify-center px-0' : 'justify-between'
            )}
          >
            <div className="min-w-0">
              <NeoLogo size="sm" showText={!isCollapsed} />
            </div>
            {!isDesktop ? (
            <button onClick={handleCloseMobile} className="rounded-xl p-2 hover:bg-sidebar-accent">
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
            ) : null}
          </div>

          {!isCollapsed ? (
            <motion.p
              className="w-full px-4 pt-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55"
              variants={labelVariants}
              initial={false}
              animate="show"
            >
              Navegacao
            </motion.p>
          ) : null}

          <motion.nav
            className={cn(
              'flex-1 space-y-1 overflow-y-auto p-3 pt-3',
              isCollapsed ? 'w-full overflow-hidden px-2 pt-4' : 'w-full'
            )}
            variants={listVariants}
            initial={false}
            animate="animate"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (!isDesktop) handleCloseMobile();
                  }}
                  className={cn(
                    'relative flex h-11 w-full min-w-0 items-center gap-3 rounded-xl px-3 text-left transition-all',
                    isActive
                      ? 'bg-sidebar-primary/15 text-sidebar-accent-foreground ring-1 ring-sidebar-primary/35 shadow-[0_10px_28px_-22px_hsl(var(--sidebar-primary))]'
                      : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isCollapsed ? 'mx-auto h-11 w-11 justify-center px-0' : ''
                  )}
                  title={isCollapsed ? item.label : undefined}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                >
                  {isActive ? <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" /> : null}
                  <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-sidebar-primary' : '')} />
                  {!isCollapsed ? (
                    <motion.span
                      className="min-w-0 overflow-hidden truncate whitespace-nowrap text-sm"
                      variants={labelVariants}
                      initial={false}
                      animate="show"
                    >
                      {item.label}
                    </motion.span>
                  ) : null}
                </motion.button>
              );
            })}

            {adminItems.length ? (
              <div className={cn('pt-5', isCollapsed ? 'mx-auto w-11 border-t border-sidebar-border/70 pt-3' : '')}>
                {!isCollapsed ? (
                  <motion.p
                    className="mb-2 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/55"
                    variants={labelVariants}
                    initial={false}
                    animate="show"
                  >
                    Administracao
                  </motion.p>
                ) : null}
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        if (!isDesktop) handleCloseMobile();
                      }}
                      className={cn(
                        'relative flex h-11 w-full min-w-0 items-center gap-3 rounded-xl px-3 text-left transition-all',
                        isActive
                          ? 'bg-sidebar-primary/15 text-sidebar-accent-foreground ring-1 ring-sidebar-primary/35'
                          : 'text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isCollapsed ? 'mx-auto h-11 w-11 justify-center px-0' : ''
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {isActive ? <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" /> : null}
                      <Icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-sidebar-primary' : '')} />
                      {!isCollapsed ? (
                        <motion.span
                          className="min-w-0 overflow-hidden truncate whitespace-nowrap text-sm"
                          variants={labelVariants}
                          initial={false}
                          animate="show"
                        >
                          {item.label}
                        </motion.span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            ) : null}
          </motion.nav>

          <div className={cn('w-full border-t border-sidebar-border p-3', isCollapsed ? 'px-2' : '')}>
            {user ? (
              <div className="mb-3">
                <div
                  className={cn(
                    'flex items-center rounded-2xl border border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground',
                    isCollapsed ? 'mx-auto h-11 w-11 justify-center rounded-xl px-0 py-0' : 'gap-3 px-3 py-3'
                  )}
                  title={user.full_name}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15">
                    <User className="h-4 w-4" />
                  </div>
                  {!isCollapsed ? (
                    <motion.div
                      className="min-w-0 overflow-hidden"
                      variants={labelVariants}
                      initial={false}
                      animate="show"
                    >
                      <p className="truncate whitespace-nowrap text-sm font-medium">{firstName}</p>
                      <p className="whitespace-nowrap text-xs text-sidebar-foreground/70">
                        {user.employee_id ? `Matrícula ${user.employee_id}` : 'Matrícula não informada'}
                      </p>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            ) : null}
            <motion.div
              className={cn(
                'mb-3 overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar-accent/35',
                isCollapsed ? 'hidden' : ''
              )}
              variants={labelVariants}
              initial={false}
              animate={isDesktop ? (isOpen ? 'show' : 'hide') : 'show'}
            >
              <button className="flex w-full items-center gap-3 px-3 py-3 text-left text-sidebar-foreground">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">Neoenergia Coelba</p>
                  <p className="truncate text-xs text-sidebar-foreground/65">Workspace atual</p>
                </div>
              </button>
            </motion.div>
            <motion.p
              className={cn('whitespace-nowrap text-xs text-sidebar-foreground/60', isCollapsed ? 'sr-only' : '')}
              variants={labelVariants}
              initial={false}
              animate={isDesktop ? (isOpen ? 'show' : 'hide') : 'show'}
            >
              NeoView v2.0.0
            </motion.p>
            {isDesktop ? (
              <button
                type="button"
                onClick={onToggle}
                className={cn(
                  'mt-3 flex w-full items-center justify-center rounded-xl border border-sidebar-border px-3 py-2.5 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isCollapsed ? 'mx-auto h-10 w-11 px-0' : ''
                )}
                aria-label={isOpen ? 'Recolher sidebar' : 'Expandir sidebar'}
              >
                {isOpen ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
              </button>
            ) : null}
            {!isDesktop ? (
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            ) : null}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default AppSidebar;
