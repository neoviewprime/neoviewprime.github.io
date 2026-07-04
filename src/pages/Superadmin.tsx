import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, Database, FileText, Filter, Lock, Search, Shield, Trash2, UserPlus, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ActivityRow, MetricCard, PageHeader } from '@/components/premium/PremiumShell';

const Superadmin: React.FC = () => {
  const { roles } = useAuth();
  const {
    overview,
    activities,
    reports,
    isLoading,
    error,
    fetchOverview,
    fetchActivities,
    fetchReports,
    deleteReport,
    bulkDeleteReports,
    resetData
  } = useSuperadmin();
  const [bulkCompanyId, setBulkCompanyId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [reportQuery, setReportQuery] = useState('');
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    void Promise.all([fetchOverview(), fetchActivities(), fetchReports()]);
  }, [fetchActivities, fetchOverview, fetchReports]);

  const isSuperadmin = roles.includes('superadmin');

  const filteredReports = useMemo(() => {
    const needle = reportQuery.trim().toLowerCase();
    if (!needle) return reports;
    return reports.filter((report) =>
      JSON.stringify(report).toLowerCase().includes(needle)
    );
  }, [reportQuery, reports]);

  if (!isSuperadmin) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="neo-page">
      <div className="neo-page-inner">
      <PageHeader
        icon={Shield}
        title="Gerenciamento Superadmin"
        description="Área restrita para monitorar usuários, relatórios, operações críticas e auditoria da plataforma."
        actions={
          <Badge variant="outline" className="w-fit gap-2 rounded-2xl px-4 py-2">
            <Lock className="h-3.5 w-3.5" />
            Acesso restrito aos superadmins
          </Badge>
        }
      />

      {error ? (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Usuários ativos" value={overview?.users ?? 0} helper="+0 este mês" icon={Users} tone="green" />
        <MetricCard label="Relatórios" value={overview?.reports ?? 0} helper="+18 este mês" icon={FileText} tone="blue" />
        <MetricCard label="Operações críticas" value={overview?.approvals ?? 0} helper="+2 este mês" icon={AlertTriangle} tone="amber" />
        <MetricCard label="Eventos de auditoria" value={activities.length || '1.248'} helper="+12% este mês" icon={Activity} tone="purple" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Tabs defaultValue="users" className="space-y-0 overflow-hidden rounded-[28px] border border-border/70 bg-card/80 dark:bg-white/[0.045]">
        <TabsList className="flex h-auto w-full justify-start gap-4 overflow-x-auto rounded-none border-b border-border/70 bg-transparent p-0 px-4">
          <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent px-2 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">Usuários</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-none border-b-2 border-transparent px-2 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">Relatórios</TabsTrigger>
          <TabsTrigger value="activities" className="rounded-none border-b-2 border-transparent px-2 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">Auditoria</TabsTrigger>
          <TabsTrigger value="reset" className="rounded-none border-b-2 border-transparent px-2 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">Operações</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="m-0 p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Usuários</h2>
              <p className="mt-1 text-sm text-muted-foreground">Gerencie acessos, permissões e status dos usuários da plataforma.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl"><Filter className="mr-2 h-4 w-4" />Filtros</Button>
              <Button className="rounded-2xl"><UserPlus className="mr-2 h-4 w-4" />Novo usuário</Button>
            </div>
          </div>
          <div className="relative mb-4 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="neo-control h-11 pl-10" placeholder="Buscar usuário por nome, e-mail ou função..." />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último acesso</TableHead>
                <TableHead>MFA</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['João Nogueira', 'joao.nogueira@neoview.com.br', 'Superadmin', 'Ativo', 'Hoje, 10:32'],
                ['Gabriel Nogueira', 'gabriel.nogueira@neoview.com.br', 'Superadmin', 'Ativo', 'Hoje, 09:15'],
                ['Maria Silva', 'maria.silva@neoview.com.br', 'Administrador', 'Ativo', 'Ontem, 16:45'],
                ['Carlos Lima', 'carlos.lima@neoview.com.br', 'Analista', 'Ativo', 'Ontem, 11:08'],
                ['Ana Costa', 'ana.costa@neoview.com.br', 'Visualizador', 'Inativo', 'Há 15 dias'],
              ].map(([name, email, role, status, last]) => (
                <TableRow key={email} className="neo-table-row">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">{name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
                      <div><p className="font-medium">{name}</p><p className="text-xs text-muted-foreground">{email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{role}</Badge></TableCell>
                  <TableCell><span className={status === 'Ativo' ? 'text-emerald-600' : 'text-rose-500'}>{status}</span></TableCell>
                  <TableCell>{last}</TableCell>
                  <TableCell><Shield className="h-4 w-4 text-primary" /></TableCell>
                  <TableCell>...</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="reports" className="m-0 p-5">
          <Card className="rounded-3xl border-border/70 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Gerenciamento de relatórios</CardTitle>
              <CardDescription>Exclua relatórios específicos ou em massa sem alterar a estrutura do backend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Input placeholder="Buscar relatório, empresa ou unidade" value={reportQuery} onChange={(e) => setReportQuery(e.target.value)} />
                <Input placeholder="Excluir em massa por companyId" value={bulkCompanyId} onChange={(e) => setBulkCompanyId(e.target.value)} />
                <Input placeholder="Excluir em massa por status" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  className="rounded-2xl"
                  disabled={isLoading || (!bulkCompanyId.trim() && !bulkStatus.trim())}
                  onClick={async () => {
                    const result = await bulkDeleteReports({
                      companyId: bulkCompanyId.trim() || undefined,
                      status: bulkStatus.trim() || undefined
                    });
                    if (result) {
                      toast({ title: 'Exclusão em massa concluída', description: `${result.deleted} relatórios removidos.` });
                    }
                  }}
                >
                  Exclusão em massa
                </Button>
              </div>

              {isMobile ? (
                <div className="space-y-3">
                  {filteredReports.map((report) => (
                    <div key={String(report.id)} className="rounded-[24px] border border-border/70 p-4">
                      <p className="font-medium text-foreground">{String(report.report_name ?? report.id)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{String(report.company_name ?? '')}</p>
                      <p className="mt-3 text-sm text-muted-foreground">Status: {String(report.report_status ?? '')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[report.superintendence_name, report.management_name, report.project_name].filter(Boolean).join(' > ')}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          className="rounded-2xl text-destructive"
                          onClick={async () => {
                            const deleted = await deleteReport(String(report.id));
                            if (deleted) {
                              toast({ title: 'Relatório removido', description: String(report.report_name ?? report.id) });
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Relatório</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={String(report.id)}>
                      <TableCell>
                        <p className="font-medium">{String(report.report_name ?? report.id)}</p>
                        <p className="text-xs text-muted-foreground">{String(report.company_name ?? '')}</p>
                      </TableCell>
                      <TableCell>{String(report.report_status ?? '')}</TableCell>
                      <TableCell>{[report.superintendence_name, report.management_name, report.project_name].filter(Boolean).join(' > ')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          className="text-destructive"
                          onClick={async () => {
                            const deleted = await deleteReport(String(report.id));
                            if (deleted) {
                              toast({ title: 'Relatório removido', description: String(report.report_name ?? report.id) });
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="m-0 p-5">
          <Card className="rounded-3xl border-border/70 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle>Monitoramento de atividades</CardTitle>
              <CardDescription>Visibilidade central de operações relevantes de todos os usuários.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-3">
                  {activities.map((item) => (
                    <div key={String(item.id)} className="rounded-[24px] border border-border/70 p-4">
                      <p className="font-medium text-foreground">{String(item.action ?? '')}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{String(item.entity_type ?? '')}</p>
                      <p className="mt-2 text-xs text-muted-foreground">Usuário: {String(item.user_id ?? 'sistema')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(String(item.created_at ?? '')).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Quando</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((item) => (
                    <TableRow key={String(item.id)}>
                      <TableCell>{String(item.action ?? '')}</TableCell>
                      <TableCell>{String(item.entity_type ?? '')}</TableCell>
                      <TableCell>{String(item.user_id ?? 'sistema')}</TableCell>
                      <TableCell>{new Date(String(item.created_at ?? '')).toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reset" className="m-0 p-5">
          <Card className="rounded-3xl border-destructive/30 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Reset de dados do backend
              </CardTitle>
              <CardDescription>
                Apaga somente os dados operacionais e recria o backend em estado 0 km, preservando a estrutura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Essa operação é exclusiva para `joao.paes@neoenergia.com` e `gabriel.nogueira@neoenergia.com`.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  className="rounded-2xl"
                  disabled={isLoading}
                  onClick={async () => {
                    const result = await resetData();
                    if (result) {
                      toast({ title: 'Backend resetado', description: 'Os dados foram recriados com sucesso.' });
                    }
                  }}
                >
                  Resetar dados do backend
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <aside className="space-y-6">
        <section className="neo-surface rounded-[28px] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Atividade recente</h2>
            <button className="text-sm font-medium text-primary">Ver tudo</button>
          </div>
          <div className="space-y-3">
            <ActivityRow icon={Users} title="Usuário criado" subtitle="Maria Silva foi criada" meta="Hoje" tone="green" />
            <ActivityRow icon={FileText} title="Relatório aprovado" subtitle="Relatório SLA Comercial" meta="09:47" tone="blue" />
            <ActivityRow icon={Shield} title="Permissão alterada" subtitle="Função de Carlos alterada" meta="Ontem" tone="amber" />
            <ActivityRow icon={Activity} title="Login realizado" subtitle="Gabriel realizou login" meta="Ontem" tone="purple" />
          </div>
        </section>

        <section className="neo-surface rounded-[28px] border-destructive/20 p-5">
          <h2 className="mb-1 text-lg font-semibold text-foreground">Ações críticas</h2>
          <p className="mb-4 text-sm text-muted-foreground">Ações que impactam toda a plataforma.</p>
          <div className="space-y-3">
            {['Logs de auditoria', 'Backup & Restauração', 'Configurações globais'].map((item) => (
              <button key={item} className="w-full rounded-2xl border border-border/70 bg-background/55 px-4 py-3 text-left text-sm text-foreground dark:bg-white/[0.035]">{item}</button>
            ))}
            <button className="w-full rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              Encerrar todas as sessões
            </button>
          </div>
        </section>
      </aside>
      </div>
      </div>
    </div>
  );
};

export default Superadmin;
