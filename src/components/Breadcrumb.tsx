import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center gap-1.5 breadcrumb-link"
      >
        <Home className="w-4 h-4" />
        <span>Início</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          {index === items.length - 1 ? (
            <span className="breadcrumb-current">{item.label}</span>
          ) : (
            <button onClick={item.onClick} className="breadcrumb-link">
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
