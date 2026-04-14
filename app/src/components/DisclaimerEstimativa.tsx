import { Info } from 'lucide-react';

export function DisclaimerEstimativa() {
  return (
    <section
      className="rounded-lg border border-info-border/60 bg-info-bg/70 p-2"
      aria-label="Aviso sobre estimativas de chegada"
    >
      <div className="flex items-center gap-1.5">
        <Info className="h-3.5 w-3.5 shrink-0 text-info-text" />
        <span className="rounded bg-info-border/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-info-text">
          Beta
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-info-text">
          Novo Recurso em teste
        </p>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-info-text/90">
        Horários estimados por trajeto teórico. Podem variar com o trânsito. <strong>Ainda</strong>{' '}
        não é previsão em tempo real.
      </p>
    </section>
  );
}
