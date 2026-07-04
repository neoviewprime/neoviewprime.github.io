import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import companyLogo from "@/components/images/IB-Symbol positive colour_white background.png";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnalyticsCompanyOption } from "@/hooks/useAnalyticsChart";

interface CompanySelectorProps {
  companies: AnalyticsCompanyOption[];
  selectedCompanyId: string | null;
  onSelect: (company: AnalyticsCompanyOption) => void;
  renderExpanded?: (company: AnalyticsCompanyOption) => ReactNode;
}

export function CompanySelector({ companies, selectedCompanyId, onSelect, renderExpanded }: CompanySelectorProps) {
  return (
    <div className="space-y-4">
      {companies.map((company) => {
        const isSelected = company.id === selectedCompanyId;

        return (
          <Card
            key={company.id}
            className={cn(
              "overflow-hidden border-primary/50 bg-card transition-all duration-300",
              isSelected && "border-primary shadow-[0_12px_40px_rgba(0,164,67,0.14)]"
            )}
          >
            <button type="button" className="w-full min-w-0 text-left" onClick={() => onSelect(company)}>
              <CardContent className="flex min-w-0 items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <img
                    src={companyLogo}
                    alt="Neoenergia"
                    className="h-10 w-10 rounded-full border border-primary/20 bg-background p-1.5 sm:h-11 sm:w-11"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground sm:truncate sm:text-sm">Toque para abrir os gráficos desta empresa</p>
                  </div>
                </div>
                {isSelected ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-primary" />
                )}
              </CardContent>
            </button>

            {isSelected && renderExpanded ? (
              <div className="border-t border-primary/20 p-3 pt-0 sm:p-5 sm:pt-0">
                <div className="pt-3 sm:pt-5">{renderExpanded(company)}</div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
