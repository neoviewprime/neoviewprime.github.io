import type { ChangeEvent, ElementType, ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileSpreadsheet,
  FileText,
  MoreVertical,
  Search,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const reportRows = [
  { name: 'Relatório SLA Comercial Q4 2024', desc: 'Desempenho das operações comerciais', type: 'PDF', color: 'red', status: 'Aprovado', date: '19/12/2024', time: '10:32', area: 'Comercial', views: '245', comments: '6', favorite: true },
  { name: 'Dashboard Operacional Dezembro', desc: 'Indicadores operacionais e de produção', type: 'XLSX', color: 'green', status: 'Pendente', date: '18/12/2024', time: '16:21', area: 'Operações', views: '128', comments: '3', favorite: false },
  { name: 'Estratégias Recuperação de Energia 2024', desc: 'Plano de recuperação e eficiência energética', type: 'PDF', color: 'blue', status: 'Aprovado', date: '17/12/2024', time: '09:47', area: 'Diretoria', views: '312', comments: '8', favorite: true },
  { name: 'Relatório Inadimplência Q4 2024', desc: 'Análise de inadimplência e receita', type: 'XLSX', color: 'green', status: 'Aprovado', date: '17/12/2024', time: '16:21', area: 'Financeiro', views: '198', comments: '2', favorite: false },
  { name: 'Pesquisa Satisfação Corporativa 2024', desc: 'Resultados da pesquisa anual', type: 'PDF', color: 'red', status: 'Rejeitado', date: '16/12/2024', time: '14:08', area: 'RH', views: '87', comments: '5', favorite: false },
  { name: 'Comparativo Geração x Consumo 2024', desc: 'Análise comparativa por unidade', type: 'XLSX', color: 'green', status: 'Rascunho', date: '15/12/2024', time: '11:03', area: 'Planejamento', views: '-', comments: '0', favorite: false },
];

export const recentDecisions = [
  { status: 'Aprovado', title: 'Relatório Recuperação Energia 2024.pdf', meta: 'Aprovado por você  •  19/12/2024  •  10:32', tone: 'green' },
  { status: 'Rejeitado', title: 'Relatório Inadimplência Q4 2024.pdf', meta: 'Rejeitado por você  •  18/12/2024  •  16:21', tone: 'red' },
  { status: 'Aprovado', title: 'Pesquisa Satisfação Corporativos 2024.pdf', meta: 'Aprovado por você  •  18/12/2024  •  09:47', tone: 'green' },
  { status: 'Delegado', title: 'Dashboard Comercial Novembro.pdf', meta: 'Delegado para Maria Silva  •  17/12/2024', tone: 'amber' },
];

export function PageTitle({
  icon: Icon,
  title,
  description,
  actions,
  iconTone = 'green',
}: {
  icon?: ElementType;
  title: string;
  description: string;
  actions?: ReactNode;
  iconTone?: 'green' | 'amber' | 'blue' | 'purple' | 'red';
}) {
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {Icon ? (
          <div className={cn('hidden h-12 w-12 shrink-0 items-center justify-center rounded-full sm:flex', toneBg(iconTone))}>
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-4xl break-words text-base text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  trend,
  tone = 'green',
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
  helper?: string;
  trend?: string;
  tone?: 'green' | 'amber' | 'blue' | 'purple' | 'red';
}) {
  return (
    <div className="neo-surface min-w-0 rounded-xl p-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-full', toneBg(tone))}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {helper ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{helper}</p> : null}
          {trend ? <p className={cn('mt-3 line-clamp-2 text-xs font-medium', trend.includes('-') ? 'text-emerald-400' : tone === 'amber' ? 'text-amber-400' : 'text-emerald-400')}>{trend}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function Panel({ title, children, action, className }: { title?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cn('neo-surface min-w-0 overflow-visible rounded-xl p-4 sm:p-5', className)}>
      {title ? (
        <div className="mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg font-semibold text-foreground">{title}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function SearchControl({
  placeholder = 'Buscar relatórios, indicadores ou usuários...',
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative min-w-0">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <input
        className="neo-control h-12 w-full pl-12 pr-4 text-sm sm:pr-20"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md bg-white/[0.06] px-2 py-1 text-xs text-muted-foreground sm:inline-flex">⌘ K</span>
    </div>
  );
}

export function FilterButton({ children = 'Filtros', active = false, onClick }: { children?: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('neo-action-button min-w-0', active ? 'border-primary/50 bg-primary/10 text-primary' : '')}>
      <Search className="h-4 w-4" />
      {children}
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

export function FileBadge({ type, color }: { type: string; color: string }) {
  const Icon = type === 'XLSX' ? FileSpreadsheet : FileText;
  return (
    <div className={cn('flex h-11 w-9 shrink-0 flex-col items-center justify-center rounded-md text-[10px] font-bold text-white', fileBg(color))}>
      <Icon className="h-4 w-4" />
      {type}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const classes =
    status === 'Aprovado'
      ? 'border-emerald-500/20 bg-emerald-500/14 text-emerald-300'
      : status === 'Pendente'
        ? 'border-amber-500/20 bg-amber-500/14 text-amber-300'
        : status === 'Rejeitado'
          ? 'border-red-500/20 bg-red-500/14 text-red-300'
          : 'border-slate-500/20 bg-slate-500/14 text-slate-300';
  return <span className={cn('neo-chip border-0', classes)}>{status}</span>;
}

export function ReportsTable({
  approvals = false,
  rows,
  onOpenReport,
  onApproveReport,
  onRejectReport,
  onMoreActions,
}: {
  approvals?: boolean;
  rows?: typeof reportRows;
  onOpenReport?: (name: string) => void;
  onApproveReport?: (name: string) => void;
  onRejectReport?: (name: string) => void;
  onMoreActions?: (name: string) => void;
}) {
  const visibleRows = rows ?? reportRows;

  return (
    <>
      <div className="space-y-3 md:hidden">
        {visibleRows.map((row, index) => (
          <div key={row.name} className="rounded-xl border border-border/70 bg-background/55 p-4 dark:bg-white/[0.025]">
            <div className="flex min-w-0 items-start gap-3">
              <FileBadge type={row.type} color={row.color} />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-foreground">{row.name}</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">{approvals ? row.area : row.desc}</p>
              </div>
              {row.favorite && !approvals ? <Star className="h-5 w-5 shrink-0 fill-amber-400 text-amber-400" /> : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {approvals ? (
                <>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Prioridade</p>
                    <p className={cn('mt-1 font-medium', index < 2 ? 'text-red-300' : index === 2 ? 'text-amber-300' : 'text-muted-foreground')}>
                      {index < 2 ? 'Alta' : index === 2 ? 'Média' : 'Baixa'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Solicitante</p>
                    <p className="mt-1 font-medium text-foreground">{['Maria Silva', 'Carlos Lima', 'Ana Costa', 'João Nogueira', 'Paula Rodrigues', 'Marina Souza'][index]}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-1"><StatusPill status={row.status} /></div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-muted-foreground">Destino</p>
                    <p className="mt-1 font-medium text-foreground">{row.area}</p>
                  </div>
                </>
              )}
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-muted-foreground">Data</p>
                <p className="mt-1 font-medium text-foreground">{row.date} · {row.time}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-muted-foreground">{approvals ? 'Prazo' : 'Engajamento'}</p>
                {approvals ? (
                  <div className="mt-1 font-medium text-foreground"><Deadline index={index} /></div>
                ) : (
                  <p className="mt-1 font-medium text-foreground">{row.views} views · {row.comments} comentários</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              {approvals ? <StatusPill status="Pendente" /> : <span className="text-xs text-muted-foreground">{index + 2} destinatários</span>}
              <button type="button" onClick={() => onOpenReport?.(row.name)} className="neo-action-button py-2 text-xs">
                {approvals ? 'Analisar' : 'Abrir ações'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="neo-mobile-scroll hidden rounded-xl border border-border/70 md:block">
        <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="bg-white/[0.035] text-muted-foreground">
          <tr>
            {approvals ? <th className="px-4 py-3"><input type="checkbox" className="rounded border-border bg-transparent" /></th> : null}
            {approvals ? <th className="px-4 py-3">Prioridade</th> : null}
            <th className="px-4 py-3">Relatório</th>
            {approvals ? <th className="px-4 py-3">Solicitante</th> : <th className="px-4 py-3">Status</th>}
            <th className="px-4 py-3">Data</th>
            {approvals ? <th className="px-4 py-3">Prazo</th> : <th className="px-4 py-3">Destino</th>}
            {approvals ? <th className="px-4 py-3">Status</th> : <th className="px-4 py-3">Visualizações</th>}
            {!approvals ? <th className="px-4 py-3">Comentários</th> : null}
            {!approvals ? <th className="px-4 py-3">Favorito</th> : null}
            <th className="px-4 py-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row, index) => (
            <tr key={row.name} className="neo-table-row border-b">
              {approvals ? <td className="px-4 py-3"><input type="checkbox" className="rounded border-border bg-transparent" /></td> : null}
              {approvals ? (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileBadge type={row.type} color={row.color} />
                    <span className={cn('neo-chip border-0', index < 2 ? 'bg-red-500/16 text-red-300' : index === 2 ? 'bg-amber-500/16 text-amber-300' : 'bg-slate-500/16 text-slate-300')}>
                      {index < 2 ? 'Alta' : index === 2 ? 'Média' : 'Baixa'}
                    </span>
                  </div>
                </td>
              ) : null}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {!approvals ? <FileBadge type={row.type} color={row.color} /> : null}
                  <div className="min-w-0">
                    <p className="max-w-[260px] truncate font-medium text-foreground">{row.name}</p>
                    <p className="mt-1 max-w-[260px] truncate text-xs text-muted-foreground">{approvals ? row.area : row.desc}</p>
                  </div>
                </div>
              </td>
              {approvals ? (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar initials={['MS', 'CL', 'AC', 'JN', 'PR', 'MS'][index]} tone={index % 3 === 0 ? 'green' : 'slate'} />
                    <div className="min-w-0">
                      <p className="max-w-[140px] truncate text-foreground">{['Maria Silva', 'Carlos Lima', 'Ana Costa', 'João Nogueira', 'Paula Rodrigues', 'Marina Souza'][index]}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.area}</p>
                    </div>
                  </div>
                </td>
              ) : (
                <td className="px-4 py-3"><StatusPill status={row.status} /></td>
              )}
              <td className="px-4 py-3 text-muted-foreground"><p>{row.date}</p><p>{row.time}</p></td>
              <td className="px-4 py-3 text-muted-foreground">{approvals ? <Deadline index={index} /> : <><p>{row.area}</p><p className="text-xs">{index + 2} destinatários</p></>}</td>
              {approvals ? <td className="px-4 py-3"><StatusPill status="Pendente" /></td> : <td className="px-4 py-3 text-foreground">{row.views} <Sparkline /></td>}
              {!approvals ? <td className="px-4 py-3 text-foreground">{row.comments} <span className="text-muted-foreground">▱</span></td> : null}
              {!approvals ? <td className="px-4 py-3">{row.favorite ? <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> : <Star className="h-5 w-5 text-muted-foreground" />}</td> : null}
              <td className="px-4 py-3">
                {approvals ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onApproveReport?.(row.name)} className="neo-icon-button h-9 w-9 border-emerald-500/40 text-emerald-300" aria-label={`Aprovar ${row.name}`}><Check className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onRejectReport?.(row.name)} className="neo-icon-button h-9 w-9 border-red-500/40 text-red-300" aria-label={`Rejeitar ${row.name}`}><X className="h-4 w-4" /></button>
                    <button type="button" onClick={() => onMoreActions?.(row.name)} className="neo-icon-button h-9 w-9" aria-label={`Mais ações para ${row.name}`}><MoreVertical className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => onMoreActions?.(row.name)} className="neo-icon-button h-9 w-9" aria-label={`Mais ações para ${row.name}`}><MoreVertical className="h-4 w-4" /></button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

export function DecisionList() {
  return (
    <div className="space-y-1">
      {recentDecisions.slice(0, 3).map((item) => (
        <div key={item.title} className="flex gap-3 border-b border-border/60 py-3 last:border-0">
          <div className={cn('mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneBg(item.tone as 'green' | 'amber' | 'red'))}>
            {item.tone === 'red' ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', item.tone === 'red' ? 'text-red-300' : 'text-emerald-300')}>{item.status}</p>
            <p className="break-words text-sm font-medium text-foreground">{item.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Avatar({ initials, tone = 'green' }: { initials: string; tone?: 'green' | 'slate' | 'amber' | 'purple' | 'red' | 'blue' }) {
  return <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold', tone === 'slate' ? 'bg-slate-600/40 text-slate-100' : toneBg(tone as 'green'))}>{initials}</div>;
}

export function MiniChart() {
  const points = [40, 34, 41, 50, 43, 39, 40, 45, 50, 50, 54, 68, 59, 61, 64, 72, 79, 67, 63, 56, 48, 46, 54, 65, 55, 54, 59, 52];
  const red = [6, 8, 9, 10, 6, 8, 9, 10, 8, 8, 7, 10, 8, 12, 12, 8, 7, 7, 9, 10, 10, 7, 6, 6, 9, 8, 12, 8];
  return (
    <div className="relative h-[300px] rounded-xl border border-border/60 bg-[#071522]/60 p-4">
      <div className="absolute inset-x-8 top-10 bottom-12 flex flex-col justify-between">
        {[100, 80, 60, 40, 20, 0].map((n) => <div key={n} className="border-t border-white/8 text-xs text-muted-foreground">{n}</div>)}
      </div>
      <svg viewBox="0 0 720 250" className="relative z-10 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="greenFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="redFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polyline fill="url(#greenFill)" stroke="none" points={`0,250 ${points.map((p, i) => `${(i * 720) / (points.length - 1)},${250 - p * 2.2}`).join(' ')} 720,250`} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="3" points={points.map((p, i) => `${(i * 720) / (points.length - 1)},${250 - p * 2.2}`).join(' ')} />
        <polyline fill="url(#redFill)" stroke="none" points={`0,250 ${red.map((p, i) => `${(i * 720) / (red.length - 1)},${250 - p * 2.2}`).join(' ')} 720,250`} />
        <polyline fill="none" stroke="#ef4444" strokeWidth="3" points={red.map((p, i) => `${(i * 720) / (red.length - 1)},${250 - p * 2.2}`).join(' ')} />
      </svg>
    </div>
  );
}

export function Sparkline() {
  return <span className="ml-2 text-emerald-400">⌁⌁⌁</span>;
}

function Deadline({ index }: { index: number }) {
  if (index < 2) return <><p className="text-red-300">Hoje</p><p className="text-red-300">17:00</p><p className="text-xs text-red-300">⏱ 1h 12m</p></>;
  if (index === 2) return <><p>Amanhã</p><p>17:00</p><p className="text-xs text-amber-300">⏱ 1d 3h</p></>;
  return <><p>20/12</p><p>17:00</p><p className="text-xs">⏱ 2d 3h</p></>;
}

function toneBg(tone: 'green' | 'amber' | 'blue' | 'purple' | 'red') {
  return {
    green: 'bg-emerald-500/18 text-emerald-300 ring-1 ring-emerald-500/20',
    amber: 'bg-amber-500/18 text-amber-300 ring-1 ring-amber-500/20',
    blue: 'bg-sky-500/18 text-sky-300 ring-1 ring-sky-500/20',
    purple: 'bg-violet-500/18 text-violet-300 ring-1 ring-violet-500/20',
    red: 'bg-red-500/18 text-red-300 ring-1 ring-red-500/20',
  }[tone];
}

function fileBg(color: string) {
  return {
    red: 'bg-red-600',
    green: 'bg-emerald-600',
    blue: 'bg-sky-600',
  }[color] ?? 'bg-slate-600';
}

export function SmallArrowRow({
  icon: Icon = ChevronRight,
  title,
  subtitle,
  tone = 'green',
  onClick,
}: {
  icon?: ElementType;
  title: string;
  subtitle?: string;
  tone?: 'green' | 'amber' | 'blue' | 'purple' | 'red';
  onClick?: () => void;
}) {
  const className = 'flex w-full min-w-0 items-center gap-3 rounded-xl border border-border/60 bg-white/[0.025] p-3 text-left transition-colors hover:bg-white/[0.045]';
  const content = (
    <>
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneBg(tone))}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-medium text-foreground">{title}</p>
        {subtitle ? <p className="mt-0.5 break-words text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function CompanySelect({ onClick }: { onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="neo-action-button min-w-0 justify-between sm:min-w-[260px]">
      <span className="flex min-w-0 items-center gap-2"><Building2 className="h-5 w-5 shrink-0 text-primary" /> <span className="truncate">Neoenergia Coelba</span></span>
      <ChevronDown className="h-4 w-4" />
    </button>
  );
}

export function QuickTabs({ items, active = 0, onChange }: { items: string[]; active?: number; onChange?: (index: number, item: string) => void }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange?.(index, item)}
          className={cn('min-w-0 max-w-full truncate rounded-lg border px-4 py-2 text-sm transition-colors', index === active ? 'border-primary/30 bg-primary text-primary-foreground' : 'border-border/70 bg-white/[0.035] text-muted-foreground hover:text-foreground')}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
