const SP_TIME: Intl.DateTimeFormatOptions = {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatTimeSP(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString('pt-BR', SP_TIME);
  } catch {
    return isoString;
  }
}

const PT_BR_DATE: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

const PT_BR_DATETIME: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatDateTimePtBr(value: string): string {
  return new Date(value).toLocaleString('pt-BR', PT_BR_DATETIME);
}

export function formatDatePtBr(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', PT_BR_DATE);
}

export function formatConsent(consentAt: string | null): string {
  if (!consentAt) return 'Não concedido';
  return formatDateTimePtBr(consentAt);
}

export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  return min > 0 ? `${h}h ${min}min` : `${h}h`;
}

/** Duração no formato relógio (HH:MM:SS ou MM:SS) — painel de rastreio ao vivo. */
export function formatDurationClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Duração em linguagem natural (ex: "1h 23min", "5min 30s") — resumo de sessão encerrada. */
export function formatDurationHuman(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

/** Distância em metros/km (ex: "350 m", "1.2 km"). */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

/** Igual a formatDistance, recebendo o valor em quilômetros. */
export function formatDistanceKm(km: number): string {
  return formatDistance(km * 1000);
}
