import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, QuickTabs, StatCard } from '@/components/neo/NeoReferenceUI';
import {
  buildIndicatorAssessment,
  formatValue,
  getIndicatorProfileById,
  indicatorProfiles,
} from '@/lib/indicatorIntelligence';
import { cn } from '@/lib/utils';

const yearOptions = [2022, 2023, 2024, 2025, 2026];

const Indicators: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProfileId, setSelectedProfileId] = useState('ind-dec');
  const [fromYear, setFromYear] = useState(2023);
  const [toYear, setToYear] = useState(2024);
  const [query, setQuery] = useState('');

  const profile = getIndicatorProfileById(selectedProfileId) ?? indicatorProfiles[0];
  const assessment = useMemo(() => buildIndicatorAssessment(profile, [fromYear, toYear]), [profile, fromYear, toYear]);
  const deltaIcon = assessment.delta.improved ? CheckCircle2 : profile.direction === 'lower-is-better' ? TrendingUp : TrendingDown;
  const deltaTone = assessment.delta.improved ? 'green' : 'amber';
  const filteredProfiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return indicatorProfiles;
    return indicatorProfiles.filter((item) =>
      [item.acronym, item.name, item.businessQuestion, ...item.goodFor, ...item.aliases]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [query]);

  const prompt = `Compare ${profile.acronym} ${fromYear} e ${toYear} e diga se esse indicador faz sentido`;
  const chartPoints = profile.series;
  const minValue = Math.min(...chartPoints.map((point) => Math.min(point.value, point.target)));
  const maxValue = Math.max(...chartPoints.map((point) => Math.max(point.value, point.target)));
  const valueRange = Math.max(1, maxValue - minValue);
  const linePoints = chartPoints
    .map((point, index) => {
      const x = 34 + (index * 432) / Math.max(1, chartPoints.length - 1);
      const y = 190 - ((point.value - minValue) / valueRange) * 140;
      return `${x},${y}`;
    })
    .join(' ');
  const targetPoints = chartPoints
    .map((point, index) => {
      const x = 34 + (index * 432) / Math.max(1, chartPoints.length - 1);
      const y = 190 - ((point.target - minValue) / valueRange) * 140;
      return `${x},${y}`;
    })
    .join(' ');

  const openIrisPrompt = async () => {
    await navigator.clipboard?.writeText(prompt).catch(() => undefined);
    toast.success('Pergunta pronta para a IRIS', {
      description: 'Copiei o prompt. Abra a IRIS no canto da tela e cole para ver a resposta analítica.',
    });
  };

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageTitle
            icon={BarChart3}
            title="Inteligência de Indicadores"
            description="Compare anos, entenda metas e valide se o indicador responde à pergunta certa antes de abrir relatórios."
            actions={
              <>
                <button type="button" onClick={openIrisPrompt} className="neo-action-button">
                  <Bot className="h-4 w-4" />
                  Perguntar à IRIS
                </button>
                <button type="button" onClick={() => navigate('/reports')} className="neo-primary-button">
                  <FileText className="h-4 w-4" />
                  Ver fontes
                </button>
              </>
            }
          />

          <section className="neo-ai-hero mb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <span className="neo-chip border-primary/30 bg-primary/10 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Série histórica 2022-2026
                </span>
                <h2 className="mt-4 max-w-4xl text-2xl font-semibold text-foreground sm:text-3xl">{profile.acronym}: {profile.businessQuestion}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{assessment.verdict}</p>
              </div>
              <button type="button" onClick={openIrisPrompt} className="neo-action-button shrink-0">
                <Bot className="h-4 w-4" />
                Perguntar esta comparação
              </button>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <Panel title="Escolher indicador">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="neo-control h-11 w-full pl-10 pr-3 text-sm"
                    placeholder="Buscar DEC, FEC, SLA..."
                  />
                </div>
                <div className="space-y-2">
                  {filteredProfiles.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedProfileId(item.id)}
                      className={cn(
                        'w-full rounded-xl border p-3 text-left transition-colors',
                        item.id === profile.id
                          ? 'border-primary/45 bg-primary/10 text-foreground'
                          : 'border-border/70 bg-background/55 text-muted-foreground hover:border-primary/30 hover:text-foreground dark:bg-white/[0.025]'
                      )}
                    >
                      <span className="block text-sm font-semibold">{item.acronym}</span>
                      <span className="mt-1 line-clamp-2 block text-xs">{item.name}</span>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Comparar anos">
                <p className="mb-2 text-sm font-medium text-foreground">Ano base</p>
                <QuickTabs items={yearOptions.map(String)} active={yearOptions.indexOf(fromYear)} onChange={(index) => setFromYear(yearOptions[index])} />
                <p className="mb-2 mt-4 text-sm font-medium text-foreground">Ano comparado</p>
                <QuickTabs items={yearOptions.map(String)} active={yearOptions.indexOf(toYear)} onChange={(index) => setToYear(yearOptions[index])} />
              </Panel>
            </aside>

            <main className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                  icon={deltaIcon}
                  label={`${fromYear} → ${toYear}`}
                  value={`${assessment.delta.rawDelta > 0 ? '+' : ''}${assessment.delta.rawDelta.toFixed(1)} ${profile.unit}`}
                  trend={`${assessment.delta.percent > 0 ? '+' : ''}${assessment.delta.percent.toFixed(1)}% no período`}
                  tone={deltaTone}
                />
                <StatCard
                  icon={Target}
                  label={`Meta ${assessment.latest.year}`}
                  value={formatValue(profile, assessment.latest.target)}
                  trend={assessment.targetVerdict}
                  tone={assessment.targetGap >= 0 ? 'green' : 'amber'}
                />
              </div>

              <Panel>
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Evolução anual e meta</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Linha verde: realizado. Linha tracejada: meta.</p>
                  </div>
                  <button type="button" onClick={() => toast.success('Análise recalculada', { description: assessment.verdict })} className="neo-action-button">
                    <Sparkles className="h-4 w-4" />
                    Reavaliar
                  </button>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-border/70 bg-[#071522] p-4">
                  <svg viewBox="0 0 500 230" className="h-[280px] w-full">
                    {[0, 1, 2, 3].map((line) => (
                      <line key={line} x1="30" x2="472" y1={50 + line * 46} y2={50 + line * 46} stroke="rgba(255,255,255,.08)" />
                    ))}
                    <polyline points={targetPoints} fill="none" stroke="#38bdf8" strokeDasharray="7 7" strokeWidth="3" />
                    <polyline points={linePoints} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {chartPoints.map((point, index) => {
                      const x = 34 + (index * 432) / Math.max(1, chartPoints.length - 1);
                      const y = 190 - ((point.value - minValue) / valueRange) * 140;
                      const selected = point.year === fromYear || point.year === toYear;
                      return (
                        <g key={point.year}>
                          <circle cx={x} cy={y} r={selected ? 7 : 5} fill={selected ? '#f59e0b' : '#22c55e'} />
                          <text x={x} y="216" textAnchor="middle" fill="rgba(255,255,255,.72)" fontSize="12">{point.year}</text>
                          {selected ? <text x={x} y={Math.max(18, y - 13)} textAnchor="middle" fill="#f8fafc" fontSize="12">{formatValue(profile, point.value)}</text> : null}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </Panel>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Panel title="O indicador faz sentido?">
                  <div className="space-y-4 text-sm">
                    <p className="leading-6 text-muted-foreground">
                      Use para {profile.goodFor.slice(0, 3).join(', ')}. Evite analisar sozinho quando a pergunta depender de {profile.avoidFor[0]}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.related.map((item) => (
                        <span key={item} className="neo-chip">
                          <Lightbulb className="h-3.5 w-3.5 text-primary" />
                          Cruzar com {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </Panel>

                <Panel title="Relatórios usados na comparação">
                  <div className="space-y-2">
                    {assessment.selected.map((point) => (
                      <button
                        key={`${point.reportId}-${point.year}`}
                        type="button"
                        onClick={() => navigate(`/reports?query=${encodeURIComponent(point.reportName)}`)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/55 p-3 text-left transition-colors hover:border-primary/35 dark:bg-white/[0.025]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{point.reportName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{point.year} · {point.note}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>
            </main>
          </div>
        </div>
      </div>
      <FloatingAssistant currentLevel="indicators" selectedCompanyId="coelba" selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default Indicators;
