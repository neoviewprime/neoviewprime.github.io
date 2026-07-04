import React from 'react';
import { Building2, Users, Briefcase, FolderOpen, ChevronRight } from 'lucide-react';

interface HierarchyCardProps {
  type: 'superintendence' | 'management' | 'project';
  name: string;
  description?: string;
  count?: number;
  onClick: () => void;
}

export const HierarchyCard: React.FC<HierarchyCardProps> = ({
  type,
  name,
  description,
  count,
  onClick,
}) => {
  const icons = {
    superintendence: Building2,
    management: Users,
    project: FolderOpen,
  };

  const colors = {
    superintendence: 'bg-secondary/10 text-secondary',
    management: 'bg-accent/10 text-accent',
    project: 'bg-primary/10 text-primary',
  };

  const labels = {
    superintendence: 'Gerências',
    management: 'Unidades',
    project: 'Indicadores',
  };

  const Icon = icons[type];

  return (
    <button
      onClick={onClick}
      className="company-card w-full text-left group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colors[type]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
            {count !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                {count} {labels[type]}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
};
