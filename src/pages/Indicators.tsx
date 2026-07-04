import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3 } from "lucide-react";

import { FloatingAssistant } from "@/components/FloatingAssistant";
import { ChartBuilder } from "@/components/analytics/ChartBuilder";
import { CompanySelector } from "@/components/analytics/CompanySelector";
import { analyticsCompanies, type AnalyticsCompanyOption } from "@/hooks/useAnalyticsChart";

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
      <div className="container mx-auto min-w-0 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 rounded-[28px] border border-border/70 bg-card/70 p-4 shadow-sm sm:mb-8 sm:p-6">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="rounded-2xl bg-primary/10 p-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Estatísticas</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Selecione uma empresa para montar gráficos personalizados com dados demonstrativos de engajamento.
              </p>
            </div>
          </div>
        </div>

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
