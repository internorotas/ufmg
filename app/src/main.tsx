import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getTenantStorageKey } from '@/pwa/tenantNamespace';
import { resolveApiEndpoint, withTenantHeaders } from '@/services/api/apiClient';
import { applyTenantDocumentMetadata } from '@/tenants/tenantConfig';
import '@/i18n';

import './globals.css';

import { App } from './App';
import { AppQueryProvider } from './providers/AppQueryProvider';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
    beforeSend(event) {
      if (event.request?.headers?.authorization) {
        delete event.request.headers.authorization;
      }

      if (event.user?.email) {
        delete event.user.email;
      }

      return event;
    },
  });
}

const SW_RELOAD_GUARD_KEY = getTenantStorageKey('sw-reload-build-id');
const SW_UPDATE_IN_PROGRESS_KEY = getTenantStorageKey('sw-update-in-progress');
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

applyTenantDocumentMetadata();

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
  if (sessionStorage.getItem(SW_UPDATE_IN_PROGRESS_KEY) === import.meta.env.VITE_BUILD_ID) {
    return;
  }

  if (sessionStorage.getItem(SW_RELOAD_GUARD_KEY) === import.meta.env.VITE_BUILD_ID) {
    return;
  }

  sessionStorage.setItem(SW_UPDATE_IN_PROGRESS_KEY, import.meta.env.VITE_BUILD_ID);
  sessionStorage.setItem(SW_RELOAD_GUARD_KEY, import.meta.env.VITE_BUILD_ID);
  ensureUpdateStatusRegion().textContent = 'Nova versão disponível. Atualizando o aplicativo.';

  window.setTimeout(() => {
    window.location.reload();
  }, 150);
}

async function forceServiceWorkerUpdate(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    triggerSingleReloadForUpdatedServiceWorker();
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE);
  if (registration) {
    await registration.update();
  }

  triggerSingleReloadForUpdatedServiceWorker();
}

function handleApiVersionMismatch(): void {
  ensureUpdateStatusRegion().textContent =
    'Detectada versão incompatível da API. Atualizando o aplicativo.';

  void forceServiceWorkerUpdate().catch((err: unknown) => {
    Sentry.captureException(err, { contexts: { source: { fn: 'handleApiVersionMismatch' } } });
    triggerSingleReloadForUpdatedServiceWorker();
  });
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

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'gps-flush-queue') {
      window.dispatchEvent(new CustomEvent('interno-rotas:gps-flush-queue'));
      return;
    }

    if (event.data?.type === 'push-resubscribe') {
      const sub = event.data.subscription as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      } | null;
      if (sub?.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
        const accessToken = useAuthStore.getState().accessToken;
        void fetch(resolveApiEndpoint('/v1/push/subscriptions'), {
          method: 'POST',
          headers: withTenantHeaders({
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          }),
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            context: null,
          }),
          keepalive: true,
        }).catch(() => undefined);
      }
    }
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
      Sentry.captureException(error, { contexts: { source: { fn: 'registerAppServiceWorker' } } });
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

// Se o forceCacheRecovery (inline em index.html) está em andamento, não monta
// o React. O script vai redirecionar a página após limpar SW + caches antigos.
// Isso evita o "Invalid hook call" causado por assets de builds misturados.
if (document.documentElement.getAttribute('data-cache-recovery') !== 'in-progress') {
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

  window.addEventListener('internorotas:api-version-mismatch', handleApiVersionMismatch);

  ensureManifestLink();
  registerAppServiceWorker();
}
