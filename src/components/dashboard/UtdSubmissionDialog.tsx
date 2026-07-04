import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { isValidExternalUrl, shouldWarnInsecureExternalUrl } from '@/lib/externalUrl';

export interface UtdSubmissionFormValues {
  reportName: string;
  reportDescription: string;
  reportUrl: string;
  reportDate: string;
  indicatorsText: string;
}

const createEmptyForm = (): UtdSubmissionFormValues => ({
  reportName: '',
  reportDescription: '',
  reportUrl: '',
  reportDate: new Date().toISOString().slice(0, 10),
  indicatorsText: ''
});

const hasMeaningfulDraft = (form: UtdSubmissionFormValues): boolean =>
  Object.values(form).some((value) => value.trim().length > 0);

const readStoredDraft = (storageKey?: string): UtdSubmissionFormValues => {
  if (!storageKey || typeof window === 'undefined') return createEmptyForm();
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return createEmptyForm();

  try {
    return { ...createEmptyForm(), ...(JSON.parse(raw) as Partial<UtdSubmissionFormValues>) };
  } catch {
    return createEmptyForm();
  }
};

interface UtdSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  isSubmitting?: boolean;
  onSubmit: (values: UtdSubmissionFormValues) => Promise<void> | void;
  draftStorageKey?: string;
  initialDraft?: UtdSubmissionFormValues | null;
  isDraftLoading?: boolean;
  onDraftChange?: (values: UtdSubmissionFormValues) => void;
  onDraftClear?: () => void;
}

export const UtdSubmissionDialog: React.FC<UtdSubmissionDialogProps> = ({
  open,
  onOpenChange,
  attributeName,
  isSubmitting = false,
  onSubmit,
  draftStorageKey,
  initialDraft,
  isDraftLoading = false,
  onDraftChange,
  onDraftClear,
}) => {
  const resolveInitialForm = (): UtdSubmissionFormValues => {
    const localDraft = readStoredDraft(draftStorageKey);
    if (hasMeaningfulDraft(localDraft)) return localDraft;
    return initialDraft ? { ...createEmptyForm(), ...initialDraft } : localDraft;
  };

  const [form, setForm] = useState<UtdSubmissionFormValues>(() => resolveInitialForm());
  const hasTypedUrl = form.reportUrl.trim().length > 0;
  const hasValidUrl = isValidExternalUrl(form.reportUrl);
  const showInsecureUrlWarning = shouldWarnInsecureExternalUrl(form.reportUrl);

  useEffect(() => {
    setForm(resolveInitialForm());
  }, [draftStorageKey, initialDraft]);

  useEffect(() => {
    if (open) {
      setForm(resolveInitialForm());
    }
  }, [draftStorageKey, initialDraft, open]);

  useEffect(() => {
    if (!draftStorageKey || typeof window === 'undefined') return;

    if (hasMeaningfulDraft(form)) {
      window.localStorage.setItem(draftStorageKey, JSON.stringify(form));
      return;
    }

    window.localStorage.removeItem(draftStorageKey);
  }, [draftStorageKey, form]);

  useEffect(() => {
    if (!open) return;
    if (hasMeaningfulDraft(form)) {
      onDraftChange?.(form);
      return;
    }
    onDraftClear?.();
  }, [form, onDraftChange, onDraftClear, open]);

  const patchForm = (patch: Partial<UtdSubmissionFormValues>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const handleSubmit = async () => {
    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,860px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{`Novo relatório de ${attributeName}`}</DialogTitle>
          <DialogDescription>
            Cadastre o relatório diretamente no fluxo UTD da Coelba. Se você sair sem concluir,
            o conteúdo fica salvo como rascunho local para continuar depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="utd-report-name">Nome do relatório *</Label>
            <Input
              id="utd-report-name"
              value={form.reportName}
              onChange={(event) => patchForm({ reportName: event.target.value })}
              placeholder="Ex.: Painel Financeiro Mensal"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="utd-report-description">Descrição</Label>
            <Textarea
              id="utd-report-description"
              value={form.reportDescription}
              onChange={(event) => patchForm({ reportDescription: event.target.value })}
              placeholder="Resumo executivo do conteúdo, contexto e principais pontos."
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="utd-report-url">Link do relatório *</Label>
              <Input
                id="utd-report-url"
                value={form.reportUrl}
                onChange={(event) => patchForm({ reportUrl: event.target.value })}
                placeholder="https://... ou http://..."
                className={cn(showInsecureUrlWarning && 'border-amber-500 focus-visible:ring-amber-500')}
              />
              {hasTypedUrl && !hasValidUrl ? (
                <p className="text-xs text-destructive">
                  Informe um link externo válido para continuar.
                </p>
              ) : null}
              {showInsecureUrlWarning ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Este link não usa HTTPS. O sistema vai permitir o acesso, mas ele pode não ser seguro.</span>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="utd-report-date">Data de submissão *</Label>
              <Input
                id="utd-report-date"
                type="date"
                value={form.reportDate}
                onChange={(event) => patchForm({ reportDate: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="utd-indicators">Indicadores *</Label>
            <Input
              id="utd-indicators"
              value={form.indicatorsText}
              onChange={(event) => patchForm({ indicatorsText: event.target.value })}
              placeholder="Ex.: Receita faturada, inadimplência, EBITDA"
            />
            <p className="text-xs text-muted-foreground">
              Separe os indicadores por vírgula para que o chatbot consiga encontrá-los depois.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Fechar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isDraftLoading}>
            {isSubmitting ? 'Salvando...' : 'Salvar relatório'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
