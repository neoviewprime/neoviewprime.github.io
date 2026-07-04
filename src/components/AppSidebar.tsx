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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const DESKTOP_EXPANDED = 192;
const DESKTOP_COLLAPSED = 64;
const MOBILE_HEADER_OFFSET = 'calc(env(safe-area-inset-top) + 7.5rem)';

export const AppSidebar: React.FC<AppSidebarProps> = ({ isOpen, onClose, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
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
      ...(isSuperadmin ? [{ icon: Shield, label: 'Superadmin', path: '/superadmin' }] : []),
      { icon: Settings, label: 'Configurações', path: '/settings' },
    ],
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
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={handleCloseMobile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed left-0 z-50 overflow-hidden border-r border-sidebar-border bg-sidebar',
          isDesktop
            ? 'top-16 block h-[calc(100dvh-4rem)]'
            : 'w-[min(86vw,320px)]'
        )}
        initial={false}
        variants={sidebarVariants}
        animate={isDesktop ? (isOpen ? 'desktopExpanded' : 'desktopCollapsed') : isOpen ? 'mobileOpen' : 'mobileClosed'}
        style={{
          willChange: isDesktop ? 'width' : 'transform',
          ...(isDesktop
            ? {}
            : {
                top: MOBILE_HEADER_OFFSET,
                height: `calc(100dvh - ${MOBILE_HEADER_OFFSET})`
              })
        }}
      >
        <div className="flex h-full flex-col pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex justify-end p-2 lg:hidden">
            <button onClick={handleCloseMobile} className="rounded-lg p-2 hover:bg-sidebar-accent">
              <X className="h-5 w-5 text-sidebar-foreground" />
            </button>
          </div>

          <motion.nav
            className="flex-1 space-y-1 overflow-y-auto p-2"
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
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <motion.span
                    className="overflow-hidden whitespace-nowrap text-sm"
                    variants={labelVariants}
                    initial={false}
                    animate={isDesktop ? (isOpen ? 'show' : 'hide') : 'show'}
                  >
                    {item.label}
                  </motion.span>
                </motion.button>
              );
            })}
          </motion.nav>

          <div className="border-t border-sidebar-border p-3">
            {user ? (
              <div className="mb-3">
                <div
                  className={cn(
                    'flex items-center rounded-xl border border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground',
                    isDesktop && !isOpen ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3'
                  )}
                  title={user.full_name}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/15">
                    <User className="h-4 w-4" />
                  </div>
                  <motion.div
                    className="overflow-hidden"
                    variants={labelVariants}
                    initial={false}
                    animate={isDesktop ? (isOpen ? 'show' : 'hide') : 'show'}
                  >
                    <p className="whitespace-nowrap text-sm font-medium">{firstName}</p>
                    <p className="whitespace-nowrap text-xs text-sidebar-foreground/70">
                      {user.employee_id ? `Matrícula ${user.employee_id}` : 'Matrícula não informada'}
                    </p>
                  </motion.div>
                </div>
              </div>
            ) : null}
            <motion.p
              className="whitespace-nowrap text-xs text-sidebar-foreground/60"
              variants={labelVariants}
              initial={false}
              animate={isDesktop ? (isOpen ? 'show' : 'hide') : 'show'}
            >
              NeoView v1.0
            </motion.p>
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
