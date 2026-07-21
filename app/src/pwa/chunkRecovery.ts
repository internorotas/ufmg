import { getTenantStorageKey } from './tenantNamespace';

interface ChunkRecoveryOptions {
  buildId: string;
  onPersistentFailure: () => void;
  reload: () => void;
  updateServiceWorker: () => Promise<void>;
}

const CHUNK_RECOVERY_KEY = getTenantStorageKey('chunk-recovery-build-id');

export function recoverFromChunkPreloadError({
  buildId,
  onPersistentFailure,
  reload,
  updateServiceWorker,
}: ChunkRecoveryOptions): void {
  if (sessionStorage.getItem(CHUNK_RECOVERY_KEY) === buildId) {
    onPersistentFailure();
    return;
  }

  sessionStorage.setItem(CHUNK_RECOVERY_KEY, buildId);
  void updateServiceWorker().then(reload, reload);
}

export function installChunkPreloadRecovery(options: ChunkRecoveryOptions): () => void {
  const handlePreloadError = (event: Event) => {
    event.preventDefault();
    recoverFromChunkPreloadError(options);
  };

  window.addEventListener('vite:preloadError', handlePreloadError);
  return () => window.removeEventListener('vite:preloadError', handlePreloadError);
}
