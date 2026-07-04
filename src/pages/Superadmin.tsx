import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, Database, Eye, Shield, Trash2, Users, Activity } from 'lucide-react';
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
    <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-border/70 bg-card/70 p-4 shadow-sm sm:mb-8 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Gerenciamento Superadmin</h1>
          <p className="mt-1 text-muted-foreground">
            Área restrita para João Paes e Gabriel Nogueira monitorarem usuários, dados e operações críticas.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-2">
          <Shield className="h-3.5 w-3.5" />
          Acesso restrito aos dois superadmins
        </Badge>
      </div>

      {error ? (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
        {[
          { label: 'Usuários', value: overview?.users ?? 0, icon: Users },
          { label: 'Relatórios', value: overview?.reports ?? 0, icon: Database },
          { label: 'Aprovações', value: overview?.approvals ?? 0, icon: Shield },
          { label: 'Atividades', value: activities.length, icon: Activity },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="rounded-3xl">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{item.value}</p>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="flex h-auto w-full flex-nowrap gap-2 overflow-x-auto rounded-2xl bg-muted/60 p-1">
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="reset">Reset</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <Card className="rounded-3xl">
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

        <TabsContent value="activities">
          <Card className="rounded-3xl">
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

        <TabsContent value="reset">
          <Card className="rounded-3xl border-destructive/30">
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
    </div>
  );
};

export default Superadmin;
