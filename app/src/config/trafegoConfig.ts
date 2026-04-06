export interface PeriodoTrafego {
  inicioMinutos: number;
  fimMinutos: number;
  multiplicador: number;
  label: string;
}

function h(horas: number, minutos = 0): number {
  return horas * 60 + minutos;
}

/** Janelas de tráfego usadas para ajustar ETA em trechos externos. */
export const CONFIG_TRAFEGO: PeriodoTrafego[] = [
  {
    inicioMinutos: h(7, 0),
    fimMinutos: h(8, 30),
    multiplicador: 1.2,
    label: 'Pico manhã',
  },
  {
    inicioMinutos: h(11, 30),
    fimMinutos: h(13, 30),
    multiplicador: 1.15,
    label: 'Almoço',
  },
  {
    inicioMinutos: h(17, 0),
    fimMinutos: h(18, 45),
    multiplicador: 1.3,
    label: 'Pico tarde',
  },
];

/**
 * Retorna o multiplicador de tráfego aplicável para o horário informado.
 */
export function obterMultiplicadorTrafego(horaAtualMinutos: number): number {
  for (const periodo of CONFIG_TRAFEGO) {
    if (horaAtualMinutos >= periodo.inicioMinutos && horaAtualMinutos <= periodo.fimMinutos) {
      return periodo.multiplicador;
    }
  }

  return 1.0;
}
