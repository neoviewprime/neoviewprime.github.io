import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ShieldCheck, Building2, GitBranch, Briefcase, LockKeyhole, ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from '@/hooks/use-toast';
import { useUserManagement } from '@/hooks/useUserManagement';
import { COELBA_CORPORATE_SUPERINTENDENCE_NAME, isCoelbaCorporateSuperintendenceId } from '@/lib/coelbaUtd';
import type { ChatPageContext } from '@/types/backend';

type FormState = {
  fullName: string;
  email: string;
  employeeId: string;
  password: string;
  confirmPassword: string;
  companyId: string;
  superintendenceId: string;
  managementId: string;
  projectId: string;
  jobTitle: string;
  status: 'active' | 'inactive';
  phone: string;
};

const initialForm: FormState = {
  fullName: '',
  email: '',
  employeeId: '',
  password: '',
  confirmPassword: '',
  companyId: '',
  superintendenceId: '',
  managementId: '',
  projectId: '',
  jobTitle: '',
  status: 'active',
  phone: ''
};

const jobTitleLabels: Record<string, string> = {
  Estagiario: 'Estagiario',
  Analista: 'Analista',
  Especialista: 'Especialista',
  Tecnico: 'Tecnico',
  Supervisor: 'Supervisor',
  Gerente: 'Gerente',
  Gestor: 'Gestor',
  Superintendente: 'Superintendente',
  Diretor: 'Diretor'
};

const corporateEmailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const employeeIdRegex = /^[A-Za-z0-9._/-]{3,}$/;

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const UserRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { options, isLoading, error, fetchOptions, createUser } = useUserManagement();
  const [form, setForm] = useState<FormState>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    void fetchOptions();
  }, [fetchOptions]);

  const selectedCompany = useMemo(
    () => options?.companies.find((company) => company.id === form.companyId),
    [form.companyId, options?.companies]
  );
  const selectedSuperintendence = useMemo(
    () => selectedCompany?.superintendences.find((item) => item.id === form.superintendenceId),
    [form.superintendenceId, selectedCompany]
  );
  const isCorporateSuperintendence = useMemo(
    () => isCoelbaCorporateSuperintendenceId(selectedSuperintendence?.id),
    [selectedSuperintendence?.id]
  );
  const selectedManagement = useMemo(
    () => selectedSuperintendence?.managements.find((item) => item.id === form.managementId),
    [form.managementId, selectedSuperintendence]
  );
  const selectedProject = useMemo(
    () => selectedManagement?.projects.find((item) => item.id === form.projectId),
    [form.projectId, selectedManagement]
  );

  const approvalJobTitles = options?.approvalJobTitles ?? [];
  const isApprovalJob = approvalJobTitles.includes(form.jobTitle);
  const hierarchyLabel = [
    selectedCompany?.name,
    selectedSuperintendence?.name,
    selectedManagement?.name,
    selectedProject?.name
  ]
    .filter(Boolean)
    .join(' > ');

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    if (Object.keys(patch).length > 0) {
      setSuccessMessage('');
    }
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Informe o nome completo.';
    if (!corporateEmailRegex.test(form.email)) nextErrors.email = 'Informe um e-mail corporativo valido.';
    if (!employeeIdRegex.test(form.employeeId)) nextErrors.employeeId = 'Informe uma matricula valida.';
    if (form.password.trim().length < 8) nextErrors.password = 'Cadastre uma senha com no minimo 8 caracteres.';
    if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'A confirmacao da senha precisa ser igual.';
    if (!form.companyId) nextErrors.companyId = 'Empresa Neoenergia obrigatoria.';
    if (!form.superintendenceId) nextErrors.superintendenceId = 'Selecione a diretoria/superintendencia.';
    if (!isCorporateSuperintendence && !form.managementId) nextErrors.managementId = 'Selecione a gerencia.';
    if (!isCorporateSuperintendence && !form.projectId) nextErrors.projectId = 'Selecione a unidade.';
    if (!form.jobTitle) nextErrors.jobTitle = 'Selecione o cargo.';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const chatPageContext = useMemo<ChatPageContext>(() => {
    const missingFields = [
      !form.fullName && 'nome completo',
      !form.email && 'e-mail corporativo',
      !form.employeeId && 'matricula',
      !form.password && 'senha',
      !form.confirmPassword && 'confirmacao de senha',
      !form.companyId && 'empresa',
      !form.superintendenceId && 'superintendencia',
      !isCorporateSuperintendence && !form.managementId && 'gerencia',
      !isCorporateSuperintendence && !form.projectId && 'unidade',
      !form.jobTitle && 'cargo'
    ].filter(Boolean);

    const validationMessages = Object.values(fieldErrors);
    const summaryParts = [
      successMessage || 'O usuário está na tela de cadastro.',
      hierarchyLabel ? `Hierarquia selecionada: ${hierarchyLabel}.` : 'A hierarquia ainda não foi preenchida até a unidade.',
      form.jobTitle ? `Cargo atual no formulario: ${jobTitleLabels[form.jobTitle] ?? form.jobTitle}.` : 'Nenhum cargo foi selecionado ainda.',
      isApprovalJob ? 'O cargo selecionado possui alçada de aprovação.' : 'O cargo selecionado não possui alçada de aprovação.',
      missingFields.length ? `Campos obrigatorios ainda vazios: ${missingFields.join(', ')}.` : 'Todos os campos obrigatorios principais ja foram preenchidos.',
      validationMessages.length ? `Mensagens de validação visíveis: ${validationMessages.join(' ')}` : 'Não há mensagens de erro abertas neste momento.'
    ];

    return {
      page: 'register',
      title: 'Cadastro de usuários',
      summary: summaryParts.join(' '),
      hints: [
        'Explique campos obrigatorios e validacoes do proprio formulario.',
        'Se o usuário pedir resumo da tela, descreva a hierarquia, senha, telefone e status com base no estado atual.',
        'Oriente o usuário a completar empresa, superintendência, gerência, unidade e cargo antes de salvar.'
      ]
    };
  }, [fieldErrors, form, hierarchyLabel, isApprovalJob, isCorporateSuperintendence, successMessage]);

  const handleSubmit = async () => {
    if (
      !validate() ||
      !selectedCompany ||
      !selectedSuperintendence ||
      (!isCorporateSuperintendence && (!selectedManagement || !selectedProject))
    ) {
      toast({
        title: 'Cadastro inconsistente',
        description: isCorporateSuperintendence
          ? 'Revise os campos obrigatorios e a superintendencia antes de salvar.'
          : 'Revise os campos obrigatorios e a hierarquia antes de salvar.',
        variant: 'destructive'
      });
      return;
    }

    const created = await createUser({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      employeeId: form.employeeId.trim(),
      password: form.password,
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      superintendenceId: selectedSuperintendence.id,
      superintendenceName: selectedSuperintendence.name,
      managementId: isCorporateSuperintendence ? null : selectedManagement?.id,
      managementName: isCorporateSuperintendence ? null : selectedManagement?.name,
      projectId: isCorporateSuperintendence ? null : selectedProject?.id,
      projectName: isCorporateSuperintendence ? null : selectedProject?.name,
      jobTitle: form.jobTitle,
      status: form.status,
      phone: form.phone.trim() || undefined
    });

    if (!created?.id) {
      toast({
        title: 'Falha ao cadastrar',
        description: error ?? 'Não foi possível salvar o usuário com a hierarquia informada.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Usuário cadastrado',
      description: isApprovalJob
          ? 'Usuário com alçada de aprovação salvo para publicar sem fila prévia.'
          : 'Usuário salvo com a hierarquia da unidade.'
    });

    setSuccessMessage(`Conta criada com sucesso para o e-mail ${form.email.trim().toLowerCase()}.`);
    setForm(initialForm);
    setFieldErrors({});
  };

  return (
    <>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Button
              type="button"
              variant="outline"
              className="mb-4 inline-flex items-center gap-2"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold text-foreground lg:text-3xl">Cadastro de Usuários</h1>
            <p className="mt-1 text-muted-foreground">
              Conecte o usuário à empresa Neoenergia, à unidade e à cadeia de aprovação já usada no sistema.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Gestor, gerente, superintendente e diretor aprovam
          </Badge>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            { label: 'Empresa', value: selectedCompany?.name ?? 'Obrigatoria', icon: Building2 },
            { label: 'Area', value: selectedSuperintendence?.name ?? 'Diretoria/Superintendencia', icon: GitBranch },
            { label: 'Cargo', value: (jobTitleLabels[form.jobTitle] ?? form.jobTitle) || 'Selecione', icon: Briefcase },
            { label: 'Aprovação', value: isApprovalJob ? 'Pode aprovar' : 'Sem alçada', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="rounded-2xl border-border/70">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-semibold text-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {error ? (
          <Alert className="mb-6 border-destructive/40 bg-destructive/5 text-destructive">
            <AlertTitle>Integracao com cadastro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert className="mb-6 border-emerald-500/40 bg-emerald-500/5 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Cadastro concluido</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6">
          <Card className="rounded-3xl border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-5 w-5 text-primary" />
                Dados do usuário
              </CardTitle>
              <CardDescription>
                O cadastro usa a mesma hierarquia de empresa, superintendencia, gerencia e unidade ja existente no fluxo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Nome completo *</Label>
                <Input value={form.fullName} onChange={(event) => updateForm({ fullName: event.target.value })} />
                {fieldErrors.fullName ? <p className="mt-1 text-xs text-destructive">{fieldErrors.fullName}</p> : null}
              </div>

              <div>
                <Label>E-mail corporativo *</Label>
                <Input value={form.email} onChange={(event) => updateForm({ email: event.target.value })} placeholder="nome.sobrenome@neoenergia.com" />
                {fieldErrors.email ? <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p> : null}
              </div>

              <div>
                <Label>Matricula / identificador *</Label>
                <Input value={form.employeeId} onChange={(event) => updateForm({ employeeId: event.target.value })} placeholder="Coloque sua matricula U" />
                {fieldErrors.employeeId ? <p className="mt-1 text-xs text-destructive">{fieldErrors.employeeId}</p> : null}
              </div>

              <div>
                <Label>Senha de acesso *</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => updateForm({ password: event.target.value })}
                    placeholder="Minimo de 8 caracteres"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password ? <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p> : null}
              </div>

              <div>
                <Label>Confirmar senha *</Label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(event) => updateForm({ confirmPassword: event.target.value })}
                    placeholder="Digite a senha novamente"
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Ocultar confirmacao da senha' : 'Exibir confirmacao da senha'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword ? <p className="mt-1 text-xs text-destructive">{fieldErrors.confirmPassword}</p> : null}
              </div>

              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(event) => updateForm({ phone: formatPhoneNumber(event.target.value) })}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                />
              </div>

              <div>
                <Label>Status *</Label>
                <Select value={form.status} onValueChange={(value) => updateForm({ status: value as FormState['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Empresa/Unidade Neoenergia *</Label>
                <Select value={form.companyId} onValueChange={(value) => updateForm({ companyId: value, superintendenceId: '', managementId: '', projectId: '' })}>
                  <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
                  <SelectContent>
                    {(options?.companies ?? []).map((company) => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.companyId ? <p className="mt-1 text-xs text-destructive">{fieldErrors.companyId}</p> : null}
              </div>

              <div>
                <Label>Area / Diretoria / Superintendencia *</Label>
                <Select value={form.superintendenceId} onValueChange={(value) => updateForm({ superintendenceId: value, managementId: '', projectId: '' })} disabled={!selectedCompany}>
                  <SelectTrigger><SelectValue placeholder="Selecione a superintendencia" /></SelectTrigger>
                  <SelectContent>
                    {(selectedCompany?.superintendences ?? []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.superintendenceId ? <p className="mt-1 text-xs text-destructive">{fieldErrors.superintendenceId}</p> : null}
              </div>

              <div>
                <Label>Gerencia *</Label>
                <Select
                  value={form.managementId}
                  onValueChange={(value) => updateForm({ managementId: value, projectId: '' })}
                  disabled={!selectedSuperintendence || isCorporateSuperintendence}
                >
                  <SelectTrigger><SelectValue placeholder={isCorporateSuperintendence ? 'Nao se aplica' : 'Selecione a gerencia'} /></SelectTrigger>
                  <SelectContent>
                    {(selectedSuperintendence?.managements ?? []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.managementId ? <p className="mt-1 text-xs text-destructive">{fieldErrors.managementId}</p> : null}
              </div>

              <div>
                <Label>Unidade *</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(value) => updateForm({ projectId: value })}
                  disabled={!selectedManagement || isCorporateSuperintendence}
                >
                  <SelectTrigger><SelectValue placeholder={isCorporateSuperintendence ? 'Nao se aplica' : 'Selecione a unidade'} /></SelectTrigger>
                  <SelectContent>
                    {(selectedManagement?.projects ?? []).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.projectId ? <p className="mt-1 text-xs text-destructive">{fieldErrors.projectId}</p> : null}
              </div>

              {isCorporateSuperintendence ? (
                <div className="md:col-span-2 rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                  Para {COELBA_CORPORATE_SUPERINTENDENCE_NAME}, os campos de gerencia e unidade ficam desabilitados no cadastro.
                </div>
              ) : null}

              <div>
                <Label>Cargo / hierarquia *</Label>
                <Select value={form.jobTitle} onValueChange={(value) => updateForm({ jobTitle: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                  <SelectContent>
                    {(options?.jobTitles ?? []).map((jobTitle) => (
                      <SelectItem key={jobTitle} value={jobTitle}>{jobTitleLabels[jobTitle] ?? jobTitle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.jobTitle ? <p className="mt-1 text-xs text-destructive">{fieldErrors.jobTitle}</p> : null}
              </div>

              <div className="md:col-span-2">
                <Alert className="border-border/70 bg-muted/40">
                  <AlertTitle>Privacidade e LGPD</AlertTitle>
                  <AlertDescription>
                    O sistema trata apenas dados necessários para autenticação, hierarquia e aprovação. A senha é armazenada com hash seguro
                    na tabela `user_credentials`, seguindo a estrategia padrao desta branch com SQLite.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Cadastrar usuário'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FloatingAssistant variant="chat" pageContext={chatPageContext} />
    </>
  );
};

export default UserRegistration;
