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
