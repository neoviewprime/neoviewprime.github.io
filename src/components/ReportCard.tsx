import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, ExternalLink, FileText, Heart, MessageCircle, Search, Share2, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PdfReport, ReportMetrics } from '@/data/mockData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { API_URL } from '@/lib/api';
import { getStoredAuthToken } from '@/lib/authToken';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  isFavoriteReport,
  subscribeFavoriteReports,
  toggleFavoriteReportRemote,
  updateFavoriteReportMetrics
} from '@/lib/reportFavorites';
import { formatMetricCount } from '@/lib/metricLabels';
import { mapearMetricasDaApi, type MetricasApi } from '@/lib/metricasEngajamento';

interface ReportCardProps {
  report: PdfReport;
  onMetricsChange?: (reportId: string, metrics: ReportMetrics) => void;
  className?: string;
  reportPath?: string[];
  companyId?: string;
  autoOpen?: boolean;
  highlighted?: boolean;
}

type CommentNode = {
  id: string;
  message: string;
  actor_key: string;
  created_at: string;
  parent_comment_id: string | null;
  replies: CommentNode[];
};

type ShareTarget = {
  id: string;
  name: string;
  email?: string;
};

const buildReportQuery = (reportName: string): string => {
  const params = new URLSearchParams({ reportName });
  return `?${params.toString()}`;
};

export function ReportCard({
  report,
  onMetricsChange,
  className,
  reportPath,
  companyId,
  autoOpen = false,
  highlighted = false,
}: ReportCardProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ReportMetrics>(report.metrics);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [likeActive, setLikeActive] = useState(false);
  const [shareTargets, setShareTargets] = useState<ShareTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [shareSearchTerm, setShareSearchTerm] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const autoOpenedReportRef = useRef<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const metricsRequestVersionRef = useRef(0);
  const sourceId = useMemo(() => report.id, [report.id]);
  const reportQuery = useMemo(() => buildReportQuery(report.name), [report.name]);
  const normalizedShareSearch = shareSearchTerm.trim().toLowerCase();
  const selectedTargetItems = useMemo(
    () => shareTargets.filter((target) => selectedTargets.includes(target.id)),
    [selectedTargets, shareTargets]
  );
  const suggestedTargets = useMemo(() => {
    const pool = shareTargets.filter((target) => !selectedTargets.includes(target.id));
    if (!normalizedShareSearch) return pool.slice(0, 8);
    return pool
      .filter((target) => `${target.name} ${target.email ?? ''}`.toLowerCase().includes(normalizedShareSearch))
      .slice(0, 8);
  }, [normalizedShareSearch, selectedTargets, shareTargets]);

  const authHeaders = () => {
    const token = getStoredAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const applyMetrics = (nextMetrics: ReportMetrics) => {
    setMetrics(nextMetrics);
    onMetricsChange?.(report.id, nextMetrics);
    updateFavoriteReportMetrics(report.id, nextMetrics, user?.id);
  };

  const syncMetrics = async () => {
    const requestVersion = metricsRequestVersionRef.current;
    const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(sourceId)}/engagement${reportQuery}`, {
      headers: authHeaders()
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { metrics?: MetricasApi };
    if (payload.metrics && requestVersion === metricsRequestVersionRef.current) {
      applyMetrics(mapearMetricasDaApi(payload.metrics));
    }
  };

  const markMetricsMutation = () => {
    metricsRequestVersionRef.current += 1;
  };

  const loadComments = async () => {
    const response = await fetch(
      `${API_URL}/reports/catalog/by-source/${encodeURIComponent(sourceId)}/comments/tree${reportQuery}&limit=200`,
      { headers: authHeaders() }
    );
    if (!response.ok) return;
    const payload = (await response.json()) as { comments?: CommentNode[] };
    setComments(payload.comments ?? []);
  };

  const loadShareTargets = async () => {
    const response = await fetch(`${API_URL}/reports/catalog/share-targets?limit=20`, {
      headers: authHeaders()
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: `HTTP ${response.status}` }))) as { error?: string };
      throw new Error(payload.error ?? `HTTP ${response.status}`);
    }
    const payload = (await response.json()) as { users?: ShareTarget[] };
    setShareTargets(payload.users ?? []);
  };

  useEffect(() => {
    syncMetrics().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportQuery, sourceId]);

  useEffect(() => {
    setMetrics(report.metrics);
  }, [report.metrics]);

  useEffect(() => {
    const syncFavoriteState = () => setIsFavorite(isFavoriteReport(report.id, user?.id));
    syncFavoriteState();
    return subscribeFavoriteReports(syncFavoriteState);
  }, [report.id, user?.id]);

  useEffect(() => {
    if (!autoOpen) return;
    if (autoOpenedReportRef.current === sourceId) return;
    autoOpenedReportRef.current = sourceId;
    openDetails().catch(() => undefined);
  }, [autoOpen, sourceId]);

  useEffect(() => {
    if (!highlighted) {
      setShowHighlight(false);
      return;
    }

    setShowHighlight(true);
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const timeoutId = window.setTimeout(() => {
      setShowHighlight(false);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [highlighted, sourceId]);

  const openDetails = async () => {
    setIsLoading(true);
    try {
      markMetricsMutation();
      const viewResponse = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(sourceId)}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'view', userId: user?.id, reportName: report.name })
      });
      if (viewResponse.ok) {
        const payload = (await viewResponse.json()) as { metrics?: MetricasApi };
        if (payload.metrics) {
          applyMetrics(mapearMetricasDaApi(payload.metrics));
        }
      }
      await Promise.all([loadComments(), loadShareTargets()]);
      setIsDetailsOpen(true);
    } catch (error) {
      toast({
        title: 'Não foi possível abrir o relatório',
        description: (error as Error).message || 'Falha ao carregar os detalhes do relatório.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async () => {
    setIsLoading(true);
    try {
      markMetricsMutation();
      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(sourceId)}/likes/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ userId: user?.id, reportName: report.name })
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { liked?: boolean; metrics?: MetricasApi };
      setLikeActive(Boolean(payload.liked));
      if (payload.metrics) {
        applyMetrics(mapearMetricasDaApi(payload.metrics));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitComment = async () => {
    const message = commentText.trim();
    if (!message) return;
    setIsLoading(true);
    try {
      markMetricsMutation();
      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(sourceId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          userId: user?.id,
          reportName: report.name,
          message,
          parentCommentId: replyTo ?? undefined
        })
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (payload.metrics) {
        applyMetrics(mapearMetricasDaApi(payload.metrics));
      }
      setCommentText('');
      setReplyTo(null);
      await loadComments();
    } finally {
      setIsLoading(false);
    }
  };

  const submitShare = async () => {
    if (selectedTargets.length === 0) return;
    setIsLoading(true);
    try {
      markMetricsMutation();
      const recipients = shareTargets
        .filter((target) => selectedTargets.includes(target.id))
        .map((target) => ({ userId: target.id.startsWith('mock-') ? undefined : target.id, name: target.name }));

      const response = await fetch(`${API_URL}/reports/catalog/by-source/${encodeURIComponent(sourceId)}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ userId: user?.id, reportName: report.name, recipients })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: `HTTP ${response.status}` }))) as { error?: string };
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { metrics?: MetricasApi };
      if (payload.metrics) {
        applyMetrics(mapearMetricasDaApi(payload.metrics));
      }
      setSelectedTargets([]);
      setShareSearchTerm('');
      toast({
        title: 'Relatório compartilhado',
        description: recipients.length === 1
          ? 'O relatório foi enviado e a notificacao foi criada para o destinatario.'
          : `O relatório foi enviado para ${recipients.length} destinatario(s).`
      });
    } catch (error) {
      toast({
        title: 'Falha ao compartilhar relatório',
        description: (error as Error).message || 'Não foi possível concluir o compartilhamento.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShareTarget = (targetId: string) => {
    setSelectedTargets((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const handleToggleFavorite = async () => {
    try {
      const next = await toggleFavoriteReportRemote(
        {
          report: { ...report, metrics },
          path: reportPath ?? [],
          companyId,
          userId: user?.id
        },
        user?.id
      );
      setIsFavorite(next);
    } catch (error) {
      toast({
        title: 'Não foi possível atualizar favoritos',
        description: (error as Error).message || 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const renderCommentNode = (node: CommentNode, depth = 0): React.ReactNode => (
    <div key={node.id} className={cn('space-y-2 rounded-md border p-2', depth > 0 && 'ml-4')}>
      <div className="text-xs text-muted-foreground">
        {node.actor_key} - {new Date(node.created_at).toLocaleString()}
      </div>
      <div className="text-sm">{node.message}</div>
      <button
        type="button"
        className="text-xs text-primary hover:underline"
        onClick={() => setReplyTo(node.id)}
      >
        Responder
      </button>
      {node.replies.map((reply) => renderCommentNode(reply, depth + 1))}
    </div>
  );

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          'group bg-card border border-border rounded-lg p-4 hover:shadow-card-hover transition-all duration-500',
          showHighlight && 'ring-2 ring-emerald-500/70 shadow-[0_0_0_10px_rgba(16,185,129,0.14),0_0_32px_rgba(16,185,129,0.22)]',
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <button
                onClick={openDetails}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left line-clamp-2 flex items-center gap-1"
                disabled={isLoading}
              >
                {report.name}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <p className="text-xs text-muted-foreground mt-1">{report.date} - {report.size}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-yellow-500"
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Star className={cn('w-4 h-4', isFavorite && 'fill-yellow-400 text-yellow-500')} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{report.description}</p>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button onClick={openDetails} className="group/btn flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors" disabled={isLoading}>
            <Eye className="w-4 h-4 text-muted-foreground group-hover/btn:text-green-600" />
            <span className="text-xs text-muted-foreground group-hover/btn:text-foreground">{metrics.visualizacoes}</span>
          </button>

          <button onClick={openDetails} className="group/btn flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors" disabled={isLoading}>
            <MessageCircle className="w-4 h-4 text-muted-foreground group-hover/btn:text-blue-600" />
            <span className="text-xs text-muted-foreground group-hover/btn:text-foreground">{metrics.comentarios}</span>
          </button>

          <button onClick={toggleLike} className="group/btn flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors" disabled={isLoading}>
            <Heart className={cn('w-4 h-4', likeActive ? 'text-red-600 fill-red-600' : 'text-muted-foreground group-hover/btn:text-red-600')} />
            <span className="text-xs text-muted-foreground group-hover/btn:text-foreground">{metrics.curtidas}</span>
          </button>

          <button onClick={openDetails} className="group/btn flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted transition-colors" disabled={isLoading}>
            <Share2 className="w-4 h-4 text-muted-foreground group-hover/btn:text-yellow-600" />
            <span className="text-xs text-muted-foreground group-hover/btn:text-foreground">{metrics.compartilhamentos}</span>
          </button>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle>{report.name}</DialogTitle>
                <DialogDescription>Atualizado em {report.date || 'N/A'} - {report.size || 'N/A'}</DialogDescription>
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (report.url) {
                    window.open(report.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                disabled={!report.url}
                className="shrink-0"
              >
                Abrir relatório
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{report.description}</p>
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium text-foreground">Conta atual</p>
              <p className="text-muted-foreground">
                {user?.full_name ?? 'Usuário local'} {user?.employee_id ? `- Matrícula ${user.employee_id}` : user?.email ? `- ${user.email}` : ''}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Visualizações usam a mesma metrica global para todos, com novo incremento por conta apos 2 horas.
              </p>
            </div>
            <div className="text-sm flex flex-wrap gap-4">
              <span>{formatMetricCount('visualizações', metrics.visualizacoes)}</span>
              <span>{formatMetricCount('comentários', metrics.comentarios)}</span>
              <span>{formatMetricCount('curtidas', metrics.curtidas)}</span>
              <span>{formatMetricCount('compartilhamentos', metrics.compartilhamentos)}</span>
            </div>

            <div className="space-y-2">
              <Label>Comentários</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {comments.length === 0 ? <p className="text-sm text-muted-foreground">Sem comentários ainda.</p> : comments.map((node) => renderCommentNode(node))}
              </div>
              {replyTo && <p className="text-xs text-primary">Respondendo comentário {replyTo.slice(0, 8)}...</p>}
              <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escreva um comentário" />
              <div className="flex gap-2">
                <Button onClick={submitComment} disabled={isLoading || !commentText.trim()} size="sm">Enviar</Button>
                {replyTo && (
                  <Button variant="outline" onClick={() => setReplyTo(null)} size="sm">Cancelar resposta</Button>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label>Compartilhar com outro usuário</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={shareSearchTerm}
                  onChange={(e) => setShareSearchTerm(e.target.value)}
                  placeholder="Digite o nome do usuário"
                  className="pl-9"
                />
              </div>
              {selectedTargetItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTargetItems.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => toggleShareTarget(target.id)}
                      className="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs text-foreground"
                    >
                      {target.name}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border bg-background/70 p-2">
                {suggestedTargets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário encontrado com esse nome.</p>
                ) : (
                  suggestedTargets.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => toggleShareTarget(target.id)}
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium text-foreground">{target.name}</p>
                        {target.email ? <p className="text-xs text-muted-foreground">{target.email}</p> : null}
                      </div>
                      {selectedTargets.includes(target.id) ? <Check className="h-4 w-4 text-primary" /> : null}
                    </button>
                  ))
                )}
              </div>
              <Button size="sm" onClick={submitShare} disabled={isLoading || selectedTargets.length === 0}>
                Compartilhar ({selectedTargets.length})
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReportCard;


