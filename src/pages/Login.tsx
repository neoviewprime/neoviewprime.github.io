import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react';
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

  const deliveryTarget = useMemo(() => {
    const trimmed = pendingIdentifier.trim();
    if (!trimmed) return '';
    if (trimmed.includes('@')) return trimmed.toLowerCase();
    return `${trimmed.toLowerCase()}@demo.neoview.local`;
  }, [pendingIdentifier]);

  const handleOpenVerification = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = identifier.trim();
    setError('');

    if (!trimmed) {
      setError('Informe um e-mail ou matricula para continuar.');
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
      setError('Digite qualquer codigo para validar a demonstracao.');
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        <div className="mb-6 text-center sm:mb-8">
          <div className="inline-block">
            <NeoLogo size="lg" />
          </div>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Acesse a plataforma com seu e-mail corporativo ou matricula.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-8">
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <p className="text-sm font-semibold text-foreground">Fluxo de demonstracao</p>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                <span>Use qualquer e-mail ficticio ou matricula ficticia</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Um codigo sera "enviado" para o e-mail informado</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Qualquer codigo digitado sera aceito na validacao</span>
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
                E-mail ou matricula
              </label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Ex.: diretoria@neoenergia.com ou U123456"
                  className="search-input pl-12"
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
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSendingCode ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando codigo...
                </>
              ) : (
                'Receber codigo'
              )}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-border/70 bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">Exemplos para a apresentacao</p>
            <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">
              diretoria.financeira@neoenergia.com, presidencia@coelba.demo ou U2026001.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <button onClick={() => navigate('/')} className="text-primary hover:underline">
            Voltar para a pagina inicial
          </button>
        </p>
      </div>

      <Dialog
        open={isCodeDialogOpen}
        onOpenChange={(open) => {
          setIsCodeDialogOpen(open);
          if (!open) {
            setVerificationCode('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validar codigo de acesso</DialogTitle>
            <DialogDescription>
              Enviamos um codigo de verificacao para <strong>{deliveryTarget}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleValidateCode} className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              Esta etapa e apenas demonstrativa. Digite qualquer codigo para liberar o acesso.
            </div>

            <div>
              <label htmlFor="verificationCode" className="mb-2 block text-sm font-medium text-foreground">
                Codigo recebido
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="Digite qualquer codigo"
                className="search-input"
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
                  Validando...
                </>
              ) : (
                'Entrar na plataforma'
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
