/**
 * Service Worker — Interno Rotas UFMG
 *
 * Estratégia:
 *  - Dados JSON  → stale-while-revalidate (cache serve imediato + atualização em background)
 *  - Navegação   → cache-first, fallback para index.html (garante funcionamento offline)
 *  - Assets JS/CSS/fontes → cache-first, lazy (cacheados na primeira visita)
 *
 * Atualizar CACHE_VERSION a cada novo deploy que mude o conteúdo.
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `interno-rotas-static-${CACHE_VERSION}`;
const DATA_CACHE = `interno-rotas-data-${CACHE_VERSION}`;
const BASE = '/ufmg';

/** Recursos críticos cacheados durante o install */
const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/data/linhas.json`,
  `${BASE}/data/paradas.json`,
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, DATA_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Não intercepta requests para outros domínios (analytics, tiles externos)
  if (url.origin !== self.location.origin) return;

  // Arquivos de dados: stale-while-revalidate
  if (url.pathname.startsWith(`${BASE}/data/`)) {
    event.respondWith(staleWhileRevalidate(request, DATA_CACHE));
    return;
  }

  // Requests de navegação HTML: serve o shell SPA (index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(`${BASE}/index.html`).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  // Assets estáticos (JS, CSS, fontes, imagens): cache-first, lazy
  event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Serve do cache imediatamente se disponível; atualiza em background
  return cached ?? (await networkPromise) ?? offlineResponse();
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return offlineResponse();
  }
}

function offlineResponse() {
  return new Response('Recurso não disponível offline.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

/**
 * Trata o clique em uma notificação do sistema:
 * - Fecha a notificação
 * - Foca uma janela já aberta do app ou abre uma nova
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(BASE) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(`${BASE}/`);
      }
    }),
  );
});
