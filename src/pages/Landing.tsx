import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeoLogo } from '@/components/NeoLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Building2, FileText, Search, ArrowRight, Shield, BarChart3 } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const isSlowConnection = Boolean(connection?.saveData || /2g/u.test(connection?.effectiveType ?? ''));

    if (prefersReducedMotion || isMobile || isSlowConnection) return;

    const timer = window.setTimeout(() => setShouldLoadVideo(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

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
              preload="none"
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
