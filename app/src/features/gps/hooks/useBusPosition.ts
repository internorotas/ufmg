import { useEffect, useState } from 'react';
import { calcularPosicaoTeorica, type PosicaoTeorica } from '@/lib/busPosition';
import type { Linha, Parada } from '@/types/data.types';

const OSRM_CACHE_KEY_PREFIX = 'osrm_route_v2_';
const OSRM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Linhas com >= este número de pontos têm rota real do banco — ignora OSRM.
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

function resolverOsrm(linha: Linha): [number, number][] | undefined {
  // Rota real do banco (>= 30 pontos) tem prioridade — ignora OSRM cache.
  if (linha.coordenadasTrajeto.length >= MIN_POINTS_FOR_REAL_ROUTE) return undefined;
  return lerOsrmCache(linha.idRota) ?? undefined;
}

export function useBusPosition(linha: Linha | null, todasParadas: Parada[]): PosicaoTeorica | null {
  const [posicao, setPosicao] = useState<PosicaoTeorica | null>(() => {
    if (!linha) return null;
    return calcularPosicaoTeorica(linha, todasParadas, new Date(), resolverOsrm(linha));
  });

  useEffect(() => {
    if (!linha) {
      setPosicao(null);
      return;
    }

    const calcular = () => {
      setPosicao(calcularPosicaoTeorica(linha, todasParadas, new Date(), resolverOsrm(linha)));
    };

    calcular();
    const id = setInterval(calcular, 1_000);
    return () => clearInterval(id);
  }, [linha, todasParadas]);

  return posicao;
}
