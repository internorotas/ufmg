import { Info } from 'lucide-react';

export function DisclaimerEstimativa() {
  return (
    <section
      className="rounded-lg border border-info-border/60 bg-info-bg/80 p-2.5"
      aria-label="Aviso sobre estimativas de chegada"
    >
      <div className="flex items-center gap-1.5">
        <Info className="h-4 w-4 shrink-0 text-info-text" aria-hidden="true" />
        <span className="rounded bg-info-border/40 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-info-text">
          Beta
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-info-text">
          Novo recurso em teste
        </p>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-info-text">
        Horários estimados por trajeto teórico. Podem variar com o trânsito. <strong>Ainda</strong>{' '}
        não é previsão em tempo real.
      </p>
    </section>
  );
}
