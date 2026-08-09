export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaInstallSnapshot = {
  prompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
};

type Listener = (snapshot: PwaInstallSnapshot) => void;

const listeners = new Set<Listener>();
let installPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;
let didBindBrowserEvents = false;

export const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

export const isIosDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

const notify = () => {
  const snapshot = getPwaInstallSnapshot();
  listeners.forEach((listener) => listener(snapshot));
};

export const getPwaInstallSnapshot = (): PwaInstallSnapshot => ({
  prompt: installPrompt,
  isInstalled,
});

export const clearPwaInstallPrompt = () => {
  installPrompt = null;
  notify();
};

export const subscribeToPwaInstall = (listener: Listener) => {
  ensurePwaInstallListener();
  listeners.add(listener);
  listener(getPwaInstallSnapshot());

  return () => {
    listeners.delete(listener);
  };
};

export const ensurePwaInstallListener = () => {
  if (typeof window === 'undefined' || didBindBrowserEvents) return;

  didBindBrowserEvents = true;
  isInstalled = isStandaloneMode();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    isInstalled = true;
    notify();
  });
};

ensurePwaInstallListener();
