import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installDemoApiMock } from "./lib/demoApi";
import "./index.css";

installDemoApiMock();

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) {
      return;
    }

    refreshing = true;
    window.location.reload();
  });

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none'
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;

      if (!worker) {
        return;
      }

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    await registration.update().catch(() => undefined);
  } catch (error) {
    console.warn('Service worker registration failed', error);
  }
};

window.addEventListener('load', () => {
  void registerServiceWorker();
});

createRoot(document.getElementById("root")!).render(<App />);
