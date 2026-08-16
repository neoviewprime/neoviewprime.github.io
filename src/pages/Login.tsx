import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { NeoLogo } from '@/components/NeoLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [pendingIdentifier, setPendingIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || '/home';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authLoading, from, isAuthenticated, navigate]);

  const handleOpenVerification = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = identifier.trim();
    setError('');

    if (!trimmed) {
      setError('Informe um e-mail ou matrícula para continuar.');
      return;
    }

    setIsSendingCode(true);
    window.setTimeout(() => {
      setPendingIdentifier(trimmed);
      setVerificationCode('');
      setIsCodeDialogOpen(true);
      setIsSendingCode(false);
    }, 450);
  };

  const handleValidateCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!verificationCode.trim()) {
      setError('Digite qualquer código para validar a demonstração.');
      return;
    }

    setIsValidatingCode(true);
    const response = await signIn({ email: pendingIdentifier, password: verificationCode });
    if (response.error) {
      setError(response.error);
      setIsValidatingCode(false);
      return;
    }

    setIsCodeDialogOpen(false);
    navigate(from, { replace: true });
    setIsValidatingCode(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f6f8fb_0%,#eef4f8_100%)] p-4 text-foreground dark:bg-[linear-gradient(180deg,#07111d_0%,#0b1b2b_100%)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#00a443,#0da9fe,#ff9c1a)]" />
      <div className="absolute right-4 top-4 z-20">
          <ThemeToggle />
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="hidden lg:block">
          <div className="mb-8">
            <NeoLogo size="lg" />
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Ambiente demonstrativo
            </div>
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-950 dark:text-white">
            Informação confiável no momento da decisão.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Relatórios, indicadores e conhecimento corporativo em uma experiência governada, rastreável e pronta para demonstração executiva.
          </p>

          <div className="mt-10 max-w-2xl rounded-2xl border border-border/80 bg-white/80 p-5 shadow-card backdrop-blur dark:bg-white/[0.06]">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Governança', 'Fontes validadas por área'],
                ['ÍRIS', 'Busca com contexto'],
                ['Aplicativo', 'Acesso rápido no celular'],
              ].map(([title, description]) => (
                <div key={title} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-7 text-center lg:hidden">
            <NeoLogo size="lg" />
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Ambiente demonstrativo
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:p-7">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Acesso NeoView</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Bem-vindo ao NeoView</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Acesse a plataforma de inteligência corporativa.
              </p>
            </div>

            <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Modo demonstração</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Utilize qualquer identificação. Nenhum código real é enviado nesta experiência.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleOpenVerification} className="space-y-5">
              {error ? (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-foreground">
                  Identificação
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="E-mail corporativo ou matrícula"
                    className="search-input rounded-xl py-3 pl-11"
                    autoComplete="username"
                    spellCheck={false}
                    autoCapitalize="off"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSendingCode}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparando acesso...
                  </>
                ) : (
                  'Continuar'
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              Para demonstração, qualquer identificação e código podem ser utilizados.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="mx-auto mt-5 block text-sm font-medium text-primary hover:underline"
          >
            Voltar para a página inicial
          </button>
        </section>
      </main>

      <Dialog
        open={isCodeDialogOpen}
        onOpenChange={(open) => {
          setIsCodeDialogOpen(open);
          if (!open) {
            setVerificationCode('');
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-primary" />
              Digite o código de acesso
            </DialogTitle>
            <DialogDescription>
              A etapa abaixo preserva a jornada de autenticação para demonstração.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleValidateCode} className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              Para demonstração, qualquer código pode ser utilizado.
            </div>

            <div>
              <label htmlFor="verificationCode" className="mb-2 block text-sm font-medium text-foreground">
                Código de acesso
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="Digite qualquer código"
                className="search-input rounded-xl"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={isValidatingCode}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isValidatingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Acessando...
                </>
              ) : (
                'Acessar NeoView'
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
