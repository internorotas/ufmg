/**
 * Seletor de tile provider para o mapa.
 *
 * Renderiza um botão no canto superior direito do mapa que alterna
 * entre 3 provedores de tiles: CartoDB Voyager, OpenStreetMap e Positron.
 * Preferência salva em localStorage.
 */

import L from 'leaflet';
import { Layers } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import { cn } from '../../lib/utils';

export const TILE_PROVIDERS = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a>',
    label: 'Voyager',
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    label: 'OpenStreetMap',
  },
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a>',
    label: 'Positron',
  },
} as const;

export type TileProviderKey = keyof typeof TILE_PROVIDERS;

const STORAGE_KEY = 'tile-provider';
const DEFAULT_PROVIDER: TileProviderKey = 'voyager';

function getStoredProvider(): TileProviderKey {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in TILE_PROVIDERS) {
      return stored as TileProviderKey;
    }
  } catch {
    // localStorage indisponível
  }
  return DEFAULT_PROVIDER;
}

/**
 * Componente que gerencia a troca de tiles do mapa.
 * Deve ser renderizado dentro de <MapContainer>.
 */
export function TileSwitcher() {
  const map = useMap();
  const [provider, setProvider] = useState<TileProviderKey>(getStoredProvider);
  const [aberto, setAberto] = useState(false);
  const layerRef = useRef<L.TileLayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const aplicarProvider = useCallback((key: TileProviderKey) => {
    const config = TILE_PROVIDERS[key];

    if (layerRef.current) {
      layerRef.current.setUrl(config.url);
      layerRef.current.options.attribution = config.attribution;
    }

    setProvider(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // localStorage indisponível
    }
  }, []);

  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        layerRef.current = layer;
        aplicarProvider(provider);
      }
    });
  }, [map, provider, aplicarProvider]);

  useEffect(() => {
    if (!aberto) return;

    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  return (
    <div ref={containerRef} className="pointer-events-auto absolute top-2 right-2 z-1000">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-label="Trocar camada do mapa"
        aria-expanded={aberto}
        aria-haspopup="listbox"
        title="Camadas do mapa"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-sm neo-brutal transition-all duration-200',
          'bg-card text-text-primary hover:bg-card-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        )}
      >
        <Layers className="h-5 w-5" aria-hidden="true" />
      </button>

      {aberto && (
        <div
          role="listbox"
          aria-label="Selecionar camada do mapa"
          className="absolute right-0 top-12 min-w-[160px] rounded-sm bg-card shadow-(--elevation-3) ring-1 ring-card-border"
        >
          {(Object.keys(TILE_PROVIDERS) as TileProviderKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={provider === key}
              onClick={() => {
                aplicarProvider(key);
                setAberto(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:bg-card-hover',
                provider === key
                  ? 'bg-brand-primary/10 font-semibold text-brand-primary'
                  : 'text-text-primary hover:bg-card-hover',
              )}
            >
              <span
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  provider === key ? 'bg-brand-primary' : 'bg-text-secondary/40',
                )}
              />
              {TILE_PROVIDERS[key].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
