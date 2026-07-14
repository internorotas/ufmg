import type { Linha } from '@/types/data.types';

/**
 * Número da linha principal, para exibição ao usuário.
 *
 * `linha.linha` é um id numérico interno — pode não bater com o número real
 * da rota em variantes por categoria de dia (ex: "Férias e Recessos"), já que
 * às vezes é só um contador sequencial de cadastro. `nome` (ex: "Linha 02") é
 * a fonte confiável, então extrai o número de lá primeiro.
 */
export function numLinha(linha: Linha): string {
  const fromNome = linha.nome.match(/\d+/)?.[0];
  if (fromNome) return String(Number(fromNome));
  if (typeof linha.linha === 'number') return String(linha.linha);
  const m = linha.idRota.match(/^\d+/);
  return m ? m[0] : linha.idRota.slice(0, 3).toUpperCase();
}
