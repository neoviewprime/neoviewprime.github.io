import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoLogo } from '@/components/NeoLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Building2, FileText, Search, ArrowRight, Shield, BarChart3, Download, Share2, Smartphone, CheckCircle2, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { clearPwaInstallPrompt, isIosDevice, subscribeToPwaInstall, type BeforeInstallPromptEvent } from '@/lib/pwaInstall';

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
    return subscribeToPwaInstall(({ prompt, isInstalled: installed }) => {
      setDeferredPrompt(prompt);
      setIsInstalled(installed);

      if (installed) {
        toast.success('NeoView instalado', {
          description: 'O aplicativo foi adicionado à tela inicial.'
        });
      }
    });
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
          description: 'Use o botão de compartilhar e adicione o NeoView à tela inicial.'
        });
        return;
      }

      toast.info('Instalação disponível', {
        description: 'Adicione o NeoView à tela inicial para abrir como aplicativo.'
      });
      return;
    }

    setIsInstalling(true);
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => undefined);
    clearPwaInstallPrompt();
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

      <section className="relative overflow-hidden py-10 sm:py-16 lg:py-20">
        <div className="absolute inset-0">
          {shouldLoadVideo && !videoFailed ? (
            <video
              className="h-full w-full scale-[1.02] object-cover opacity-30"
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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,17,30,0.88)_0%,rgba(9,17,30,0.78)_42%,rgba(9,17,30,0.9)_100%)]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <Shield className="h-4 w-4" />
              Ambiente demonstrativo
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Informação confiável no momento da decisão.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-white/82 sm:text-lg">
              Relatórios, indicadores e conhecimento corporativo em um único ambiente, com governança, busca inteligente e rastreabilidade até a fonte.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/login')}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 sm:w-auto sm:px-8"
              >
                Acessar NeoView
                <ArrowRight className="h-5 w-5" />
              </button>

              {!isInstalled ? (
                <button
                  type="button"
                  onClick={() => void handleInstallApp()}
                  disabled={isInstalling}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/12 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-70 sm:hidden"
                >
                  <Download className="h-5 w-5" />
                  {isInstalling ? 'Abrindo instalação...' : 'Baixar aplicativo'}
                </button>
              ) : null}
            </div>

            {!isInstalled ? (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-white/72 sm:hidden">
                  {isIosDevice() ? (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      Adicione à tela inicial para abrir mais rápido
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-3.5 w-3.5" />
                      Acesso rápido antes mesmo do login
                    </>
                  )}
                </p>
            ) : null}

            <div className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-white/95 text-left shadow-2xl dark:bg-slate-950/92">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Central de Decisão</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Fontes validadas</span>
              </div>

              <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-4 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pergunta de negócio</p>
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.05]">
                    <Search className="h-5 w-5 text-primary" />
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">Compare DEC 2023 e 2024 e mostre o relatório fonte</p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {[
                      ['73%', 'redução estimada'],
                      ['22 min', 'por demanda'],
                      ['65 mil h', 'potencial anual'],
                    ].map(([value, label]) => (
                      <div key={value} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
                        <p className="text-2xl font-semibold text-slate-950 dark:text-white">{value}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-white/10 dark:border-white/10">
                    {['Relatório DEC Q4 2024', 'Comparativo DEC 2023-2024', 'Plano de ação DEC 2025'].map((item, index) => (
                      <div key={item} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{index === 0 ? 'Validado' : 'Fonte'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6 lg:border-l lg:border-t-0 dark:border-white/10 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">ÍRIS</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Assistente corporativa</p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
                    O DEC apresenta melhora no período analisado e faz sentido para avaliar continuidade do serviço. Use também FEC e plano de ação para validar a causa operacional.
                  </div>
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Rastreabilidade</p>
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Resposta conectada ao relatório fonte, período e área responsável.</p>
                  </div>
                </div>
              </div>
            </div>
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
