import type { Linha, Parada } from '@/types/data.types';
import { calcularDistanciaKm } from './utils';

export interface PosicaoTeorica {
  lat: number;
  lng: number;
  heading: number | null;
  horarioSaida: string;
  elapsedMin: number;
}

function horaParaMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function calcularHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

// Interpola ao longo das coordenadas do trajeto (geometria real das ruas)
function interpolarNaTrajeto(
  coords: [number, number][],
  progress: number,
  horarioSaida: string,
  elapsedMin: number,
): PosicaoTeorica | null {
  const cumDist: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    const d = calcularDistanciaKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]);
    cumDist.push(cumDist[i - 1] + d);
  }
  const totalKm = cumDist[cumDist.length - 1];
  if (totalKm === 0) return null;

  const targetKm = Math.min(progress * totalKm, totalKm);

  let segIdx = coords.length - 1;
  for (let i = 1; i < cumDist.length; i++) {
    if (targetKm <= cumDist[i]) {
      segIdx = i;
      break;
    }
  }

  const segLen = cumDist[segIdx] - cumDist[segIdx - 1];
  const t = segLen > 0 ? (targetKm - cumDist[segIdx - 1]) / segLen : 0;
  const [latA, lngA] = coords[segIdx - 1];
  const [latB, lngB] = coords[segIdx];

  return {
    lat: lerp(latA, latB, t),
    lng: lerp(lngA, lngB, t),
    heading: calcularHeading(latA, lngA, latB, lngB),
    horarioSaida,
    elapsedMin,
  };
}

// Fallback: interpola em linha reta entre paradas consecutivas
function interpolarEntreParadas(
  trajetoDetalhado: { idParada: string; tempoDoAnteriorMinutos: number }[],
  todasParadas: Parada[],
  elapsedMin: number,
  horarioSaida: string,
): PosicaoTeorica | null {
  const cumTimes: number[] = [0];
  for (let i = 1; i < trajetoDetalhado.length; i++) {
    cumTimes.push(cumTimes[i - 1] + trajetoDetalhado[i].tempoDoAnteriorMinutos);
  }

  const paradaMap = new Map(todasParadas.map((p) => [p.idParada, p]));

  let segIdx = trajetoDetalhado.length - 1;
  for (let i = 1; i < cumTimes.length; i++) {
    if (elapsedMin < cumTimes[i]) {
      segIdx = i;
      break;
    }
  }

  const paradaA = paradaMap.get(trajetoDetalhado[segIdx - 1].idParada);
  const paradaB = paradaMap.get(trajetoDetalhado[segIdx].idParada);
  if (!paradaA || !paradaB) return null;

  const segDuracao = trajetoDetalhado[segIdx].tempoDoAnteriorMinutos;
  const t = segDuracao > 0 ? (elapsedMin - cumTimes[segIdx - 1]) / segDuracao : 0;

  return {
    lat: lerp(paradaA.coordenadas[0], paradaB.coordenadas[0], t),
    lng: lerp(paradaA.coordenadas[1], paradaB.coordenadas[1], t),
    heading: calcularHeading(
      paradaA.coordenadas[0],
      paradaA.coordenadas[1],
      paradaB.coordenadas[0],
      paradaB.coordenadas[1],
    ),
    horarioSaida,
    elapsedMin,
  };
}

export function calcularPosicaoTeorica(
  linha: Linha,
  todasParadas: Parada[],
  agora: Date,
  osrmCoords?: [number, number][],
): PosicaoTeorica | null {
  const { trajetoDetalhado, horarios, coordenadasTrajeto } = linha;
  if (!trajetoDetalhado || trajetoDetalhado.length < 2) return null;
  if (!horarios || horarios.length === 0) return null;

  const agoraMin =
    agora.getHours() * 60 +
    agora.getMinutes() +
    agora.getSeconds() / 60 +
    agora.getMilliseconds() / 60000;

  const horariosSorted = [...horarios].sort();
  let horarioSaida: string | null = null;
  for (let i = horariosSorted.length - 1; i >= 0; i--) {
    if (horaParaMinutos(horariosSorted[i]) <= agoraMin) {
      horarioSaida = horariosSorted[i];
      break;
    }
  }
  if (!horarioSaida) return null;

  const elapsedMin = agoraMin - horaParaMinutos(horarioSaida);
  const duracaoTotal = trajetoDetalhado.reduce((acc, t) => acc + t.tempoDoAnteriorMinutos, 0);
  if (duracaoTotal <= 0 || elapsedMin >= duracaoTotal) return null;

  const progress = elapsedMin / duracaoTotal;

  // Prioridade: coords OSRM passadas pelo caller > trajeto do backend > interpolação linear
  const geomCoords =
    (osrmCoords && osrmCoords.length >= 2)
      ? osrmCoords
      : Array.isArray(coordenadasTrajeto) && coordenadasTrajeto.length >= 2
        ? (coordenadasTrajeto as [number, number][])
        : null;

  if (geomCoords) {
    return interpolarNaTrajeto(geomCoords, progress, horarioSaida, elapsedMin);
  }

  // Fallback: interpolação linear entre paradas
  return interpolarEntreParadas(trajetoDetalhado, todasParadas, elapsedMin, horarioSaida);
}

export function encontrarParadaMaisProxima(
  userLat: number,
  userLng: number,
  paradas: Parada[],
): Parada | null {
  if (paradas.length === 0) return null;

  let melhor = paradas[0];
  let menorDist = calcularDistanciaKm(
    userLat,
    userLng,
    paradas[0].coordenadas[0],
    paradas[0].coordenadas[1],
  );

  for (let i = 1; i < paradas.length; i++) {
    const dist = calcularDistanciaKm(
      userLat,
      userLng,
      paradas[i].coordenadas[0],
      paradas[i].coordenadas[1],
    );
    if (dist < menorDist) {
      menorDist = dist;
      melhor = paradas[i];
    }
  }

  return melhor;
}
