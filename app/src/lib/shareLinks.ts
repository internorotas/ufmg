/**
 * Links compartilháveis (deep link) para linha/parada.
 *
 * A rota raiz consome `?linha=<idRota>` / `?parada=<idParada>` (ver App.tsx)
 * pra selecionar automaticamente o item ao abrir o link — sem isso, compartilhar
 * só copiava texto solto, sem nenhum jeito de o destinatário abrir a mesma tela.
 */

function buildShareUrl(param: 'linha' | 'parada', id: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const url = new URL(base, window.location.origin);
  url.searchParams.set(param, id);
  return url.toString();
}

export function buildLinhaShareUrl(idRota: string): string {
  return buildShareUrl('linha', idRota);
}

export function buildParadaShareUrl(idParada: string): string {
  return buildShareUrl('parada', idParada);
}
