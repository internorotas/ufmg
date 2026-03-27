import { useSyncExternalStore } from 'react';
import { getSaoPauloNow } from '../lib/time';

/**
 * Singleton de relógio compartilhado entre todos os consumidores do módulo.
 *
 * Mantém um único setInterval (30s) independente de quantos componentes
 * chamem useCurrentTime simultaneamente, eliminando N timers desnecessários.
 * Usa o padrão de external store compatível com React 18+ Concurrent Mode.
 */
let currentTime = getSaoPauloNow();
const subscribers = new Set<() => void>();

let timerId: ReturnType<typeof setInterval> | null = null;

function ensureTimer() {
  if (timerId !== null) return;
  timerId = setInterval(() => {
    currentTime = getSaoPauloNow();
    for (const cb of subscribers) cb();
  }, 30000);
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);
  ensureTimer();
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };
}

function getSnapshot(): Date {
  return currentTime;
}

/**
 * Mantém um relógio reativo para atualizar cálculos dependentes de tempo.
 *
 * O hook existe para desacoplar componentes da API de tempo do navegador
 * e centralizar a frequência de atualização usada por ETA e horários.
 *
 * Um único setInterval de 30s é compartilhado entre todos os consumidores,
 * evitando múltiplos timers quando vários componentes usam o hook.
 *
 * @returns Data atual atualizada em intervalos regulares.
 */
export function useCurrentTime(): Date {
  return useSyncExternalStore(subscribe, getSnapshot);
}
