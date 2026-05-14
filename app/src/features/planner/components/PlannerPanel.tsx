/**
 * PlannerPanel — painel de entrada para o planejador de rotas.
 * Embutido no MenuLateral, abaixo da busca e acima das tabs de categoria.
 */

import { ArrowLeftRight, LocateFixed, MapPin, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { tv } from 'tailwind-variants';
import { Button } from '@/components/ui/Button';
import { useRotasData } from '@/contexts/RotasDataContext';
import type { Parada } from '@/types/data.types';
import { usePlannerRoutes } from '../api/usePlannerRoutes';
import { type PlannerEndpoint, type PlannerStop, usePlannerStore } from '../store/plannerStore';
import type { PlannerRoutesResponse } from '../types';
import { PlannerResults } from './PlannerResults';

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

const panelVariants = tv({
  base: 'flex flex-col gap-3 border-b border-card-border bg-background-secondary p-3 lg:p-4',
});

const fieldContainerVariants = tv({
  base: 'flex flex-col gap-0.5',
});

const fieldLabelVariants = tv({
  base: 'px-1 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary',
});

const tokenRowVariants = tv({
  base: [
    'flex min-h-11 items-center gap-2 rounded-lg border',
    'border-card-border bg-card px-3 py-2',
    'text-sm font-semibold text-text-primary',
  ],
});

const suggestionsListVariants = tv({
  base: ['mt-1 max-h-48 overflow-y-auto rounded-lg border border-card-border', 'bg-card shadow-md'],
});

const suggestionItemVariants = tv({
  base: [
    'flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2',
    'text-sm text-text-primary',
    'hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary',
  ],
});

const searchInputVariants = tv({
  base: [
    'min-h-11 w-full rounded-lg border border-input-border bg-input px-3',
    'text-sm text-text-primary placeholder:text-text-tertiary',
    'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary',
  ],
});

const inlineErrorVariants = tv({
  base: 'rounded-md bg-warning-bg px-3 py-2 text-xs font-medium text-warning-text',
});

const normalizeQuery = (q: string) => q.toLowerCase().trim();

// ---------------------------------------------------------------------------
// EndpointField
// ---------------------------------------------------------------------------

interface EndpointFieldProps {
  label: string;
  endpoint: PlannerEndpoint | null;
  searchValue: string;
  isActive: boolean;
  suggestions: Parada[];
  onActivate: () => void;
  onSearch: (q: string) => void;
  onSelect: (parada: Parada) => void;
  onClear: () => void;
  onUseLocation: () => void;
  inputId: string;
}

function EndpointField({
  label,
  endpoint,
  searchValue,
  isActive,
  suggestions,
  onActivate,
  onSearch,
  onSelect,
  onClear,
  onUseLocation,
  inputId,
}: EndpointFieldProps) {
  return (
    <div className={fieldContainerVariants()}>
      <label htmlFor={inputId} className={fieldLabelVariants()}>
        {label}
      </label>

      {endpoint ? (
        <fieldset className={tokenRowVariants()}>
          <legend className="sr-only">{`${label}: ${endpoint.nome}`}</legend>
          {endpoint.kind === 'current-location' ? (
            <LocateFixed size={15} className="shrink-0 text-brand-primary" aria-hidden="true" />
          ) : (
            <MapPin size={15} className="shrink-0 text-text-tertiary" aria-hidden="true" />
          )}
          <span className="min-w-0 flex-1 truncate">{endpoint.nome}</span>
          <button
            type="button"
            onClick={onClear}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={`Remover ${label}`}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </fieldset>
      ) : (
        <div className="flex flex-col gap-1">
          <input
            id={inputId}
            type="search"
            role="combobox"
            className={searchInputVariants()}
            placeholder={`Buscar parada de ${label.toLowerCase()}…`}
            value={searchValue}
            onFocus={onActivate}
            onChange={(e) => onSearch(e.target.value)}
            aria-autocomplete="list"
            aria-expanded={isActive && suggestions.length > 0}
            aria-controls={isActive ? `${inputId}-list` : undefined}
            autoComplete="off"
          />

          <button
            type="button"
            onClick={onUseLocation}
            className="flex min-h-9 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-brand-primary hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <LocateFixed size={13} aria-hidden="true" />
            Minha localização · usar parada mais próxima
          </button>

          {isActive && suggestions.length > 0 && (
            <div
              id={`${inputId}-list`}
              role="listbox"
              aria-label={`Sugestões para ${label}`}
              className={suggestionsListVariants()}
            >
              {suggestions.map((parada) => (
                <button
                  key={parada.idParada}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={suggestionItemVariants()}
                  onClick={() => onSelect(parada)}
                  tabIndex={0}
                >
                  <MapPin size={14} className="shrink-0 text-text-tertiary" aria-hidden="true" />
                  <span className="flex min-w-0 flex-col items-start">
                    <span className="truncate font-medium">{parada.nome}</span>
                    {parada.linhasAtendidas.length > 0 && (
                      <span className="truncate text-[11px] text-text-tertiary">
                        {parada.linhasAtendidas.slice(0, 2).join(' · ')}
                        {parada.linhasAtendidas.length > 2 ? ' …' : ''}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlannerPanel
// ---------------------------------------------------------------------------

export function PlannerPanel() {
  const { todasParadas } = useRotasData();
  const {
    origin,
    destination,
    swap,
    setOrigin,
    setDestination,
    setResults,
    canPlan,
    isSameEndpoint,
  } = usePlannerStore();

  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  const {
    mutate: planRoute,
    isPending,
    isError,
    data: results,
    reset: resetMutation,
  } = usePlannerRoutes();

  useEffect(() => {
    setResults(results ?? null);
  }, [results, setResults]);

  const originInputId = useId();
  const destInputId = useId();

  const originSuggestions = useMemo(() => {
    if (activeField !== 'origin' || originSearch.length < 2) return [];
    const q = normalizeQuery(originSearch);
    return todasParadas.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [activeField, originSearch, todasParadas]);

  const destSuggestions = useMemo(() => {
    if (activeField !== 'destination' || destSearch.length < 2) return [];
    const q = normalizeQuery(destSearch);
    return todasParadas.filter((p) => p.nome.toLowerCase().includes(q)).slice(0, 8);
  }, [activeField, destSearch, todasParadas]);

  const handleSelectForField = (field: 'origin' | 'destination') => (parada: Parada) => {
    const endpoint: PlannerEndpoint = {
      kind: 'stop',
      idParada: parada.idParada,
      nome: parada.nome,
    };
    if (field === 'origin') {
      setOrigin(endpoint);
      setOriginSearch('');
    } else {
      setDestination(endpoint);
      setDestSearch('');
    }
    setActiveField(null);
  };

  const handleUseLocation = (field: 'origin' | 'destination') => () => {
    const endpoint: PlannerEndpoint = {
      kind: 'current-location',
      nome: 'Minha localização',
    };
    if (field === 'origin') {
      setOrigin(endpoint);
      setOriginSearch('');
    } else {
      setDestination(endpoint);
      setDestSearch('');
    }
    setActiveField(null);
  };

  const handleSubmit = () => {
    if (!canPlan()) return;
    const o = origin as PlannerStop;
    const d = destination as PlannerStop;
    resetMutation();
    planRoute({ originStopId: o.idParada, destinationStopId: d.idParada });
  };

  const sameEndpoint = isSameEndpoint();

  return (
    <section className={panelVariants()} aria-label="Planejar rota">
      <div className="flex flex-col gap-2">
        <EndpointField
          label="Origem"
          endpoint={origin}
          searchValue={originSearch}
          isActive={activeField === 'origin'}
          suggestions={originSuggestions}
          onActivate={() => setActiveField('origin')}
          onSearch={setOriginSearch}
          onSelect={handleSelectForField('origin')}
          onClear={() => {
            setOrigin(null);
            setOriginSearch('');
            resetMutation();
          }}
          onUseLocation={handleUseLocation('origin')}
          inputId={originInputId}
        />

        {/* Swap */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => {
              swap();
              resetMutation();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-card-border bg-background hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Trocar origem e destino"
            title="Trocar origem e destino"
          >
            <ArrowLeftRight size={14} aria-hidden="true" />
          </button>
        </div>

        <EndpointField
          label="Destino"
          endpoint={destination}
          searchValue={destSearch}
          isActive={activeField === 'destination'}
          suggestions={destSuggestions}
          onActivate={() => setActiveField('destination')}
          onSearch={setDestSearch}
          onSelect={handleSelectForField('destination')}
          onClear={() => {
            setDestination(null);
            setDestSearch('');
            resetMutation();
          }}
          onUseLocation={handleUseLocation('destination')}
          inputId={destInputId}
        />
      </div>

      {sameEndpoint && (
        <p className={inlineErrorVariants()} role="alert">
          Origem e destino são a mesma parada.
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        fullWidth
        size="lg"
        onClick={handleSubmit}
        disabled={!canPlan() || isPending}
        loading={isPending}
        aria-label="Planejar rota"
      >
        Planejar rota
      </Button>

      {isError && (
        <p className={inlineErrorVariants()} role="alert">
          Não foi possível calcular a rota agora. Tente novamente. Se o problema continuar, escolha
          outra parada próxima ou recarregue o app.
        </p>
      )}

      {results && !isError && <PlannerResults results={results as PlannerRoutesResponse} />}
    </section>
  );
}
