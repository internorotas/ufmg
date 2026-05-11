import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@/i18n';

import './globals.css';

import { App } from './App';
import { AppQueryProvider } from './providers/AppQueryProvider';

const SW_RELOAD_GUARD_KEY = 'ufmg:sw-reload-build-id';
const UPDATE_STATUS_REGION_ID = 'app-update-status';
const SERVICE_WORKER_UPDATE_INTERVAL_MS = 60_000;
const SERVICE_WORKER_SCOPE = import.meta.env.BASE_URL;
const SERVICE_WORKER_URL = new URL(
  `${import.meta.env.BASE_URL}sw.js`,
  window.location.origin,
).toString();
const MANIFEST_URL = new URL(
  `${import.meta.env.BASE_URL}site.webmanifest`,
  window.location.origin,
).toString();

function ensureUpdateStatusRegion(): HTMLElement {
  const existingRegion = document.getElementById(UPDATE_STATUS_REGION_ID);

  if (existingRegion instanceof HTMLElement) {
    return existingRegion;
  }

  const region = document.createElement('div');
  region.id = UPDATE_STATUS_REGION_ID;
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');

  Object.assign(region.style, {
    position: 'fixed',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });

  document.body.appendChild(region);
  return region;
}

function triggerSingleReloadForUpdatedServiceWorker(): void {
  if (sessionStorage.getItem(SW_RELOAD_GUARD_KEY) === import.meta.env.VITE_BUILD_ID) {
    return;
  }

  sessionStorage.setItem(SW_RELOAD_GUARD_KEY, import.meta.env.VITE_BUILD_ID);
  ensureUpdateStatusRegion().textContent = 'Nova versão disponível. Atualizando o aplicativo.';

  window.setTimeout(() => {
    window.location.reload();
  }, 150);
}

function ensureManifestLink(): void {
  if (import.meta.env.DEV) {
    return;
  }

  const existingManifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (existingManifest) {
    existingManifest.href = MANIFEST_URL;
    return;
  }

  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = MANIFEST_URL;
  document.head.appendChild(manifestLink);
}

async function cleanupServiceWorkersInDev(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

function registerAppServiceWorker(): void {
  if (import.meta.env.DEV) {
    void cleanupServiceWorkersInDev();
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  let hadControllerAtStartup = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtStartup) {
      hadControllerAtStartup = true;
      return;
    }

    triggerSingleReloadForUpdatedServiceWorker();
  });

  navigator.serviceWorker
    .register(SERVICE_WORKER_URL, { scope: SERVICE_WORKER_SCOPE })
    .then((registration) => {
      const checkForUpdate = () => {
        if (!document.hidden) {
          void registration.update();
        }
      };

      checkForUpdate();
      window.setInterval(checkForUpdate, SERVICE_WORKER_UPDATE_INTERVAL_MS);
      document.addEventListener('visibilitychange', checkForUpdate);
    })
    .catch((error: unknown) => {
      // biome-ignore lint/suspicious/noConsole: log intencional de falha no registro do service worker
      console.error('Falha ao registrar o service worker da aplicação.', error);
    });
}

/**
 * O ponto de entrada da aplicação. Renderiza o componente principal (`App`) dentro do `StrictMode`.
 * O ThemeProvider está dentro do componente App para manter o contexto co-localizado.
 *
 * O registro do Service Worker é manual via navigator.serviceWorker.register,
 * enquanto o sw.js continua sendo gerado pelo vite-plugin-pwa (Workbox)
 * com precache baseado nos hashes dos assets.
 * Quando um novo SW assume o controle desta aba, a página recarrega uma única vez
 * para alinhar shell + dados com a release mais recente.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento #root não encontrado para inicializar a aplicação.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppQueryProvider>
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>
    </AppQueryProvider>
  </StrictMode>,
);

ensureManifestLink();
registerAppServiceWorker();
