import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  FileSearch,
  FileText,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { companies } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityRow, PageHeader, PremiumPanel } from '@/components/premium/PremiumShell';
import { reportDetailPath } from '@/lib/reportRouting';

const decisionCards = [
  {
    title: 'Comparar indicador',
    description: 'Entenda meta, ano, tendência e se o KPI responde à pergunta certa.',
    icon: BarChart3,
    path: '/indicators',
    tone: 'text-sky-300 bg-sky-500/14 border-sky-500/20',
  },
  {
    title: 'Encontrar relatório',
    description: 'Busque a fonte, abra o detalhe e valide dono, status e histórico.',
    icon: FileSearch,
    path: '/reports',
    tone: 'text-emerald-300 bg-emerald-500/14 border-emerald-500/20',
  },
  {
    title: 'Ver pendências',
    description: 'Priorize aprovações e decisões que travam a publicação.',
    icon: ShieldCheck,
    path: '/approvals',
    tone: 'text-amber-300 bg-amber-500/14 border-amber-500/20',
  },
];

const recentReports = [
  'Relatório SLA Comercial Q4 2024',
  'Dashboard Operacional Dezembro',
  'Relatório Inadimplência Q4 2024',
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [assistantKey, setAssistantKey] = useState(0);

  const filteredCompanies = useMemo(
    () =>
      companies
        .filter((company) => `${company.name} ${company.fullName}`.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 4),
    [searchQuery]
  );

  const submitDecision = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      setAssistantKey((key) => key + 1);
      return;
    }

    if (/\b(dec|fec|sla|isqp|indicador|kpi|compar)/i.test(normalized)) {
      navigate('/indicators');
      return;
    }

    if (/\b(relat|pdf|document|fonte|arquivo)/i.test(normalized)) {
      navigate(`/reports?query=${encodeURIComponent(searchQuery.trim())}`);
      return;
    }

    setAssistantKey((key) => key + 1);
  };

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageHeader
            icon={Bot}
            title="Central de Decisão"
            description="Comece pela pergunta de negócio. A NeoView ajuda a chegar no indicador certo, comparar períodos e abrir o relatório fonte."
            actions={
              <Button className="rounded-xl" onClick={() => setAssistantKey((key) => key + 1)}>
                <Bot className="mr-2 h-4 w-4" />
                Abrir IRIS
              </Button>
            }
          />

          <section className="neo-ai-hero mb-5">
            <form onSubmit={submitDecision} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pergunta de negócio</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">O que você quer entender agora?</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Ex.: compare DEC 2023 e 2024, encontre o relatório de SLA ou mostre pendências de aprovação.
                </p>
                <div className="relative mt-5 max-w-3xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="neo-control h-14 rounded-xl pl-12 text-base"
                    placeholder="Digite uma dúvida, indicador ou relatório..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" className="h-12 rounded-xl px-5">
                Começar análise
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            {decisionCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => navigate(card.path)}
                  className="neo-surface neo-card-hover min-h-[150px] rounded-xl p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${card.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <PremiumPanel title="Continuar por empresa" description="Use a hierarquia quando a dúvida começa pela distribuidora ou área.">
              <div className="grid gap-3 md:grid-cols-2">
                {filteredCompanies.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => navigate(`/dashboard?company=${company.id}`)}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/55 p-4 text-left transition-colors hover:border-primary/35 dark:bg-white/[0.035]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{company.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{company.fullName}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </PremiumPanel>

            <PremiumPanel title="Fontes recentes" actionLabel="Ver relatórios" onAction={() => navigate('/reports')}>
              <div className="space-y-3">
                {recentReports.map((title, index) => (
                  <button key={title} type="button" onClick={() => navigate(reportDetailPath(title))} className="w-full">
                    <ActivityRow
                      icon={index === 0 ? CheckCircle2 : FileText}
                      title={title}
                      subtitle={index === 0 ? 'Fonte validada · Comercial' : 'Neoenergia Coelba'}
                      meta={index === 0 ? 'Hoje' : 'Ontem'}
                      tone={index === 0 ? 'green' : 'blue'}
                    />
                  </button>
                ))}
              </div>
            </PremiumPanel>
          </div>
        </div>
      </div>

      <FloatingAssistant
        key={assistantKey}
        defaultChatOpen={assistantKey > 0}
        currentLevel="companies"
        selectedCompanyId={undefined}
        selectedSupId={undefined}
        selectedMgmtId={undefined}
        selectedProjId={undefined}
      />
    </>
  );
};

export default Home;
