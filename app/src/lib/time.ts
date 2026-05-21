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

// LRU Cache for toSaoPauloDate to avoid expensive Intl.DateTimeFormat calls
// Max size is kept relatively small as we primarily need it for the current
// time which changes every millisecond but frequently requests the same time.
const saoPauloDateCache = new Map<number, Date>();
const MAX_CACHE_SIZE = 1000;

export function toSaoPauloDate(date: Date): Date {
  const time = date.getTime();
  const cached = saoPauloDateCache.get(time);
  if (cached) {
    // Return a cloned instance to prevent caller mutations
    return new Date(cached.getTime());
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

  if (saoPauloDateCache.size >= MAX_CACHE_SIZE) {
    // Basic LRU: delete oldest entry (first item returned by keys iterator)
    const firstKey = saoPauloDateCache.keys().next().value;
    if (firstKey !== undefined) saoPauloDateCache.delete(firstKey);
  }

  saoPauloDateCache.set(time, result);
  return new Date(result.getTime());
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
