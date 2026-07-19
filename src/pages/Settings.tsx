import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, BookOpen, Headphones, KeyRound, Lock, Save, Shield, User } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, SmallArrowRow } from '@/components/neo/NeoReferenceUI';

const settingsTabs = [
  [User, 'Perfil', 'Informações do perfil'],
  [Shield, 'Preferências', 'Preferências da plataforma'],
  [Lock, 'Segurança', 'Segurança da conta'],
  [Bell, 'Notificações', 'Notificações e alertas'],
  [BookOpen, 'Workspace', 'Workspace padrão'],
] as const;

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState({
    name: 'João Nogueira',
    email: 'joao.nogueira@neoview.com',
    department: 'Diretoria Executiva',
    phone: '(00) 00000-0000',
    role: 'Superadmin',
    bio: '',
  });
  const [showSessions, setShowSessions] = useState(false);

  const activeTitle = settingsTabs[activeTab][2];

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
        <PageTitle title="Configurações" description="Gerencie suas informações, preferências e segurança da conta." />

        <div className="neo-surface neo-mobile-scroll mb-5 rounded-xl">
          <div className="neo-scroll-content grid grid-cols-5 text-center">
            {settingsTabs.map(([Icon, label], index) => {
              const TabIcon = Icon as typeof User;
              return (
                <button type="button" onClick={() => setActiveTab(index)} key={label as string} className={`flex min-w-[8.5rem] items-center justify-center gap-3 border-b px-4 py-5 text-sm ${index === activeTab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  <TabIcon className="h-5 w-5 shrink-0" />{label as string}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_580px]">
          <Panel title={activeTitle}>
            {activeTab === 0 ? (
              <>
                <p className="mb-8 text-sm text-muted-foreground">Atualize seus dados de identificação exibidos na plataforma.</p>
                <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
                  <button type="button" onClick={() => toast.info('Upload de foto', { description: 'Seleção de imagem simulada para a demonstração.' })} className="text-center">
                    <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full bg-emerald-600 text-4xl font-bold text-white ring-2 ring-emerald-400">JN</div>
                    <p className="mt-4 text-sm text-muted-foreground">JPG, PNG ou GIF<br />Máx. 2MB</p>
                  </button>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Nome completo" value={profile.name} onChange={(value) => setProfile((data) => ({ ...data, name: value }))} />
                    <Field label="E-mail" value={profile.email} onChange={(value) => setProfile((data) => ({ ...data, email: value }))} />
                    <Field label="Departamento" value={profile.department} onChange={(value) => setProfile((data) => ({ ...data, department: value }))} />
                    <Field label="Telefone" value={profile.phone} onChange={(value) => setProfile((data) => ({ ...data, phone: value }))} />
                    <div className="md:col-span-2"><Field label="Cargo" value={profile.role} onChange={(value) => setProfile((data) => ({ ...data, role: value }))} /></div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground">Sobre você (opcional)</label>
                      <textarea value={profile.bio} onChange={(event) => setProfile((data) => ({ ...data, bio: event.target.value.slice(0, 160) }))} className="neo-control mt-2 h-24 w-full p-4" placeholder="Conte um pouco sobre você e sua atuação na empresa." />
                      <p className="mt-1 text-right text-xs text-muted-foreground">{profile.bio.length}/160</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <SettingsTabContent tab={activeTab} />
            )}
            <div className="mt-6 flex justify-end"><button type="button" onClick={() => toast.success('Configurações salvas', { description: `${activeTitle} atualizado nesta sessão da demonstração.` })} className="neo-primary-button sm:w-auto"><Save className="h-4 w-4" /> Salvar alterações</button></div>
          </Panel>

          <aside className="space-y-4">
            <Panel title="Resumo da conta">
              {[
                ['Tipo de conta', 'Administrador'],
                ['Último acesso', 'Hoje às 11:47'],
                ['Membro desde', '19/12/2024'],
                ['Status da conta', 'Ativa'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-2 border-b border-border/60 py-3 text-sm last:border-0"><span className="text-muted-foreground">{label}</span><span className="break-words text-foreground">{value}</span></div>
              ))}
              <button type="button" onClick={() => setShowSessions((current) => !current)} className="neo-action-button mt-4 w-full justify-between">Ver sessões ativas <span>›</span></button>
              {showSessions ? (
                <div className="mt-3 rounded-xl border border-border/60 bg-white/[0.025] p-3 text-xs text-muted-foreground">
                  Sessão atual: navegador local, Bahia, validada há poucos minutos.
                </div>
              ) : null}
            </Panel>
            <Panel title="Ações rápidas">
              <SmallArrowRow onClick={() => toast.info('Alterar senha', { description: 'Fluxo demonstrativo aberto para envio de código de recuperação.' })} icon={KeyRound} title="Alterar senha" subtitle="Atualize sua senha de acesso" tone="blue" />
              <SmallArrowRow onClick={() => toast.success('2FA configurado', { description: 'Verificação em duas etapas simulada para a conta.' })} icon={Shield} title="Configurar 2FA" subtitle="Aumente a segurança da sua conta" tone="green" />
            </Panel>
            <Panel title="Precisa de ajuda?">
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => navigate('/help')} className="neo-action-button"><BookOpen className="h-4 w-4" /> Ver documentação</button>
                <button type="button" onClick={() => toast.success('Chamado aberto', { description: 'Protocolo DEMO-2043 criado para suporte.' })} className="neo-action-button"><Headphones className="h-4 w-4" /> Abrir chamado</button>
              </div>
            </Panel>
          </aside>
        </div>

        <div className="neo-surface mt-4 rounded-xl p-4 text-sm text-muted-foreground">Dica: Mantenha suas informações sempre atualizadas para garantir uma melhor experiência na plataforma.</div>
      </div>
    </div>
      <FloatingAssistant currentLevel="settings" selectedCompanyId={undefined} selectedSupId={undefined} selectedMgmtId={undefined} selectedProjId={undefined} />
    </>
  );
};

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input className="neo-control mt-2 h-12 w-full px-4" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SettingsTabContent({ tab }: { tab: number }) {
  const content = [
    null,
    ['Preferências', 'Tema do sistema, idioma, densidade de informação e empresa padrão foram carregados para edição.'],
    ['Segurança', 'Sessões ativas, MFA, expiração de token e política de senha estão disponíveis nesta área.'],
    ['Notificações', 'Alertas de aprovação, comentários, relatórios compartilhados e SLA podem ser ligados ou desligados.'],
    ['Workspace', 'Defina empresa inicial, superintendência padrão e cards preferidos do workspace executivo.'],
  ][tab];

  return (
    <div className="rounded-xl border border-border/60 bg-white/[0.025] p-5 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{content?.[0]}</p>
      <p className="mt-2 leading-relaxed">{content?.[1]}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {['Ativo', 'Sincronizado', 'Auditável', 'Aplicável ao mobile'].map((item) => (
          <label key={item} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2">
            <input type="checkbox" defaultChecked className="rounded border-border bg-transparent" />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

export default Settings;
