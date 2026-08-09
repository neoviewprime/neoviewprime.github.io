import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoLogo } from '@/components/NeoLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Building2, FileText, Search, ArrowRight, Shield, BarChart3, Download, Share2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIosDevice = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const isSlowConnection = Boolean(connection?.saveData || /2g/u.test(connection?.effectiveType ?? ''));

    if (prefersReducedMotion || isSlowConnection) return;

    const timer = window.setTimeout(() => setShouldLoadVideo(true), 200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('NeoView instalado', {
        description: 'O aplicativo foi adicionado à tela inicial.'
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isInstalled) {
      toast.success('NeoView já está instalado', {
        description: 'Abra pelo ícone da tela inicial para usar em tela cheia.'
      });
      return;
    }

    if (!deferredPrompt) {
      if (isIosDevice()) {
        toast.info('Instale pela tela inicial', {
          description: 'Toque em compartilhar e escolha "Adicionar à Tela de Início".'
        });
        return;
      }

      toast.info('Instalação disponível pelo navegador', {
        description: 'Use a opção "Instalar app" no menu do navegador se o botão nativo não aparecer.'
      });
      return;
    }

    setIsInstalling(true);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => undefined);
    setDeferredPrompt(null);
    setIsInstalling(false);
  };

  const features = [
    {
      icon: Building2,
      title: 'Estrutura Organizacional',
      description: 'Navegue pela hierarquia corporativa de forma intuitiva.',
    },
    {
      icon: FileText,
      title: 'Relatórios Centralizados',
      description: 'Acesse todos os relatórios PDF em um único lugar.',
    },
    {
      icon: Search,
      title: 'Busca Semântica com ÍRIS',
      description: 'Encontre informações usando linguagem natural.',
    },
    {
      icon: BarChart3,
      title: 'Indicadores',
      description: 'Visualize métricas e KPIs de forma clara.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <NeoLogo size="lg" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-6 sm:text-base"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-28">
        <div className="absolute inset-0">
          {shouldLoadVideo && !videoFailed ? (
            <video
              className="h-full w-full scale-[1.02] object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              onError={() => setVideoFailed(true)}
            >
              <source src="/hero-report-center.mp4" type="video/mp4" />
            </video>
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,#0b1f33_0%,#103658_35%,#16527a_65%,#1d6c8e_100%)]" />
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,17,30,0.68)_0%,rgba(9,17,30,0.54)_34%,rgba(9,17,30,0.5)_62%,rgba(9,17,30,0.7)_100%)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-white/15 bg-slate-950/28 px-5 py-8 shadow-2xl backdrop-blur-md sm:rounded-[28px] lg:px-10 lg:py-12">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-extrabold tracking-[0.02em] text-white">
              <Shield className="h-4 w-4" />
              Plataforma Corporativa
            </div>

            <h1 className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-6xl">
              Relatórios Corporativos
              <br />
              <span className="text-gradient">em um só lugar</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-base font-bold text-white sm:text-lg lg:text-xl">
              NeoView é a plataforma centralizada para acesso a indicadores e relatórios
              das empresas do grupo Neoenergia.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90 sm:w-auto sm:px-8 sm:py-4 sm:text-lg hero-gradient"
            >
              Acessar Plataforma
              <ArrowRight className="h-5 w-5" />
            </button>

            {!isInstalled ? (
              <div className="mt-4 sm:hidden">
                <button
                  type="button"
                  onClick={() => void handleInstallApp()}
                  disabled={isInstalling}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/12 px-6 py-3.5 text-base font-semibold text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Download className="h-5 w-5" />
                  {isInstalling ? 'Abrindo instalação...' : 'Baixar aplicativo'}
                </button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-white/78">
                  {isIosDevice() ? (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      Também funciona por Adicionar à Tela de Início
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-3.5 w-3.5" />
                      PWA pronto para usar antes do login
                    </>
                  )}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="mb-8 text-center text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
            Tudo que você precisa para acessar informações corporativas
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-card p-6 shadow-card"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 NeoView - Plataforma de Relatórios Corporativos</p>
          <p className="mt-1">Grupo Neoenergia</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
