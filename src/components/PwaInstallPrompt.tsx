import { useEffect, useMemo, useState } from 'react';
import { Download, Share2, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const PWA_PROMPT_STORAGE_KEY = 'neoview-pwa-install-prompt-seen';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

const isIosDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export function PwaInstallPrompt() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const canShowPrompt = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hasSeenPrompt = window.localStorage.getItem(PWA_PROMPT_STORAGE_KEY) === 'true';
    return isMobile && !hasSeenPrompt && !isInstalled && !isStandaloneMode();
  }, [isInstalled, isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsInstalled(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      window.localStorage.setItem(PWA_PROMPT_STORAGE_KEY, 'true');
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!canShowPrompt) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
      window.localStorage.setItem(PWA_PROMPT_STORAGE_KEY, 'true');
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [canShowPrompt]);

  const closePrompt = () => {
    setIsOpen(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      closePrompt();
      return;
    }

    setIsInstalling(true);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome !== 'accepted') {
      setDeferredPrompt(null);
    }
    setIsInstalling(false);
    closePrompt();
  };

  if (!isOpen || !isMobile || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
      <div className="mx-auto max-w-md rounded-[24px] border border-primary/20 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Instale o NeoView</p>
              <p className="text-xs text-muted-foreground">Acesso mais rapido direto da tela inicial.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={closePrompt}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar convite de instalação"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
          {deferredPrompt ? (
            <p>Baixe a versão em app para abrir o NeoView em tela cheia e voltar mais rápido nas próximas visitas.</p>
          ) : isIosDevice() ? (
            <p className="flex items-center gap-1">
              Toque em <Share2 className="h-4 w-4 text-primary" /> e escolha <span className="font-medium text-foreground">Adicionar à Tela de Início</span>.
            </p>
          ) : (
            <p>Seu navegador pode instalar este app. Use a opção de instalar no menu do navegador se o botão não aparecer.</p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          {deferredPrompt ? (
            <Button onClick={() => void handleInstall()} disabled={isInstalling} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              {isInstalling ? 'Abrindo...' : 'Baixar app'}
            </Button>
          ) : (
            <Button onClick={closePrompt} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Entendi
            </Button>
          )}
          <Button variant="outline" onClick={closePrompt}>
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PwaInstallPrompt;
