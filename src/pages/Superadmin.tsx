import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, AlertTriangle, FileText, Lock, Search, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, PageTitle, Panel, SearchControl, SmallArrowRow, StatCard } from '@/components/neo/NeoReferenceUI';

const users = [
  ['JN', 'João Nogueira', 'joao.nogueira@neoview.com.br', 'Superadmin', 'Ativo', 'Hoje, 10:32'],
  ['GN', 'Gabriel Nogueira', 'gabriel.nogueira@neoview.com.br', 'Superadmin', 'Ativo', 'Hoje, 09:15'],
  ['MC', 'Maria Silva', 'maria.silva@neoview.com.br', 'Administrador', 'Ativo', 'Ontem, 16:45'],
  ['CP', 'Carlos Lima', 'carlos.lima@neoview.com.br', 'Analista', 'Ativo', 'Ontem, 11:08'],
  ['AF', 'Ana Costa', 'ana.costa@neoview.com.br', 'Visualizador', 'Inativo', 'Há 15 dias'],
];

const Superadmin: React.FC = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isSuperadmin = roles.includes('superadmin');
  const [activeTab, setActiveTab] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) => user.join(' ').toLowerCase().includes(normalized));
  }, [query]);

  if (!isSuperadmin) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="neo-page">
      <div className="neo-page-inner">
        <PageTitle
          icon={Shield}
          title="Gerenciamento Superadmin"
          description="Área restrita para João Nogueira e Gabriel Nogueira monitorarem usuários, relatórios, operações e auditoria."
          actions={<button type="button" onClick={() => toast.info('Acesso validado', { description: 'Sessão com papel superadmin ativa para a demonstração.' })} className="neo-action-button"><Lock className="h-4 w-4" /> Acesso restrito aos dois superadmins</button>}
        />

        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_320px]">
          <StatCard icon={Users} label="Usuários ativos" value="4" helper="+0 este mês" tone="green" />
          <StatCard icon={FileText} label="Relatórios" value="128" helper="+18 este mês" tone="blue" />
          <StatCard icon={AlertTriangle} label="Operações críticas" value="6" helper="+2 este mês" tone="amber" />
          <StatCard icon={Activity} label="Eventos de auditoria" value="1.248" helper="+12% este mês" tone="purple" />
          <Panel title="Atividade recente" action={<button type="button" onClick={() => setActiveTab(2)} className="text-sm font-medium text-emerald-400">Ver tudo</button>}>
            <SmallArrowRow onClick={() => setActiveTab(0)} icon={UserPlus} title="Usuário criado" subtitle="Maria Silva foi criada por João Nogueira" tone="green" />
            <SmallArrowRow onClick={() => setActiveTab(1)} icon={FileText} title="Relatório aprovado" subtitle="Relatório SLA Comercial Q4 2024.pdf" tone="blue" />
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <Panel>
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="neo-mobile-scroll -mx-1 px-1">
                <div className="neo-scroll-content flex gap-6 text-sm sm:gap-8">
                  {['Usuários', 'Relatórios', 'Auditoria', 'Operações'].map((tab, index) => (
                    <button type="button" onClick={() => setActiveTab(index)} key={tab} className={index === activeTab ? 'border-b-2 border-primary pb-3 text-primary' : 'pb-3 text-muted-foreground'}>{tab}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setFiltersOpen((current) => !current)} className={`neo-action-button ${filtersOpen ? 'border-primary/50 bg-primary/10 text-primary' : ''}`}><Search className="h-4 w-4" /> Filtros</button>
                <button type="button" onClick={() => navigate('/users/new')} className="neo-primary-button"><UserPlus className="h-4 w-4" /> Novo usuário</button>
              </div>
            </div>
            {filtersOpen ? (
              <div className="mb-4 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-foreground">Filtros administrativos</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="neo-chip border-primary/30 bg-primary/10 text-primary">{['Usuários', 'Relatórios', 'Auditoria', 'Operações'][activeTab]}</span>
                  <span className="neo-chip">Ativos primeiro</span>
                  <span className="neo-chip">MFA habilitado</span>
                </div>
              </div>
            ) : null}
            <h2 className="text-2xl font-semibold text-foreground">{['Usuários', 'Relatórios', 'Auditoria', 'Operações'][activeTab]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Gerencie acessos, permissões e status dos usuários da plataforma.</p>
            <div className="my-5 max-w-xl"><SearchControl placeholder="Buscar usuário por nome, e-mail ou função..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            <div className="neo-mobile-scroll rounded-xl border border-border/70">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/[0.035] text-muted-foreground">
                  <tr><th className="px-4 py-3">Usuário</th><th className="px-4 py-3">Função</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Último acesso</th><th className="px-4 py-3">MFA</th><th className="px-4 py-3">Ações</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.map(([initials, name, email, role, status, access], index) => (
                    <tr key={email} className="neo-table-row border-b">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar initials={initials} tone={index < 2 ? 'green' : 'slate'} /><div><p className="font-medium text-foreground">{name}</p><p className="text-xs text-muted-foreground">{email}</p></div></div></td>
                      <td className="px-4 py-3"><span className="neo-chip border-0 bg-emerald-500/14 text-emerald-300">{role}</span></td>
                      <td className="px-4 py-3"><span className={status === 'Ativo' ? 'text-emerald-300' : 'text-red-300'}>● {status}</span></td>
                      <td className="px-4 py-3 text-muted-foreground">{access}</td>
                      <td className="px-4 py-3 text-emerald-300">♢</td>
                      <td className="px-4 py-3"><button type="button" onClick={() => toast.info('Ações do usuário', { description: `${name}: editar função, redefinir MFA, bloquear ou auditar acessos.` })} className="text-muted-foreground hover:text-primary">•••</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">Mostrando {filteredUsers.length} de {users.length} usuários</div>
          </Panel>

          <aside className="space-y-4">
            <Panel title="Ações críticas">
              <SmallArrowRow onClick={() => setActiveTab(2)} icon={FileText} title="Logs de auditoria" tone="blue" />
              <SmallArrowRow onClick={() => toast.success('Backup iniciado', { description: 'Rotina de backup demonstrativa foi colocada na fila.' })} icon={Lock} title="Backup & Restauração" tone="amber" />
              <SmallArrowRow onClick={() => setActiveTab(3)} icon={Shield} title="Configurações globais" tone="purple" />
              <button type="button" onClick={() => window.confirm('Encerrar todas as sessões da demonstração?') && toast.success('Sessões encerradas', { description: 'Todas as sessões simuladas foram invalidadas.' })} className="neo-action-button mt-3 w-full border-red-500/40 text-red-300"><Trash2 className="h-4 w-4" /> Encerrar todas as sessões</button>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Superadmin;
