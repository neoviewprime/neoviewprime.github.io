import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, BarChart3, Calendar, CheckCircle2, Download, Eye, FileText, MessageCircle, Send, Share2, Star } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, reportRows, SmallArrowRow, StatCard, StatusPill } from '@/components/neo/NeoReferenceUI';
import { reportDetailPath, reportSlug } from '@/lib/reportRouting';

const relatedReports = [
  'Dashboard Operacional Dezembro',
  'Relatório Inadimplência Q4 2024',
  'Pesquisa Satisfação Corporativa 2024',
];

const ReportDetails: React.FC = () => {
  const navigate = useNavigate();
  const { reportId } = useParams();
  const report = useMemo(
    () => reportRows.find((item) => reportSlug(item.name) === reportId) ?? reportRows[0],
    [reportId]
  );

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
          <PageTitle
            icon={FileText}
            title={report.name}
            description={report.desc}
            actions={
              <>
                <button type="button" onClick={() => navigate('/reports')} className="neo-action-button">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button type="button" onClick={() => toast.success('Relatório compartilhado', { description: 'Link interno enviado para a área responsável.' })} className="neo-action-button">
                  <Share2 className="h-4 w-4" />
                  Compartilhar
                </button>
                <button type="button" onClick={() => toast.success('Download iniciado', { description: `${report.name} está sendo preparado.` })} className="neo-primary-button">
                  <Download className="h-4 w-4" />
                  Baixar
                </button>
              </>
            }
          />

          <div className="grid gap-4 lg:grid-cols-4">
            <StatCard icon={Eye} label="Visualizações" value={report.views} trend="+12% nos últimos 30 dias" tone="green" />
            <StatCard icon={MessageCircle} label="Comentários" value={report.comments} trend="Discussões ativas" tone="blue" />
            <StatCard icon={Calendar} label="Atualização" value={report.date} trend={report.time} tone="amber" />
            <StatCard icon={BarChart3} label="Área" value={report.area} trend="Hierarquia validada" tone="purple" />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-4">
              <Panel>
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-border/70 bg-[#071522] p-5 text-center">
                    <div className="mx-auto flex h-64 w-44 items-center justify-center rounded-lg bg-gradient-to-br from-white via-emerald-100 to-sky-200 p-4 text-sm font-bold leading-5 text-emerald-950 shadow-xl">
                      {report.name}
                    </div>
                    <StatusPill status={report.status} />
                  </div>
                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <span className="neo-chip">{report.type}</span>
                      <span className="neo-chip">{report.area}</span>
                      {report.favorite ? <span className="neo-chip border-amber-500/30 text-amber-300"><Star className="h-3.5 w-3.5 fill-current" /> Favorito</span> : null}
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Resumo executivo</h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Este relatório consolida indicadores, evidências e comentários operacionais para apoiar decisões da área {report.area}.
                      A leitura atual indica boa aderência ao fluxo de acompanhamento e pode ser usada como fonte para análises da IRIS.
                    </p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {['Indicadores revisados', 'Hierarquia conferida', 'Fontes anexadas'].map((item) => (
                        <div key={item} className="rounded-xl border border-border/70 bg-background/55 p-4 dark:bg-white/[0.025]">
                          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                          <p className="mt-2 text-sm font-medium text-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel title="Linha do tempo">
                <div className="space-y-2">
                  <SmallArrowRow icon={Eye} title="Maria Silva visualizou o relatório" subtitle={`${report.date} · ${report.time}`} tone="green" />
                  <SmallArrowRow icon={MessageCircle} title="Carlos Lima adicionou comentário" subtitle="Solicitou cruzamento com indicadores do período anterior" tone="amber" />
                  <SmallArrowRow icon={CheckCircle2} title="Ana Costa validou a hierarquia" subtitle={`${report.area} · Neoenergia Coelba`} tone="purple" />
                </div>
              </Panel>
            </main>

            <aside className="space-y-4">
              <Panel title="Ações do relatório">
                <div className="space-y-2">
                  <SmallArrowRow onClick={() => toast.success('Enviado para validação', { description: 'O relatório entrou na fila de aprovações.' })} icon={Send} title="Enviar para validação" tone="green" />
                  <SmallArrowRow onClick={() => toast.success('Favorito atualizado', { description: 'Preferência salva nesta sessão.' })} icon={Star} title={report.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} tone="amber" />
                  <SmallArrowRow onClick={() => navigate('/indicators')} icon={BarChart3} title="Analisar indicadores" subtitle="Comparar anos e metas" tone="blue" />
                </div>
              </Panel>

              <Panel title="Relacionados">
                <div className="space-y-2">
                  {relatedReports.map((name) => (
                    <SmallArrowRow key={name} onClick={() => navigate(reportDetailPath(name))} icon={FileText} title={name} subtitle="Abrir detalhe" tone="green" />
                  ))}
                </div>
              </Panel>
            </aside>
          </div>
        </div>
      </div>
      <FloatingAssistant currentLevel="reports" selectedCompanyId="coelba" selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

export default ReportDetails;
