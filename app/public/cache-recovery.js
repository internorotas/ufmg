(function forceCacheRecovery() {
  var isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Remove parâmetros legados de recovery da barra de endereço (poluição de URL).
  // O controle de "já rodou" é feito por sessionStorage, não pela query string.
  try {
    var current = new URL(window.location.href);
    if (current.searchParams.has('cache-recovery') || current.searchParams.has('v')) {
      current.searchParams.delete('cache-recovery');
      current.searchParams.delete('v');
      window.history.replaceState(null, '', current.toString());
    }
  } catch (_cleanupError) {
    // Ignora: limpeza de URL é best-effort.
  }

  if (isLocalhost) {
    return;
  }

  var pathSegments = window.location.pathname.split('/').filter(Boolean);
  var tenantSlug = pathSegments[0] || 'ufmg';
  var appBasePath = isLocalhost ? '/' : '/' + tenantSlug + '/';
  var recoveryKey = 'interno-rotas:' + tenantSlug + ':cache-recovery:v2';
  var alreadyRan = false;

  try {
    alreadyRan = window.sessionStorage.getItem(recoveryKey) === '1';
    if (!alreadyRan) {
      window.sessionStorage.setItem(recoveryKey, '1');
    }
  } catch (_error) {
    alreadyRan = false;
  }

  if (alreadyRan) {
    return;
  }

  // Marca SINCRONAMENTE antes de qualquer operação async.
  // O main.tsx verifica este atributo antes de montar o React —
  // se estiver presente, React não monta durante o redirect de recovery,
  // evitando o erro "Invalid hook call" causado por assets de builds
  // misturados servidos pelo Service Worker desatualizado.
  document.documentElement.setAttribute('data-cache-recovery', 'in-progress');

  Promise.resolve()
    .then(() => {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      return navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(
          registrations.map((registration) => {
            var scopePathname = new URL(registration.scope).pathname;
            var shouldResetRegistration =
              scopePathname === '/' || scopePathname.indexOf(appBasePath) === 0;

            if (!shouldResetRegistration) {
              return Promise.resolve(false);
            }

            return registration.unregister();
          }),
        ),
      );
    })
    .then(() => {
      if (!('caches' in window)) {
        return;
      }

      return caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    })
    .catch(() => undefined)
    .finally(() => {
      // Recarrega para buscar assets frescos após limpar SW + caches.
      // sessionStorage (recoveryKey) impede loop; sem parâmetros na URL.
      window.location.reload();
    });
})();
