import { afterEach, describe, expect, it, vi } from 'vitest';
import { installChunkPreloadRecovery, recoverFromChunkPreloadError } from './chunkRecovery';

const buildId = 'commit-atual';
const storageKey = 'interno-rotas:ufmg:chunk-recovery-build-id';

afterEach(() => {
  sessionStorage.clear();
});

describe('chunk recovery', () => {
  it('atualiza e recarrega uma única vez para o build atual', async () => {
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();
    const onPersistentFailure = vi.fn();

    recoverFromChunkPreloadError({ buildId, updateServiceWorker, reload, onPersistentFailure });
    await Promise.resolve();

    expect(updateServiceWorker).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
    expect(onPersistentFailure).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(storageKey)).toBe(buildId);
  });

  it('mostra falha persistente sem novo reload', () => {
    sessionStorage.setItem(storageKey, buildId);
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();
    const onPersistentFailure = vi.fn();

    recoverFromChunkPreloadError({ buildId, updateServiceWorker, reload, onPersistentFailure });

    expect(updateServiceWorker).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
    expect(onPersistentFailure).toHaveBeenCalledOnce();
  });

  it('recarrega mesmo quando a atualização do service worker falha', async () => {
    const reload = vi.fn();

    recoverFromChunkPreloadError({
      buildId,
      updateServiceWorker: vi.fn().mockRejectedValue(new Error('offline')),
      reload,
      onPersistentFailure: vi.fn(),
    });
    await Promise.resolve();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('intercepta o evento oficial do Vite', () => {
    const dispose = installChunkPreloadRecovery({
      buildId,
      updateServiceWorker: vi.fn().mockResolvedValue(undefined),
      reload: vi.fn(),
      onPersistentFailure: vi.fn(),
    });
    const event = new Event('vite:preloadError', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    dispose();
  });
});
