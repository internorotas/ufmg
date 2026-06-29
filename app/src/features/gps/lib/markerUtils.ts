import type { Linha } from '@/types/data.types';

export function numLinha(linha: Linha): string {
  if (typeof linha.linha === 'number') return String(linha.linha);
  const m = linha.idRota.match(/^\d+/);
  return m ? m[0] : linha.idRota.slice(0, 3).toUpperCase();
}
