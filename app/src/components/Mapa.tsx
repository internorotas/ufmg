/**
 * Componente principal do Mapa.
 *
 * Usa exclusivamente MapLibre GL JS (via react-map-gl) para renderização 2D/3D.
 * O mapa começa plano (pitch=0) e pode ser inclinado por gestos ou pelo botão bússola.
 *
 * Atualizado para React 19: ref como prop (sem forwardRef).
 */

import { Share2, X } from 'lucide-react';
import { type Ref, useCallback, useEffect, useRef, useState } from 'react';
import { useRotasSelection } from '@/contexts/RotasContext';
import type { MapaRef } from '@/contexts/RotasSelectionContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import { useAnalytics } from '../hooks/useAnalytics';
import { buildLinhaShareUrl } from '../lib/shareLinks';
import type { Linha, Parada } from '../types/data.types';
import { LoginBenefitsBanner } from './LoginBenefitsBanner';
import { FavoritasWidget } from './map/FavoritasWidget';
import { MapLibreView } from './map/maplibre';
import { PesquisaParadas } from './map/PesquisaParadas';
import { WeatherChip } from './map/WeatherChip';

// Re-exporta para callers que importam MapaRef de Mapa.tsx
export type { MapaRef };

export interface MapaProps {
  todasParadas: Parada[];
  linhasAtivas: Linha[];
  linhaSelecionada: Linha | null;
  paradaSelecionada: Parada | null;
  /** Coordenadas do usuário [lat, lng] */
  localizacaoUsuario?: [number, number] | null;
  /** Direção da bússola em graus (0 = Norte) */
  headingUsuario?: number | null;
  /** Se a permissão de GPS foi concedida */
  permissaoLocalizacao?: boolean;
  /** Callback para abrir modal de permissão */
  onPedirLocalizacao?: () => void;
  /** Estado de carregamento de geolocalização */
  carregandoLocalizacao?: boolean;
  rastreioColaborativo?: GpsTrackingState;
  onAlternarRastreioColaborativo?: () => void;
  /** Ref para expor métodos do mapa (React 19 - ref como prop) */
  ref?: Ref<MapaRef>;
}

export function Mapa({
  todasParadas,
  linhasAtivas,
  linhaSelecionada,
  paradaSelecionada,
  localizacaoUsuario,
  headingUsuario,
  permissaoLocalizacao = false,
  onPedirLocalizacao,
  carregandoLocalizacao = false,
  rastreioColaborativo,
  onAlternarRastreioColaborativo,
  ref,
}: MapaProps) {
  const { trackTiming, trackEvent } = useAnalytics();
  const { limparSelecao } = useRotasSelection();
  const { isAuthenticated } = useAuthContext();
  const mapLoadStartRef = useRef<number>(0);

  const [compassEnabled, setCompassEnabled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleCompass = useCallback(() => {
    setCompassEnabled((v) => !v);
  }, []);

  useEffect(() => {
    if (mapLoadStartRef.current === 0) {
      mapLoadStartRef.current = Date.now();
    }
    const loadTime = Date.now() - mapLoadStartRef.current;
    trackTiming({
      name: 'map_load_time',
      value: loadTime,
      category: 'navigation',
      label: 'initial_map_render',
    });
  }, [trackTiming]);

  return (
    <div className="relative h-full w-full">
      {/* Pesquisa de paradas — overlay absoluto no topo */}
      <PesquisaParadas
        paradas={todasParadas}
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Chip da linha selecionada — aparece no topo centralizado */}
      {linhaSelecionada && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-2001 flex justify-center px-3">
          <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-card/95 py-1.5 pl-2 pr-1.5 shadow-(--elevation-2) ring-1 ring-card-border backdrop-blur">
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-xs font-extrabold text-white"
              style={{ background: linhaSelecionada.corHex }}
            >
              {linhaSelecionada.nome.replace(/^Linha\s+/i, '').trim() ||
                String(linhaSelecionada.linha)}
            </span>
            <span className="min-w-0 flex flex-col">
              <span className="truncate text-xs font-semibold text-text-primary">
                {linhaSelecionada.nome}
              </span>
              {linhaSelecionada.sublinha && (
                <span className="truncate text-[10px] text-text-secondary leading-tight">
                  {linhaSelecionada.sublinha}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => {
                const text = linhaSelecionada.sublinha
                  ? `${linhaSelecionada.nome} — ${linhaSelecionada.sublinha}`
                  : linhaSelecionada.nome;
                const url = buildLinhaShareUrl(linhaSelecionada.idRota);
                trackEvent({
                  category: 'engagement',
                  action: 'share_line',
                  label: linhaSelecionada.nome,
                });
                if (navigator.share) {
                  void navigator.share({ title: linhaSelecionada.nome, text, url });
                } else {
                  void navigator.clipboard?.writeText(url);
                }
              }}
              aria-label={`Compartilhar linha ${linhaSelecionada.nome}`}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Share2 size={13} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={limparSelecao}
              aria-label="Limpar seleção da linha"
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Chip de clima — canto superior direito, não conflita com busca/chip de linha */}
      <div className="pointer-events-none absolute right-3 top-3 z-1005">
        <WeatherChip />
      </div>

      <MapLibreView
        ref={ref}
        todasParadas={todasParadas}
        linhasAtivas={linhasAtivas}
        linhaSelecionada={linhaSelecionada}
        paradaSelecionada={paradaSelecionada}
        localizacaoUsuario={localizacaoUsuario}
        headingUsuario={headingUsuario}
        compassEnabled={compassEnabled}
        onToggleCompass={toggleCompass}
        permissaoLocalizacao={permissaoLocalizacao}
        onPedirLocalizacao={onPedirLocalizacao}
        carregandoLocalizacao={carregandoLocalizacao}
        rastreioColaborativo={rastreioColaborativo}
        onAlternarRastreioColaborativo={onAlternarRastreioColaborativo}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Widget de paradas favoritas */}
      <FavoritasWidget todasParadas={todasParadas} />

      {!isAuthenticated && <LoginBenefitsBanner />}
    </div>
  );
}
