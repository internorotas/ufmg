/// <reference types="node" />
import { createRequire } from 'node:module';

// Jsdom não expõe localStorage/sessionStorage via window em todos os cenários.
// Polyfill in-memory compatível com a Web Storage API.
function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string) {
      return Object.hasOwn(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  });
}

const _require = createRequire(import.meta.url);

type Internals = Record<string, unknown>;

function proxyToCanonical(canonical: Internals, other: Internals): void {
  for (const key of Object.keys(canonical)) {
    Object.defineProperty(other, key, {
      get() {
        return canonical[key];
      },
      set(v: unknown) {
        canonical[key] = v;
      },
      configurable: true,
      enumerable: true,
    });
  }
}

const canonicalReactPath = _require.resolve('react');
const canonicalReact = _require(canonicalReactPath) as {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: Internals;
};
const canonicalInternals =
  canonicalReact.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

if (canonicalInternals) {
  // Packages that may resolve react from a different location (monorepo root's .pnpm)
  for (const pkg of ['react-router-dom', '@testing-library/react']) {
    try {
      const pkgEntryPath = _require.resolve(pkg);
      const pkgRequire = createRequire(pkgEntryPath);
      const altReactPath = pkgRequire.resolve('react');

      if (altReactPath !== canonicalReactPath) {
        const altReact = _require(altReactPath) as {
          __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: Internals;
        };
        const altInternals =
          altReact.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

        if (altInternals && altInternals !== canonicalInternals) {
          proxyToCanonical(canonicalInternals, altInternals);
        }
      }
    } catch {
      // Package not installed or already patched — skip
    }
  }
}
