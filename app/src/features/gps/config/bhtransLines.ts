/**
 * Configuração estática das linhas BHTrans relevantes para a UFMG.
 * Atualizar `nome` e `sublinha` conforme nomenclatura oficial da BHTrans.
 */

export interface BhtransLineConfig {
  color: string;
  /** Rótulo do grupo de serviço (MOVE, Municipal, Suplementar). */
  label: string;
  nome: string;
  sublinha?: string;
}

export const BHTRANS_LINE_CONFIG: Record<string, BhtransLineConfig> = {
  // MOVE (BRT) — verde limão
  '64': { color: '#b3ff19', label: 'MOVE', nome: '64' },
  '67': {
    color: '#b3ff19',
    label: 'MOVE',
    nome: '67',
  },
  '5106': { color: '#b3ff19', label: 'MOVE', nome: '5106' },

  // Municipal — azul
  '5102': { color: '#0066af', label: 'Municipal', nome: '5102' },
  '9502': { color: '#0066af', label: 'Municipal', nome: '9502' },
  '9550': { color: '#0066af', label: 'Municipal', nome: '9550' },

  // Suplementares — âmbar
  S53: { color: '#efb12d', label: 'Suplementar', nome: 'S53' },
  S56: { color: '#efb12d', label: 'Suplementar', nome: 'S56' },
  S54: { color: '#efb12d', label: 'Suplementar', nome: 'S54' },
};

/** Normaliza o ID de linha BHTrans: strips leading zeros, mantém prefixo letra. */
export function normalizeBhtransLineId(raw: string): string {
  const s = String(raw).trim();
  const letterMatch = s.match(/^([A-Za-z]+)\s*0*(\d+)$/);
  if (letterMatch) return `${letterMatch[1].toUpperCase()}${letterMatch[2]}`;
  const num = Number.parseInt(s, 10);
  return Number.isNaN(num) ? s : String(num);
}

export function getBhtransLineConfig(linhaId: string): BhtransLineConfig {
  const known = BHTRANS_LINE_CONFIG[linhaId];
  if (known) return known;

  // Linhas puramente numéricas (sem prefixo S de suplementar) seguem a cor
  // Municipal padrão da BHTrans, mesmo sem estar no mapa acima.
  if (/^\d+$/.test(linhaId)) {
    return { color: '#0066af', label: 'Municipal', nome: linhaId };
  }

  return { color: '#94a3b8', label: 'BHTrans', nome: `Linha ${linhaId}` };
}
