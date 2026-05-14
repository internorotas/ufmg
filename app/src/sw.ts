/// <reference lib="WebWorker" />

import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL, type PrecacheEntry, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: Array<PrecacheEntry | string>;
  }
}

declare const self: ServiceWorkerGlobalScope;

const APP_SHELL_PATH = '/ufmg/index.html';
const DEFAULT_OPEN_URL = '/ufmg/';
const NAVIGATION_DENYLIST = [/^\/ufmg\/data\//, /\/site\.webmanifest$/];

const API_CACHE_NAME = 'api-cache-v1';
const RUNTIME_CACHE_NAME = 'runtime-v1';

const KNOWN_CACHE_PREFIXES = ['workbox-precache-v2-', 'api-cache-v', 'runtime-v'];

const API_NETWORK_TIMEOUT_SECONDS = 5;
const API_CACHE_MAX_ENTRIES = 120;
const API_CACHE_MAX_AGE_SECONDS = 60 * 60;

const RUNTIME_CACHE_MAX_ENTRIES = 40;
const RUNTIME_CACHE_MAX_AGE_SECONDS = 24 * 60 * 60;

interface PushPayload {
  title?: string;
  body?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  url?: string;
}

function resolveAssetUrl(path: string): string {
  return new URL(path, self.registration.scope).toString();
}

function parsePushPayload(data: PushMessageData | null): PushPayload {
  if (!data) {
    return {};
  }

  try {
    return data.json() as PushPayload;
  } catch {
    return { body: data.text() };
  }
}

self.skipWaiting();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL(APP_SHELL_PATH), {
    denylist: NAVIGATION_DENYLIST,
  }),
);

registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/v1/'),
  new NetworkFirst({
    cacheName: API_CACHE_NAME,
    networkTimeoutSeconds: API_NETWORK_TIMEOUT_SECONDS,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: API_CACHE_MAX_ENTRIES,
        maxAgeSeconds: API_CACHE_MAX_AGE_SECONDS,
      }),
    ],
  }),
);

registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/ufmg/data/'),
  new StaleWhileRevalidate({
    cacheName: RUNTIME_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: RUNTIME_CACHE_MAX_ENTRIES,
        maxAgeSeconds: RUNTIME_CACHE_MAX_AGE_SECONDS,
      }),
    ],
  }),
);

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter(
        (cacheName) => !KNOWN_CACHE_PREFIXES.some((prefix) => cacheName.startsWith(prefix)),
      );

      await Promise.all(cachesToDelete.map((cacheName) => caches.delete(cacheName)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data);

  const title = payload.title ?? 'Interno Rotas UFMG';
  const body = payload.body ?? 'Nova atualizacao de transporte disponivel.';
  const targetUrl = payload.url ?? DEFAULT_OPEN_URL;

  const icon = payload.icon ?? resolveAssetUrl('android-chrome-192x192.png');
  const badge = payload.badge ?? resolveAssetUrl('android-chrome-192x192.png');

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag: payload.tag ?? 'interno-rotas-default',
      data: {
        url: targetUrl,
      },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url;
  const targetUrl = typeof rawUrl === 'string' && rawUrl.length > 0 ? rawUrl : DEFAULT_OPEN_URL;
  const normalizedTargetUrl = new URL(targetUrl, self.location.origin).toString();

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        const windowClient = client as WindowClient;

        if (windowClient.url === normalizedTargetUrl) {
          await windowClient.focus();
          return;
        }
      }

      await self.clients.openWindow(normalizedTargetUrl);
    })(),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const previousSubscription = event.oldSubscription;

      if (!previousSubscription?.options.applicationServerKey) {
        return;
      }

      await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: previousSubscription.options.applicationServerKey,
      });
    })(),
  );
});
