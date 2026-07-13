import { Heart, MapPin } from 'lucide-react';
import { useCallback } from 'react';
import { useRotas, useRotasSelection } from '@/contexts/RotasContext';
import { useParadasFavoritas } from '@/hooks/useParadasFavoritas';
import type { Parada } from '@/types/data.types';

interface FavoritasWidgetProps {
  todasParadas: Parada[];
}

export function FavoritasWidget({ todasParadas }: FavoritasWidgetProps) {
  const { mapaRef } = useRotas();
  const { selecionarParada, paradaSelecionada } = useRotasSelection();
  const { getParadasFavoritas, favoritasIds } = useParadasFavoritas();

  const favoritas = getParadasFavoritas(todasParadas);

  const handleSelect = useCallback(
    (parada: Parada) => {
      selecionarParada(parada);
      mapaRef.current?.centralizarParada(parada);
    },
    [selecionarParada, mapaRef],
  );

  if (favoritasIds.length === 0) return null;

  return (
    <section
      className="pointer-events-none absolute inset-x-0 bottom-0 z-800"
      aria-label="Paradas favoritas"
    >
      <div className="pointer-events-auto overflow-x-auto pb-1 pt-2 px-2">
        <div className="flex gap-2 w-max">
          <span className="flex items-center gap-1 shrink-0 rounded-full bg-card/90 backdrop-blur px-2.5 py-1.5 text-xs font-semibold text-text-secondary ring-1 ring-card-border">
            <Heart size={11} aria-hidden="true" className="text-brand-primary" />
            Favoritas
          </span>
          {favoritas.map((parada) => {
            const isSelected = paradaSelecionada?.idParada === parada.idParada;
            return (
              <button
                key={parada.idParada}
                type="button"
                onClick={() => handleSelect(parada)}
                aria-pressed={isSelected}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isSelected
                    ? 'bg-brand-primary text-white ring-brand-primary'
                    : 'bg-card/90 backdrop-blur text-text-primary ring-card-border hover:bg-card hover:ring-brand-primary'
                }`}
                aria-label={`Ir para parada ${parada.nome}`}
              >
                <MapPin size={11} aria-hidden="true" />
                <span className="max-w-30 truncate">{parada.nome}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
