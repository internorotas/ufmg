import { useEffect, useState } from 'react';
import { calcularPosicaoTeorica, type PosicaoTeorica } from '@/lib/busPosition';
import type { Linha, Parada } from '@/types/data.types';

const OSRM_CACHE_KEY_PREFIX = 'osrm_route_v2_';
const OSRM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Espelha MIN_POINTS_FOR_REAL_ROUTE de useOsrmRoute.ts.
const MIN_POINTS_FOR_REAL_ROUTE = 30;

function lerOsrmCache(lineId: string): [number, number][] | null {
  try {
    const raw = localStorage.getItem(OSRM_CACHE_KEY_PREFIX + lineId);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { ts: number; data: [number, number][] };
    if (Date.now() - entry.ts < OSRM_CACHE_TTL_MS && entry.data.length > 0) return entry.data;
  } catch {}
  return null;
}

function calcularTodasPosicoes(
  linhas: Linha[],
  todasParadas: Parada[],
  agora: Date,
): Map<string, PosicaoTeorica> {
  const mapa = new Map<string, PosicaoTeorica>();
  for (const linha of linhas) {
    // Rota real do banco (>= 30 pontos) tem prioridade — ignora OSRM.
    const osrm =
      linha.coordenadasTrajeto.length >= MIN_POINTS_FOR_REAL_ROUTE
        ? undefined
        : (lerOsrmCache(linha.idRota) ?? undefined);
    const pos = calcularPosicaoTeorica(linha, todasParadas, agora, osrm);
    if (pos) mapa.set(linha.idRota, pos);
  }
  return mapa;
}

export function useAllBusPositions(
  linhas: Linha[],
  todasParadas: Parada[],
): Map<string, PosicaoTeorica> {
  const [posicoes, setPosicoes] = useState<Map<string, PosicaoTeorica>>(() =>
    calcularTodasPosicoes(linhas, todasParadas, new Date()),
  );

  useEffect(() => {
    setPosicoes(calcularTodasPosicoes(linhas, todasParadas, new Date()));

    const id = setInterval(() => {
      setPosicoes(calcularTodasPosicoes(linhas, todasParadas, new Date()));
    }, 5_000);

    return () => clearInterval(id);
  }, [linhas, todasParadas]);

  return posicoes;
}
