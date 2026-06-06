(function forceCacheRecovery() {
  var isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    return;
  }

  var url = new URL(window.location.href);
  if (url.searchParams.get('cache-recovery') === 'done') {
    return;
  }

  var pathSegments = window.location.pathname.split('/').filter(Boolean);
  var tenantSlug = pathSegments[0] || 'ufmg';
  var appBasePath = isLocalhost ? '/' : ('/' + tenantSlug + '/');
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
    .then(function () {
      if (!('serviceWorker' in navigator)) {
        return;
      }

      return navigator.serviceWorker
        .getRegistrations()
        .then(function (registrations) {
          return Promise.all(
            registrations.map(function (registration) {
              var scopePathname = new URL(registration.scope).pathname;
              var shouldResetRegistration =
                scopePathname === '/' || scopePathname.indexOf(appBasePath) === 0;

              if (!shouldResetRegistration) {
                return Promise.resolve(false);
              }

              return registration.unregister();
            }),
          );
        });
    })
    .then(function () {
      if (!('caches' in window)) {
        return;
      }

      return caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      });
    })
    .catch(function () { return undefined; })
    .finally(function () {
      url.searchParams.set('cache-recovery', 'done');
      url.searchParams.set('v', String(Date.now()));
      window.location.replace(url.toString());
    });
})();
