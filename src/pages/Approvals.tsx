import React, { useEffect, useMemo, useState } from 'react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  CheckCircle,
  Clock3,
  ShieldCheck,
  Eye,
  FileText,
  History,
  MapPinned,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApprovals } from '@/hooks/useApprovals';
import { useAuth } from '@/hooks/useAuth';
import type { ChatPageContext } from '@/types/backend';
import { useApprovalDelegations } from '@/hooks/useApprovalDelegations';
import { useUserManagement } from '@/hooks/useUserManagement';

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Approvals: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegationNotes, setDelegationNotes] = useState('');
  const [delegationValidUntil, setDelegationValidUntil] = useState('');
  const { user } = useAuth();

  const {
    pendingApprovals,
    approvalHistory,
    stats,
    isLoading,
    error,
    fetchPendingApprovals,
    fetchApprovalHistory,
    fetchStats,
    approveReport,
    rejectReport,
  } = useApprovals();
  const {
    outgoing,
    incoming,
    isLoading: isDelegationLoading,
    error: delegationError,
    refresh: refreshDelegations,
    createDelegation,
    revokeDelegation,
  } = useApprovalDelegations();
  const { users, fetchUsers } = useUserManagement();

  useEffect(() => {
    fetchPendingApprovals(user?.id);
    fetchApprovalHistory(undefined, user?.id);
    fetchStats(user?.id);
  }, [fetchApprovalHistory, fetchPendingApprovals, fetchStats, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    refreshDelegations().catch(() => undefined);
    if (!user.company_id) return;
    fetchUsers({
      companyId: user.company_id,
      superintendenceId: user.superintendence_id,
      managementId: user.management_id,
      projectId: user.project_id,
      activeOnly: true,
    }).catch(() => undefined);
  }, [fetchUsers, refreshDelegations, user?.company_id, user?.id, user?.management_id, user?.project_id, user?.superintendence_id]);

  const selectedPending = useMemo(
    () => pendingApprovals.find((report) => report.id === selectedReport) ?? null,
    [pendingApprovals, selectedReport]
  );

  const delegationCandidates = useMemo(
    () => users.filter((candidate) => candidate.id !== user?.id && candidate.status !== 'inactive').sort((left, right) => left.full_name.localeCompare(right.full_name)),
    [user?.id, users]
  );

  const chatPageContext = useMemo<ChatPageContext>(() => {
    const nextReports = pendingApprovals.slice(0, 3).map((report) => report.name);
    const summaryParts = [
      `O usuário está na central de validações.`,
      `Existem ${stats.pending} pendência(s), ${stats.approved_today} aprovação(ões) hoje e ${stats.rejected_today} rejeição(ões) hoje.`,
      nextReports.length
        ? `Primeiros relatórios aguardando decisão: ${nextReports.join(', ')}.`
        : 'Não há relatórios pendentes na fila agora.',
      selectedPending
        ? `O relatório selecionado para contexto imediato é ${selectedPending.name}, com destino ${selectedPending.destination_path.join(' > ')}.`
        : 'Nenhum relatório específico está selecionado neste momento.',
      incoming.length
        ? `Há ${incoming.length} delegação(ões) recebida(s) ativa(s) ou históricas.`
        : 'Não há delegações recebidas neste momento.',
      showRejectDialog
        ? `O diálogo de rejeição está aberto${rejectComment.trim() ? ' e já existe um comentário preenchido' : ' e o comentário ainda está vazio'}.`
        : 'O diálogo de rejeição está fechado.',
      approvalHistory.length
        ? `Há ${approvalHistory.length} item(ns) no histórico de decisões carregado(s).`
        : 'O histórico de decisões veio vazio.'
    ];

    return {
      page: 'approvals',
      title: 'Validações',
      summary: summaryParts.join(' '),
      hints: [
        'Resuma a fila com base nos dados carregados e diga o que exige ação agora.',
        'Explique aprovar, rejeitar, destino automático e histórico usando o estado real da tela.',
        'Se o usuário pedir ajuda, destaque pendências, delegações ativas e o fluxo da unidade dele.'
      ]
    };
  }, [approvalHistory.length, incoming.length, pendingApprovals, rejectComment, selectedPending, showRejectDialog, stats]);

  const handleApprove = async (reportId: string) => {
    if (!user?.id) return;
    await approveReport({
      reportId,
      approverId: user.id,
      approverName: user?.full_name ?? 'Gestor NeoView',
      comments: 'Relatório aprovado para publicação no destino informado.',
    });
  };

  const handleReject = async () => {
    if (!selectedReport || !rejectComment.trim() || !user?.id) return;

    const success = await rejectReport({
      reportId: selectedReport,
      approverId: user.id,
      approverName: user?.full_name ?? 'Gestor NeoView',
      comments: rejectComment,
    });

    if (success) {
      setShowRejectDialog(false);
      setRejectComment('');
      setSelectedReport(null);
    }
  };

  const handleCreateDelegation = async () => {
    if (!delegateUserId || !delegationValidUntil) return;
    const success = await createDelegation({
      delegateUserId,
      validUntil: new Date(delegationValidUntil).toISOString(),
      notes: delegationNotes.trim() || undefined,
    });
    if (success) {
      setDelegateUserId('');
      setDelegationNotes('');
      setDelegationValidUntil('');
    }
  };

  const handleRevokeDelegation = async (delegationId: string) => {
    await revokeDelegation(delegationId);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/70 p-4 shadow-sm sm:mb-8 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Validações</h1>
            <p className="mt-1 text-muted-foreground">
              Central do gestor para aprovar, rejeitar, delegar temporariamente e rastrear onde cada relatório será publicado.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-2">
            <History className="h-3.5 w-3.5" />
            Histórico persistido no schema
          </Badge>
        </div>

        {error ? (
          <Card className="mb-6 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
          {[
            {
              label: 'Pendentes',
              value: stats.pending,
              helper: 'Aguardando decisão',
              icon: Clock3,
              tone: 'bg-amber-500/10 text-amber-600',
            },
            {
              label: 'Aprovados hoje',
              value: stats.approved_today,
              helper: 'Liberados para publicação',
              icon: CheckCircle,
              tone: 'bg-emerald-500/10 text-emerald-600',
            },
            {
              label: 'Rejeitados hoje',
              value: stats.rejected_today,
              helper: 'Devolvidos com comentário',
              icon: XCircle,
              tone: 'bg-rose-500/10 text-rose-600',
            },
            {
              label: 'Tempo médio',
              value: `${stats.avg_approval_time_hours}h`,
              helper: 'Entre submissão e decisão',
              icon: History,
              tone: 'bg-sky-500/10 text-sky-600',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="rounded-3xl border-border/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{item.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{item.helper}</p>
                    </div>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Card className="rounded-3xl border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Fila pendente</CardTitle>
                <CardDescription>
                  O gestor ou delegado decide e o relatório passa automaticamente a ficar disponível na hierarquia de destino.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
                    ))}
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                    <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-foreground">Fila vazia</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Não há relatórios pendentes. As próximas submissões aparecerão aqui automaticamente.
                    </p>
                  </div>
                ) : (
                  pendingApprovals.map((report) => (
                    <div key={report.id} className="rounded-[26px] border border-border/70 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                              <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10">
                                Pendente
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>Indicador: {report.indicator_name}</span>
                              <span>Enviado por: {report.submitter_name}</span>
                              {report.approver_name ? <span>Aprovador: {report.approver_name}</span> : null}
                              {report.delegated_by_name ? <span>Delegado por: {report.delegated_by_name}</span> : null}
                              <span>{formatDate(report.uploaded_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {report.report_url ? (
                            <Button variant="outline" size="sm" className="rounded-2xl" asChild>
                              <a href={report.report_url} target="_blank" rel="noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                Visualizar
                              </a>
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-2xl text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedReport(report.id);
                              setShowRejectDialog(true);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeitar
                          </Button>
                          <Button size="sm" className="rounded-2xl bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(report.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovar
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <MapPinned className="h-4 w-4 text-primary" />
                          Destino automático após aprovação
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {report.destination_path.join(' > ')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Delegações de aprovação</CardTitle>
                <CardDescription>
                  Aprovadores podem delegar temporariamente a decisão para usuários da mesma alçada. O sistema valida prazo, escopo e revogação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {delegationError ? <p className="text-sm text-destructive">{delegationError}</p> : null}

                {user?.can_approve ? (
                  <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Nova delegação
                    </div>
                    <select
                      value={delegateUserId}
                      onChange={(event) => setDelegateUserId(event.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Selecione um usuário da mesma alçada</option>
                      {delegationCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.full_name} {candidate.job_title ? `- ${candidate.job_title}` : ''}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="datetime-local"
                      value={delegationValidUntil}
                      onChange={(event) => setDelegationValidUntil(event.target.value)}
                    />
                    <Textarea
                      value={delegationNotes}
                      onChange={(event) => setDelegationNotes(event.target.value)}
                      placeholder="Observação opcional sobre a delegação"
                      rows={3}
                    />
                    <Button className="rounded-2xl" onClick={handleCreateDelegation} disabled={!delegateUserId || !delegationValidUntil || isDelegationLoading}>
                      Delegar aprovação
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Seu usuário não é um aprovador nato, mas pode receber delegações ativas abaixo.
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Delegações recebidas</p>
                    <p className="text-xs text-muted-foreground">Quando ativas, elas liberam a fila de aprovação no seu usuário.</p>
                  </div>
                  {incoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma delegação recebida.</p>
                  ) : (
                    incoming.map((delegation) => (
                      <div key={delegation.id} className="rounded-2xl border border-border/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{delegation.delegator_name ?? 'Aprovador'}</p>
                            <p className="text-xs text-muted-foreground">
                              Válida até {formatDate(delegation.valid_until)}
                            </p>
                          </div>
                          <Badge className={delegation.is_active ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10' : 'bg-muted text-muted-foreground'}>
                            {delegation.is_active ? 'Ativa' : 'Encerrada'}
                          </Badge>
                        </div>
                        {delegation.notes ? <p className="mt-2 text-sm text-muted-foreground">{delegation.notes}</p> : null}
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Delegações criadas por você</p>
                    <p className="text-xs text-muted-foreground">Você pode revogar quando quiser.</p>
                  </div>
                  {outgoing.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma delegação criada.</p>
                  ) : (
                    outgoing.map((delegation) => (
                      <div key={delegation.id} className="rounded-2xl border border-border/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">{delegation.delegate_name ?? 'Usuário delegado'}</p>
                            <p className="text-xs text-muted-foreground">
                              Válida até {formatDate(delegation.valid_until)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={delegation.is_active ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10' : 'bg-muted text-muted-foreground'}>
                              {delegation.is_active ? 'Ativa' : 'Encerrada'}
                            </Badge>
                            {delegation.is_active ? (
                              <Button variant="outline" size="sm" className="rounded-2xl" onClick={() => handleRevokeDelegation(delegation.id)}>
                                Revogar
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {delegation.notes ? <p className="mt-2 text-sm text-muted-foreground">{delegation.notes}</p> : null}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Últimas decisões</CardTitle>
                <CardDescription>
                  Histórico gravado no schema toda vez que você aprova ou rejeita um relatório.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {approvalHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma decisão registrada ainda.</p>
                ) : (
                  approvalHistory.slice(0, 8).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-border/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{item.report_name ?? item.report_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.submitter_name ?? 'Analista NeoView'} • {formatDate(item.approved_at ?? item.created_at)}
                          </p>
                        </div>
                        <Badge
                          className={
                            item.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10'
                              : 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/10'
                          }
                        >
                          {item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </Badge>
                      </div>
                      {item.destination_path?.length ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Destino: {item.destination_path.join(' > ')}
                        </p>
                      ) : null}
                      {item.comments ? (
                        <p className="mt-2 text-sm text-muted-foreground">{item.comments}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar relatório</DialogTitle>
            <DialogDescription>
              O autor receberá esse contexto para corrigir o envio antes de uma nova submissão.
            </DialogDescription>
          </DialogHeader>

          {selectedPending ? (
            <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{selectedPending.name}</p>
              <p className="mt-1">Destino previsto: {selectedPending.destination_path.join(' > ')}</p>
            </div>
          ) : null}

          <Textarea
            placeholder="Descreva o motivo da rejeição..."
            value={rejectComment}
            onChange={(event) => setRejectComment(event.target.value)}
            rows={5}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectComment.trim()}>
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FloatingAssistant variant="chat" pageContext={chatPageContext} />
    </>
  );
};

export default Approvals;
