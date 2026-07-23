// Endpoints GET públicos comprovados: dado de transporte coletivo, sem
// identidade de usuário. Qualquer rota fora desta lista vai sempre à rede,
// mesmo que o backend não envie Cache-Control — allowlist, não denylist.
const PUBLIC_API_PATH_RE =
  /^\/v1\/(?:mobility\/corridors\/[^/]+\/(?:eta\/[^/]+|conditions)|planner\/routes|map\/ufmg-predios|api\/gtfs\/(?:routes(?:\/[^/]+(?:\/(?:stops|shape))?)?|stops\/search)|paradas|stops\/nearest|partners\/active|transit\/(?:data|special-periods|bhtrans\/live)|gamification\/rankings\/public)$/;

export function isCacheableApiRequest(url: URL, request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }

  if (request.headers.has('Authorization')) {
    return false;
  }

  return PUBLIC_API_PATH_RE.test(url.pathname);
}
