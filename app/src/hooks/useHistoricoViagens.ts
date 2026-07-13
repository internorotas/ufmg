import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'historico_viagens_v1';
const MAX_RECORDS = 30;

export interface RegistroViagem {
  id: string;
  linhaId: string;
  linhaNome: string;
  linhaCorHex: string;
  startedAt: string;
  endedAt: string;
  distanceKm: number;
  durationMs: number;
  snapshotsCount: number;
  motivoEncerramento: string;
}

function readFromStorage(): RegistroViagem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RegistroViagem[];
  } catch {
    return [];
  }
}

function writeToStorage(records: RegistroViagem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

let historicoCache: RegistroViagem[] = readFromStorage();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): RegistroViagem[] {
  return historicoCache;
}

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function setHistoricoCache(next: RegistroViagem[]): void {
  historicoCache = next;
  writeToStorage(next);
  notifyListeners();
}

export function addViagem(viagem: Omit<RegistroViagem, 'id'>): void {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const record: RegistroViagem = { id, ...viagem };
  const next = [record, ...historicoCache].slice(0, MAX_RECORDS);
  setHistoricoCache(next);
}

export interface UseHistoricoViagensReturn {
  historico: RegistroViagem[];
  limparHistorico: () => void;
}

export function useHistoricoViagens(): UseHistoricoViagensReturn {
  const historico = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    historico,
    limparHistorico: () => setHistoricoCache([]),
  };
}
