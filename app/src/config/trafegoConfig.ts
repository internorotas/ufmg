export interface PeriodoTrafego {
  inicioMinutos: number;
  fimMinutos: number;
  multiplicador: number;
}

export const CONFIG_TRAFEGO: PeriodoTrafego[] = [
  {
    inicioMinutos: 690,
    fimMinutos: 780,
    multiplicador: 1.15,
  },
  {
    inicioMinutos: 1020,
    fimMinutos: 1110,
    multiplicador: 1.3,
  },
];

export function obterMultiplicadorTrafego(horaAtualMinutos: number): number {
  for (const periodo of CONFIG_TRAFEGO) {
    if (
      horaAtualMinutos >= periodo.inicioMinutos &&
      horaAtualMinutos <= periodo.fimMinutos
    ) {
      return periodo.multiplicador;
    }
  }

  return 1.0;
}
