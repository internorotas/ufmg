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

export function calcularPosicaoTeorica(
  linha: Linha,
  todasParadas: Parada[],
  agora: Date,
): PosicaoTeorica | null {
  const { trajetoDetalhado, horarios } = linha;
  if (!trajetoDetalhado || trajetoDetalhado.length < 2) return null;
  if (!horarios || horarios.length === 0) return null;

  const agoraMin = agora.getHours() * 60 + agora.getMinutes() + agora.getSeconds() / 60;

  // Horário de saída mais recente que já passou
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
  if (elapsedMin >= duracaoTotal) return null;

  // Tempos cumulativos por parada
  const cumTimes: number[] = [0];
  for (let i = 1; i < trajetoDetalhado.length; i++) {
    cumTimes.push(cumTimes[i - 1] + trajetoDetalhado[i].tempoDoAnteriorMinutos);
  }

  const paradaMap = new Map(todasParadas.map((p) => [p.idParada, p]));

  // Segmento atual
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
