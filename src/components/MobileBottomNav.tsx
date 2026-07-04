import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckSquare, FileText, Home, Menu, Settings, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type MobileBottomNavProps = {
  onOpenMenu: () => void;
};

const primaryItems = [
  { icon: Home, label: 'Inicio', path: '/home' },
  { icon: FileText, label: 'Relatorios', path: '/reports' },
  { icon: CheckSquare, label: 'Validacoes', path: '/approvals' },
  { icon: Star, label: 'Favoritos', path: '/favorites' },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isUtilityActive = useMemo(
    () => ['/workspace', '/dashboard', '/indicators', '/settings', '/help', '/superadmin'].some((path) => location.pathname.startsWith(path)),
    [location.pathname]
  );

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_hsl(var(--foreground)/0.08)] backdrop-blur md:hidden">
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
                'flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          );
        })}

        <Button
          type="button"
          variant="ghost"
          onClick={onOpenMenu}
          className={cn(
            'flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.68rem] font-medium',
            isUtilityActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          aria-label="Abrir menu"
        >
          {isUtilityActive ? <Settings className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span>Menu</span>
        </Button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
