const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

const saoPauloFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  const value = parts.find((part) => part.type === type)?.value;
  return value ? Number(value) : 0;
}

export function toSaoPauloDate(date: Date): Date {
  const parts = saoPauloFormatter.formatToParts(date);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');
  const hour = getPart(parts, 'hour');
  const minute = getPart(parts, 'minute');
  const second = getPart(parts, 'second');

  return new Date(year, month - 1, day, hour, minute, second);
}

export function getSaoPauloNow(): Date {
  return toSaoPauloDate(new Date());
}

export function getSaoPauloMinutesOfDay(date: Date): number {
  const normalized = toSaoPauloDate(date);
  return normalized.getHours() * 60 + normalized.getMinutes();
}

export function getSaoPauloDayOfWeek(date: Date): number {
  const normalized = toSaoPauloDate(date);
  return normalized.getDay();
}
