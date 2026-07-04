import React from 'react';

import { NeoLogo } from '@/components/NeoLogo';
import { Button } from '@/components/ui/button';

interface FlowPathCardProps {
  title: string;
  description: string;
  onEnter: () => void;
  buttonLabel?: string;
}

export const FlowPathCard: React.FC<FlowPathCardProps> = ({
  title,
  description,
  onEnter,
  buttonLabel = 'Entrar'
}) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <NeoLogo size="lg" showText={false} />
        </div>

        <h3 className="mt-6 text-2xl font-semibold text-foreground">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>

        <Button className="mt-8 min-w-32" onClick={onEnter}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
};
