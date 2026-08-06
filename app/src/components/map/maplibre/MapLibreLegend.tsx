import { AlertTriangle, Clock, ExternalLink, Info, Radio } from 'lucide-react';

const LEGEND_ITEMS = [
  { icon: Radio, label: 'Ao vivo', className: 'text-danger-solid' },
  { icon: Clock, label: 'Estimado', className: 'text-text-secondary' },
  { icon: AlertTriangle, label: 'Posição antiga', className: 'text-warning-solid' },
  {
    icon: ExternalLink,
    label: 'Serviço externo (BHTrans)',
    className: 'text-brand-primary dark:text-brand-accent',
  },
] as const;

/**
 * Legenda acessível do mapa único — distingue posição ao vivo (GPS
 * colaborativo), estimada (horário teórico), antiga (parou de atualizar) e
 * de serviço externo (BHTrans). `<details>` nativo dá colapsar/expandir
 * acessível de graça (teclado + leitor de tela), sem estado React.
 */
export function MapLibreLegend() {
  return (
    <details className="pointer-events-auto absolute bottom-3 left-2 z-(--z-map-controls) rounded-(--shape-sm) border border-card-border bg-card/95 text-text-primary shadow-sm backdrop-blur-sm">
      <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary">
        <Info size={14} aria-hidden="true" />
        <span>Legenda</span>
      </summary>
      <ul
        className="flex flex-col gap-1.5 border-t border-card-border px-3 py-2 text-xs"
        aria-label="Legenda do mapa"
      >
        {LEGEND_ITEMS.map(({ icon: Icon, label, className }) => (
          <li key={label} className="flex items-center gap-2">
            <Icon size={13} aria-hidden="true" className={className} />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
