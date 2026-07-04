import React, { useEffect, useMemo, useState } from 'react';
import { Bell, BookOpen, Building2, Headphones, KeyRound, Lock, Save, Shield, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useUserManagement } from '@/hooks/useUserManagement';
import { toast } from '@/hooks/use-toast';
import { getUserPreferences, updateUserPreferences } from '@/lib/userPreferencesApi';
import { ActivityRow, PageHeader, PremiumPanel } from '@/components/premium/PremiumShell';

const normalizeThemeValue = (value?: string | null): 'light' | 'dark' | 'system' =>
  value === 'dark' || value === 'system' ? value : 'light';

const Settings: React.FC = () => {
  const { user, roles, updateProfile } = useAuth();
  const { updatePassword, isLoading } = useUserManagement();
  const { theme, setTheme } = useTheme();
  const isSuperadmin = roles.includes('superadmin');

  const [profile, setProfile] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
    department: user?.department ?? '',
    phone: user?.phone ?? ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'pt-BR' as 'pt-BR' | 'en-US' | 'es-ES',
    notifications_enabled: true,
    email_notifications: true
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const passwordHint = useMemo(() => {
    if (!isSuperadmin) return 'Use sua senha atual para definir uma nova senha de acesso.';
    return 'Superusuários recebem a senha inicial neoview2026 e podem alterá-la aqui a qualquer momento.';
  }, [isSuperadmin]);

  useEffect(() => {
    setProfile({
      full_name: user?.full_name ?? '',
      email: user?.email ?? '',
      department: user?.department ?? '',
      phone: user?.phone ?? ''
    });
  }, [user?.department, user?.email, user?.full_name, user?.phone]);

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      try {
        const payload = await getUserPreferences();
        if (cancelled) return;
        setPreferences((current) => ({
          ...current,
          theme: normalizeThemeValue(theme),
          language: payload.language,
          notifications_enabled: payload.notifications_enabled,
          email_notifications: payload.email_notifications
        }));
      } catch {
        // keep defaults when preferences are not available yet
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [theme]);

  useEffect(() => {
    const nextTheme = normalizeThemeValue(theme);
    setPreferences((current) => (current.theme === nextTheme ? current : { ...current, theme: nextTheme }));
  }, [theme]);

  const handleSaveProfile = async () => {
    const result = await updateProfile({
      full_name: profile.full_name,
      department: profile.department,
      phone: profile.phone
    });

    if (!result.success) {
      toast({
        title: 'Não foi possível salvar o perfil',
        description: result.error ?? 'Tente novamente.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Perfil atualizado',
      description: 'As informações de perfil foram salvas com sucesso.'
    });
  };

  const handleSavePreferences = async () => {
    try {
      const saved = await updateUserPreferences(preferences);
      setPreferences({
        theme: saved.theme,
        language: saved.language,
        notifications_enabled: saved.notifications_enabled,
        email_notifications: saved.email_notifications
      });
      toast({
        title: 'Preferências atualizadas',
        description: 'As preferências foram salvas no backend com sucesso.'
      });
    } catch (error) {
      toast({
        title: 'Não foi possível salvar as preferências',
        description: (error as Error).message || 'Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha a senha atual, a nova senha e a confirmação.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Nova senha inválida',
        description: 'A nova senha precisa ter pelo menos 8 caracteres.',
        variant: 'destructive'
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Confirmação diferente',
        description: 'A confirmação da nova senha precisa ser igual.',
        variant: 'destructive'
      });
      return;
    }

    const success = await updatePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });

    if (!success) {
      toast({
        title: 'Não foi possível alterar a senha',
        description: 'Verifique a senha atual e tente novamente.',
        variant: 'destructive'
      });
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast({
      title: 'Senha atualizada',
      description: 'A nova senha já está valendo para os próximos acessos.'
    });
  };

  return (
    <>
      <div className="neo-page">
        <div className="neo-page-inner">
        <PageHeader
          icon={User}
          title="Configurações"
          description="Gerencie suas informações, preferências, segurança e workspace da conta."
        />

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="neo-surface flex h-auto w-full flex-nowrap justify-between gap-2 overflow-x-auto rounded-[24px] p-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-2">
              <Bell className="h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <KeyRound className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-2">
              <Building2 className="h-4 w-4" />
              Workspace
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="rounded-[28px]">
              <CardHeader>
                <CardTitle>Informações do perfil</CardTitle>
                <CardDescription>Atualize seus dados de identificação exibidos na plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex flex-col items-center justify-start gap-3 rounded-[24px] border border-border/70 bg-background/50 p-5 text-center dark:bg-white/[0.035]">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 text-3xl font-semibold text-primary ring-2 ring-primary/30">
                    {(profile.full_name || 'JN').split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou GIF<br />Máx. 2MB</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input id="full_name" value={profile.full_name} onChange={(event) => setProfile((current) => ({ ...current, full_name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" value={profile.department} onChange={(event) => setProfile((current) => ({ ...current, department: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="job_title">Cargo</Label>
                  <Input id="job_title" value={user?.job_title ?? (isSuperadmin ? 'Superadmin' : '')} readOnly />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Sobre você (opcional)</Label>
                  <textarea id="bio" className="neo-control min-h-[88px] w-full rounded-2xl px-3 py-2 text-sm" placeholder="Conte um pouco sobre você e sua atuação na empresa." maxLength={160} />
                </div>
                <div className="flex justify-end md:col-span-2">
                  <Button onClick={handleSaveProfile} className="h-11 gap-2 rounded-2xl">
                    <Save className="h-4 w-4" />
                    Salvar alterações
                  </Button>
                </div>
                </div>
              </CardContent>
            </Card>
            <aside className="space-y-6">
              <PremiumPanel title="Resumo da conta" description="Informações gerais sobre sua conta e permissões.">
                <div className="space-y-3 text-sm">
                  <p>Tipo de conta <span className="float-right rounded-full bg-primary/15 px-2 py-0.5 text-primary">{isSuperadmin ? 'Administrador' : 'Usuário'}</span></p>
                  <p>Último acesso <span className="float-right text-foreground">Hoje às 11:47</span></p>
                  <p>Membro desde <span className="float-right text-foreground">{user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '19/12/2024'}</span></p>
                  <p>Status da conta <span className="float-right text-emerald-600">Ativa</span></p>
                </div>
              </PremiumPanel>
              <PremiumPanel title="Ações rápidas" description="Gerencie aspectos importantes da sua conta.">
                <div className="space-y-3">
                  <ActivityRow icon={Lock} title="Alterar senha" subtitle="Atualize sua senha de acesso" tone="blue" />
                  <ActivityRow icon={Shield} title="Configurar 2FA" subtitle="Aumente a segurança da sua conta" tone="green" />
                </div>
              </PremiumPanel>
              <PremiumPanel title="Precisa de ajuda?">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <Button variant="outline" className="rounded-2xl"><BookOpen className="mr-2 h-4 w-4" />Ver documentação</Button>
                  <Button variant="outline" className="rounded-2xl"><Headphones className="mr-2 h-4 w-4" />Abrir chamado</Button>
                </div>
              </PremiumPanel>
            </aside>
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>Preferências de uso</CardTitle>
                <CardDescription>Controle idioma, tema e avisos da plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select
                      value={preferences.theme}
                      onValueChange={(value) => {
                        const nextTheme = value as 'light' | 'dark' | 'system';
                        setPreferences((current) => ({
                          ...current,
                          theme: nextTheme
                        }));
                        setTheme(nextTheme);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) =>
                        setPreferences((current) => ({
                          ...current,
                          language: value as 'pt-BR' | 'en-US' | 'es-ES'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">Notificações na plataforma</p>
                      <p className="text-sm text-muted-foreground">Receba avisos sobre status, aprovações e interações.</p>
                    </div>
                    <Switch checked={preferences.notifications_enabled} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, notifications_enabled: checked }))} />
                  </div>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">Notificações por e-mail</p>
                      <p className="text-sm text-muted-foreground">Receba atualizações importantes no e-mail cadastrado.</p>
                    </div>
                    <Switch checked={preferences.email_notifications} onCheckedChange={(checked) => setPreferences((current) => ({ ...current, email_notifications: checked }))} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePreferences} className="h-11 gap-2 rounded-2xl">
                    <Save className="h-4 w-4" />
                    Salvar preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Segurança de acesso
                </CardTitle>
                <CardDescription>{passwordHint}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSuperadmin ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                    A senha inicial configurada para superusuários é <span className="font-semibold text-foreground">neoview2026</span>.
                    Após a primeira troca, a nova senha passa a valer sem sobrescrever acessos já personalizados.
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha atual</Label>
                    <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={isLoading} className="h-11 gap-2 rounded-2xl">
                    <KeyRound className="h-4 w-4" />
                    {isLoading ? 'Atualizando...' : 'Alterar senha'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <PremiumPanel title="Notificações" description="Controle quais alertas aparecem na plataforma e por e-mail.">
              <div className="space-y-4">
                {['Aprovações e rejeições', 'Compartilhamentos', 'Comentários em relatórios', 'Resumo semanal'].map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/50 p-4 dark:bg-white/[0.035]">
                    <div>
                      <p className="font-medium text-foreground">{item}</p>
                      <p className="text-sm text-muted-foreground">Receber alertas relacionados a {item.toLowerCase()}.</p>
                    </div>
                    <Switch checked />
                  </div>
                ))}
              </div>
            </PremiumPanel>
          </TabsContent>

          <TabsContent value="workspace">
            <PremiumPanel title="Workspace" description="Preferências da experiência executiva e empresa padrão.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Empresa padrão</Label>
                  <Input value={user?.company_name ?? 'Neoenergia Coelba'} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Visão inicial</Label>
                  <Input value="Meu Workspace" readOnly />
                </div>
              </div>
            </PremiumPanel>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      <FloatingAssistant variant="chat" />
    </>
  );
};

export default Settings;
