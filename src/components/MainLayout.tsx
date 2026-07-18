import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopNavbar } from '@/components/TopNavbar';
import AppSidebar from '@/components/AppSidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { HierarchyNavProvider } from '@/context/HierarchyNavContext';
import { useAuth } from '@/hooks/useAuth';

const DESKTOP_EXPANDED = 266;
const DESKTOP_COLLAPSED = 72;
const SIDEBAR_STORAGE_KEY = 'neoview_sidebar_open_v2';

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setSidebarOpen(saved === null ? true : saved === 'true');
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const from = `${location.pathname}${location.search}${location.hash}`;
      navigate('/login', { replace: true, state: { from } });
    }
  }, [isAuthenticated, isLoading, location.hash, location.pathname, location.search, navigate]);

  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const newState = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState));
      return newState;
    });
  };

  const targetMarginLeft = isDesktop
    ? (sidebarOpen ? DESKTOP_EXPANDED : DESKTOP_COLLAPSED)
    : 0;

  if (isLoading) {
    return (
      <div className="app-shell-bg flex min-h-screen items-center justify-center text-muted-foreground">
        Validando sessão...
      </div>
    );
  }

  return (
    <div className="app-shell-bg min-h-dvh bg-background">
      <HierarchyNavProvider>
        {isDesktop ? <AppSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} /> : null}

        <motion.div
          className="flex min-h-dvh min-w-0 flex-1 flex-col"
          initial={false}
          animate={{ marginLeft: targetMarginLeft }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <TopNavbar isAuthenticated={isAuthenticated} />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip px-0 pb-[calc(env(safe-area-inset-bottom)+5.75rem)] pt-0 sm:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <Outlet />
          </main>
        </motion.div>
        <MobileBottomNav />
      </HierarchyNavProvider>
    </div>
  );
}
