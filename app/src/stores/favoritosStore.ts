import { create } from 'zustand';

const STORAGE_KEY = 'favoritos_v1';

function readFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(ids: string[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

interface FavoritosState {
  ids: string[];
  /** Sync from localStorage (used for cross-tab updates). */
  syncFromStorage: () => void;
  toggle: (idRota: string) => { next: string[]; isNowFav: boolean };
}

export const useFavoritosStore = create<FavoritosState>((set, get) => ({
  ids: readFromStorage(),

  syncFromStorage: () => {
    set({ ids: readFromStorage() });
  },

  toggle: (idRota) => {
    const prev = get().ids;
    const isNowFav = !prev.includes(idRota);
    const next = isNowFav ? [...prev, idRota] : prev.filter((id) => id !== idRota);
    writeToStorage(next);
    set({ ids: next });
    return { next, isNowFav };
  },
}));

let storageListenerRefCount = 0;
let detachStorageListener: (() => void) | null = null;

export function retainFavoritosStorageListener(): () => void {
  storageListenerRefCount += 1;
  if (!detachStorageListener) {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        useFavoritosStore.getState().syncFromStorage();
      }
    };
    window.addEventListener('storage', handler);
    detachStorageListener = () => window.removeEventListener('storage', handler);
  }

  return () => {
    storageListenerRefCount = Math.max(0, storageListenerRefCount - 1);
    if (storageListenerRefCount === 0 && detachStorageListener) {
      detachStorageListener();
      detachStorageListener = null;
    }
  };
}
