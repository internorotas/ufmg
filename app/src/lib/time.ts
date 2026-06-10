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

// Cache for Intl.DateTimeFormat output to avoid expensive formatToParts calls.
// Max cache size set to 1000 items to prevent unbounded memory growth.
const cache = new Map<number, number>();
const MAX_CACHE_SIZE = 1000;

export function toSaoPauloDate(date: Date): Date {
  const time = date.getTime();
  const cachedTime = cache.get(time);

  if (cachedTime !== undefined) {
    return new Date(cachedTime);
  }

  const parts = saoPauloFormatter.formatToParts(date);

  // Single pass over parts is faster than multiple find() calls
  // and avoids creating intermediate arrays/functions.
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.type === 'year') year = Number(part.value);
    else if (part.type === 'month') month = Number(part.value);
    else if (part.type === 'day') day = Number(part.value);
    else if (part.type === 'hour') hour = Number(part.value);
    else if (part.type === 'minute') minute = Number(part.value);
    else if (part.type === 'second') second = Number(part.value);
  }

  const result = new Date(year, month - 1, day, hour, minute, second);
  const resultTime = result.getTime();

  if (cache.size >= MAX_CACHE_SIZE) {
    cache.clear();
  }

  cache.set(time, resultTime);
  return new Date(resultTime);
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
