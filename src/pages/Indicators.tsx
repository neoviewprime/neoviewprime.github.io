import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, Download, Plus, Save, Share2 } from "lucide-react";

import { FloatingAssistant } from "@/components/FloatingAssistant";
import { ChartBuilder } from "@/components/analytics/ChartBuilder";
import { CompanySelector } from "@/components/analytics/CompanySelector";
import { analyticsCompanies, type AnalyticsCompanyOption } from "@/hooks/useAnalyticsChart";
import { FilterChip, MetricCard, PageHeader, PremiumPanel } from "@/components/premium/PremiumShell";
import { Button } from "@/components/ui/button";

const Indicators: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCompanyId = searchParams.get("company");
  const initialWorkspaceId = searchParams.get("chart");
  const [selectedCompany, setSelectedCompany] = useState<AnalyticsCompanyOption | null>(() =>
    analyticsCompanies.find((company) => company.id === initialCompanyId) ?? null
  );

  const handleSelectCompany = (company: AnalyticsCompanyOption) => {
    setSelectedCompany((current) => {
      const next = current?.id === company.id ? null : company;
      if (next) {
        navigate(`/indicators?company=${encodeURIComponent(next.id)}`, { replace: true });
      } else {
        navigate("/indicators", { replace: true });
      }
      return next;
    });
  };

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageHeader
            icon={BarChart3}
            title="Estatísticas"
            description="Crie gráficos personalizados com dados confiáveis para análises estratégicas."
            actions={
              <>
                <Button variant="outline" className="rounded-2xl"><Share2 className="mr-2 h-4 w-4" />Compartilhar</Button>
                <Button variant="outline" className="rounded-2xl"><Download className="mr-2 h-4 w-4" />Exportar</Button>
                <Button className="rounded-2xl"><Save className="mr-2 h-4 w-4" />Salvar como modelo</Button>
              </>
            }
          />

          <section className="neo-surface mb-4 rounded-[28px] p-5">
            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Empresa</p>
                <div className="rounded-2xl border border-border/70 bg-background/55 px-4 py-3 text-sm text-foreground dark:bg-white/[0.035]">
                  {selectedCompany?.name ?? 'Selecione uma empresa abaixo'}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Modelos salvos</p>
                <div className="flex flex-wrap gap-2">
                  {['Visão Executiva', 'Desempenho Operacional', 'Indicadores ESG', 'Financeiro Consolidado'].map((model, index) => (
                    <FilterChip key={model} active={index === 0}>{model}</FilterChip>
                  ))}
                  <FilterChip><Plus className="mr-2 inline h-4 w-4" />Ver todos</FilterChip>
                </div>
              </div>
            </div>
          </section>

          <section className="neo-surface mb-4 rounded-[24px] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-medium text-foreground">Período</span>
              {['7D', '30D', '3M', '6M', '12M', 'Personalizado'].map((period) => (
                <FilterChip key={period} active={period === '30D'}>{period}</FilterChip>
              ))}
              <span className="ml-auto text-sm text-muted-foreground">Comparar com</span>
              <FilterChip>Período anterior</FilterChip>
            </div>
          </section>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <MetricCard label="Total" value="128" helper="vs período anterior" icon={BarChart3} tone="blue" trend="+12%" />
            <MetricCard label="Aprovados" value="86" helper="vs período anterior" icon={BarChart3} tone="green" trend="+15%" />
            <MetricCard label="Pendentes" value="18" helper="vs período anterior" icon={BarChart3} tone="amber" trend="-8%" />
            <MetricCard label="Rejeitados" value="6" helper="vs período anterior" icon={BarChart3} tone="red" trend="-25%" />
          </div>

          <PremiumPanel title="Área de análise avançada" description="Escolha a empresa, selecione ou crie modelos e ajuste métricas no painel de configuração do gráfico.">
            <CompanySelector
              companies={analyticsCompanies}
              selectedCompanyId={selectedCompany?.id ?? null}
              onSelect={handleSelectCompany}
              renderExpanded={(company) => (
                <ChartBuilder
                  companyId={company.id}
                  initialWorkspaceId={company.id === initialCompanyId ? initialWorkspaceId : null}
                />
              )}
            />
          </PremiumPanel>
        </div>
      </div>

      <FloatingAssistant
        currentLevel="indicators"
        selectedCompanyId={selectedCompany?.id}
        selectedSupId={undefined}
        selectedMgmtId={undefined}
        selectedProjId={undefined}
      />
    </>
  );
};

export default Indicators;
