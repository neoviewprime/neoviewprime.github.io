/**
 * PAGE: Home (Início) — Corrigido para MainLayout
 *
 * Agora esta página contém APENAS o conteúdo principal.
 * O TopNavbar e o AppSidebar são controlados pelo MainLayout.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Clock3, FileText, Search, ShieldCheck, Sparkles, Star, Upload } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { companies } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ActivityRow, MetricCard, PageHeader, PremiumPanel } from '@/components/premium/PremiumShell';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredCompanies = useMemo(
    () =>
      companies.filter((company) =>
        `${company.name} ${company.fullName}`.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const companyMetrics = [
    { lastAccess: 'Hoje, 10:32', pending: 12, approved: 44 },
    { lastAccess: 'Ontem, 16:21', pending: 7, approved: 31 },
    { lastAccess: '17/12, 09:47', pending: 5, approved: 28 },
    { lastAccess: '16/12, 14:16', pending: 9, approved: 36 },
    { lastAccess: '15/12, 11:03', pending: 3, approved: 22 },
  ];

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageHeader
            icon={Building2}
            title="Início"
            description="Escolha uma empresa, retome acessos recentes e acompanhe atalhos importantes do seu dia."
            actions={
              <Button className="rounded-2xl" onClick={() => navigate('/reports')}>
                <Upload className="mr-2 h-4 w-4" />
                Enviar relatório
              </Button>
            }
          />

          <section className="neo-page-header mb-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hub executivo</p>
                <h2 className="mt-2 text-2xl font-semibold text-foreground">Bem-vindo ao NeoView</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Encontre rapidamente relatórios, indicadores e empresas do grupo Neoenergia em uma experiência mais clara e executiva.
                </p>
                <div className="relative mt-5 max-w-2xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="neo-control h-14 rounded-2xl pl-12 text-base"
                    placeholder="Buscar empresa, relatório ou indicador..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Pendências" value="36" helper="Em todas as empresas" icon={Clock3} tone="amber" trend="+8 vs ontem" />
                <MetricCard label="Aprovados" value="161" helper="Últimos 30 dias" icon={ShieldCheck} tone="green" trend="+12% no mês" />
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <PremiumPanel title="Empresas" description="Acesse a hierarquia, relatórios e indicadores de cada distribuidora.">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCompanies.map((company, index) => {
                    const metrics = companyMetrics[index % companyMetrics.length];
                    return (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => navigate(`/dashboard?company=${company.id}`)}
                        className="neo-surface neo-card-hover rounded-[24px] p-5 text-left"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-foreground">{company.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{company.fullName}</p>
                        <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                          <div className="rounded-2xl border border-border/70 bg-background/55 p-3 dark:bg-white/[0.035]">
                            <p className="text-muted-foreground">Último acesso</p>
                            <p className="mt-1 font-medium text-foreground">{metrics.lastAccess}</p>
                          </div>
                          <div className="rounded-2xl border border-border/70 bg-background/55 p-3 dark:bg-white/[0.035]">
                            <p className="text-muted-foreground">Pendências</p>
                            <p className="mt-1 font-medium text-foreground">{metrics.pending} abertas</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PremiumPanel>

              <PremiumPanel title="Relatórios abertos recentemente" actionLabel="Ver relatórios" onAction={() => navigate('/reports')}>
                <div className="grid gap-3 md:grid-cols-2">
                  {['Relatório SLA Comercial Q4 2024', 'Dashboard Operacional Dezembro', 'Pesquisa Satisfação Corporativa', 'Comparativo Geração x Consumo'].map((title, index) => (
                    <ActivityRow
                      key={title}
                      icon={FileText}
                      title={title}
                      subtitle={index % 2 === 0 ? 'Neoenergia Coelba · Comercial' : 'Neoenergia Pernambuco · Operações'}
                      meta={index === 0 ? 'Hoje' : 'Ontem'}
                      tone={index % 2 === 0 ? 'green' : 'blue'}
                    />
                  ))}
                </div>
              </PremiumPanel>
            </div>

            <aside className="space-y-6">
              <PremiumPanel title="Acessos recentes">
                <div className="space-y-3">
                  {companies.slice(0, 4).map((company, index) => (
                    <ActivityRow key={company.id} icon={Building2} title={company.name} subtitle={company.fullName} meta={companyMetrics[index].lastAccess} tone="green" />
                  ))}
                </div>
              </PremiumPanel>

              <PremiumPanel title="Atalhos rápidos">
                <div className="grid gap-3">
                  {[
                    { label: 'Meu Workspace', icon: Sparkles, path: '/workspace' },
                    { label: 'Validações pendentes', icon: ShieldCheck, path: '/approvals' },
                    { label: 'Favoritos', icon: Star, path: '/favorites' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/55 p-4 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/30 dark:bg-white/[0.035]"
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-primary" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </PremiumPanel>
            </aside>
          </div>
        </div>
      </div>

      <FloatingAssistant
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
