import type { ElementType, ReactNode } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type PageHeaderProps = {
  icon?: ElementType;
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageHeader({ icon: Icon, title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        {Icon ? (
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 sm:flex">
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: ReactNode;
  helper?: string;
  icon: ElementType;
  tone?: 'green' | 'amber' | 'blue' | 'purple' | 'red' | 'slate';
  trend?: string;
};

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  green: 'bg-emerald-500/14 text-emerald-600 dark:text-emerald-300 border-emerald-500/20',
  amber: 'bg-amber-500/14 text-amber-700 dark:text-amber-300 border-amber-500/20',
  blue: 'bg-sky-500/14 text-sky-700 dark:text-sky-300 border-sky-500/20',
  purple: 'bg-violet-500/14 text-violet-700 dark:text-violet-300 border-violet-500/20',
  red: 'bg-rose-500/14 text-rose-700 dark:text-rose-300 border-rose-500/20',
  slate: 'bg-muted text-muted-foreground border-border/70',
};

export function MetricCard({ label, value, helper, icon: Icon, tone = 'green', trend }: MetricCardProps) {
  return (
    <div className="neo-surface neo-card-hover rounded-[24px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
          {trend ? <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-300">{trend}</p> : null}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

type PremiumPanelProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
};

export function PremiumPanel({ title, description, actionLabel, onAction, children, className }: PremiumPanelProps) {
  return (
    <section className={cn('neo-surface rounded-[28px] p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="neo-section-title">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {actionLabel ? (
          <button type="button" onClick={onAction} className="shrink-0 text-sm font-medium text-primary hover:underline">
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

type ActivityRowProps = {
  icon?: ElementType;
  title: string;
  subtitle?: string;
  meta?: string;
  tone?: MetricCardProps['tone'];
};

export function ActivityRow({ icon: Icon = ChevronRight, title, subtitle, meta, tone = 'slate' }: ActivityRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/55 p-3 dark:bg-white/[0.035]">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border', toneClasses[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
    </div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3 py-2 text-sm transition-colors',
        active
          ? 'border-primary/30 bg-primary/15 text-primary'
          : 'border-border/70 bg-background/55 text-muted-foreground hover:text-foreground dark:bg-white/[0.035]'
      )}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: {
  icon: ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-dashed border-border/80 bg-background/45 p-8 text-center dark:bg-white/[0.03]">
      <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel ? (
        <Button className="mt-5 rounded-2xl" onClick={onAction}>
          {actionLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
