export interface PeriodoTrafego {
  inicioMinutos: number;
  fimMinutos: number;
  multiplicador: number;
  label: string;
}

function h(horas: number, minutos = 0): number {
  return horas * 60 + minutos;
}

export const CONFIG_TRAFEGO: PeriodoTrafego[] = [
  {
    inicioMinutos: h(7, 0), // 07:00
    fimMinutos: h(8, 30), // 08:30
    multiplicador: 1.2,
    label: "Pico manha",
  },
  {
    inicioMinutos: h(11, 30), // 11:30
    fimMinutos: h(13, 30), // 13:30
    multiplicador: 1.15,
    label: "Almoco",
  },
  {
    inicioMinutos: h(17, 0), // 17:00
    fimMinutos: h(18, 45), // 18:45
    multiplicador: 1.3,
    label: "Pico tarde",
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
