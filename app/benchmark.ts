import { converterMinutosParaHora as oldConv } from './src/lib/utils';

function newConv(minutosTotais: number): string {
  if (!Number.isFinite(minutosTotais)) return '--:--';

  const minutosNoDia = 24 * 60;
  const valorNormalizado =
    ((Math.floor(minutosTotais) % minutosNoDia) + minutosNoDia) % minutosNoDia;
  const horas = Math.floor(valorNormalizado / 60);
  const minutos = valorNormalizado % 60;

  const hStr = horas < 10 ? '0' + horas : '' + horas;
  const mStr = minutos < 10 ? '0' + minutos : '' + minutos;

  return hStr + ':' + mStr;
}

const N = 1000000;

console.time('old');
for (let i = 0; i < N; i++) {
  oldConv(i);
}
console.timeEnd('old');

console.time('new');
for (let i = 0; i < N; i++) {
  newConv(i);
}
console.timeEnd('new');
