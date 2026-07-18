import React from 'react';
import { Bell, BookOpen, Headphones, KeyRound, Lock, Save, Shield, User } from 'lucide-react';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { PageTitle, Panel, SmallArrowRow } from '@/components/neo/NeoReferenceUI';

const Settings: React.FC = () => (
  <>
    <div className="neo-page">
      <div className="neo-page-inner">
        <PageTitle title="Configurações" description="Gerencie suas informações, preferências e segurança da conta." />

        <div className="neo-surface neo-mobile-scroll mb-5 rounded-xl">
          <div className="neo-scroll-content grid grid-cols-5 text-center">
            {[
              [User, 'Perfil'],
              [Shield, 'Preferências'],
              [Lock, 'Segurança'],
              [Bell, 'Notificações'],
              [BookOpen, 'Workspace'],
            ].map(([Icon, label], index) => {
              const TabIcon = Icon as typeof User;
              return (
                <button key={label as string} className={`flex min-w-[8.5rem] items-center justify-center gap-3 border-b px-4 py-5 text-sm ${index === 0 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  <TabIcon className="h-5 w-5 shrink-0" />{label as string}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_580px]">
          <Panel title="Informações do perfil">
            <p className="mb-8 text-sm text-muted-foreground">Atualize seus dados de identificação exibidos na plataforma.</p>
            <div className="grid gap-8 lg:grid-cols-[190px_1fr]">
              <div className="text-center">
                <div className="relative mx-auto grid h-28 w-28 place-items-center rounded-full bg-emerald-600 text-4xl font-bold text-white ring-2 ring-emerald-400">JN</div>
                <p className="mt-4 text-sm text-muted-foreground">JPG, PNG ou GIF<br />Máx. 2MB</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nome completo" value="João Nogueira" />
                <Field label="E-mail" value="joao.nogueira@neoview.com" />
                <Field label="Departamento" value="Diretoria Executiva" />
                <Field label="Telefone" value="(00) 00000-0000" />
                <div className="md:col-span-2"><Field label="Cargo" value="Superadmin" /></div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Sobre você (opcional)</label>
                  <textarea className="neo-control mt-2 h-24 w-full p-4" placeholder="Conte um pouco sobre você e sua atuação na empresa." />
                  <p className="mt-1 text-right text-xs text-muted-foreground">0/160</p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end"><button className="neo-primary-button sm:w-auto"><Save className="h-4 w-4" /> Salvar alterações</button></div>
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
              <button className="neo-action-button mt-4 w-full justify-between">Ver sessões ativas <span>›</span></button>
            </Panel>
            <Panel title="Ações rápidas">
              <SmallArrowRow icon={KeyRound} title="Alterar senha" subtitle="Atualize sua senha de acesso" tone="blue" />
              <SmallArrowRow icon={Shield} title="Configurar 2FA" subtitle="Aumente a segurança da sua conta" tone="green" />
            </Panel>
            <Panel title="Precisa de ajuda?">
              <div className="grid gap-3 sm:grid-cols-2">
                <button className="neo-action-button"><BookOpen className="h-4 w-4" /> Ver documentação</button>
                <button className="neo-action-button"><Headphones className="h-4 w-4" /> Abrir chamado</button>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input className="neo-control mt-2 h-12 w-full px-4" defaultValue={value} />
    </label>
  );
}

export default Settings;
