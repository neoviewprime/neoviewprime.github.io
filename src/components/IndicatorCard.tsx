import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Indicator } from '@/data/mockData';

interface IndicatorCardProps {
  indicator: Indicator;
  highlighted?: boolean;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({ indicator, highlighted }) => {
  const [isExpanded, setIsExpanded] = useState(highlighted || false);

  const trendIcons = {
    up: <TrendingUp className="w-5 h-5 text-primary" />,
    down: <TrendingDown className="w-5 h-5 text-destructive" />,
    stable: <Minus className="w-5 h-5 text-muted-foreground" />,
  };

  const trendColors = {
    up: 'bg-primary/10 text-primary',
    down: 'bg-destructive/10 text-destructive',
    stable: 'bg-muted text-muted-foreground',
  };

  return (
    <div
      className={`bg-card rounded-xl border transition-all duration-300 ${
        highlighted ? 'border-primary shadow-card-hover ring-2 ring-primary/20' : 'border-border shadow-card'
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${trendColors[indicator.trend]}`}>
            {trendIcons[indicator.trend]}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{indicator.name}</h4>
            <p className="text-2xl font-bold text-primary mt-1">
              {indicator.value} <span className="text-sm font-normal text-muted-foreground">{indicator.unit}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {indicator.reports.length} {indicator.reports.length === 1 ? 'relatório' : 'relatórios'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-border pt-4 animate-fade-in">
          <h5 className="text-sm font-medium text-muted-foreground mb-3">Relatórios PDF</h5>
          <div className="space-y-2">
            {indicator.reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors group">
                  <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
