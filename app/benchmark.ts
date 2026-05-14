import { timeToMinutes } from './src/lib/utils';
import { getSaoPauloNow } from './src/lib/time';

const MOCK_HORARIOS = Array.from({ length: 50 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = (i % 2 === 0 ? '00' : '30');
  return `${h}:${m}`;
});

function oldParse(horarios: string[]): number[] {
  return horarios
    .filter((time) => time?.includes(':'))
    .map(timeToMinutes)
    .sort((a, b) => a - b);
}

const cache = new WeakMap<string[], number[]>();

function newParse(horarios: string[]): number[] {
  let cached = cache.get(horarios);
  if (cached) return cached;

  cached = horarios
    .filter((time) => time?.includes(':'))
    .map(timeToMinutes)
    .sort((a, b) => a - b);

  cache.set(horarios, cached);
  return cached;
}

const N = 100000;

console.time('old');
for (let i = 0; i < N; i++) {
  oldParse(MOCK_HORARIOS);
}
console.timeEnd('old');

console.time('new');
for (let i = 0; i < N; i++) {
  newParse(MOCK_HORARIOS);
}
console.timeEnd('new');
