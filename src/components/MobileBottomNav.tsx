import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, FileText, Home, Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type MobileBottomNavProps = {
  onOpenMenu: () => void;
};

const primaryItems = [
  { icon: Home, label: 'Inicio', path: '/home' },
  { icon: FileText, label: 'Relatorios', path: '/reports' },
  { icon: BarChart3, label: 'Estatisticas', path: '/indicators' },
  { icon: Star, label: 'Favoritos', path: '/favorites' },
  { icon: User, label: 'Perfil', path: '/settings' },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="neo-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-medium transition-colors',
                isActive
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/25'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
