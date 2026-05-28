/**
 * Componente de controles do usuário no mapa.
 *
 * Renderiza:
 * - Marcador de localização do usuário com cone direcional
 * - FAB (Floating Action Button) para centralizar no usuário
 *
 * IMPORTANTE: Este componente DEVE ser renderizado dentro de <MapContainer>
 * para que o hook useMap() funcione corretamente.
 */

import L from 'leaflet';
import { CornerUpLeft, LoaderCircle, LocateFixed, Radio, Square } from 'lucide-react';
import { Marker, useMap } from 'react-leaflet';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import { CAMPUS_DISPLAY_NAME, COORDENADAS_CAMPUS } from '@/hooks/useLocalizacaoUsuario';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/utils';

interface ControlesUsuarioMapaProps {
  /** Coordenadas atuais do usuário [lat, lng] */
  localizacao: [number, number] | null;
  /** Direção da bússola em graus (0 = Norte) */
  heading: number | null;
  /** Se a permissão de GPS foi concedida */
  permissaoConcedida: boolean;
  /** Callback para abrir o modal de permissão */
  onPedirLocalizacao: () => void;
  /** Se está carregando a localização no momento */
  carregandoLocalizacao?: boolean;
  rastreioColaborativo?: GpsTrackingState;
  onAlternarRastreioColaborativo?: () => void;
}

/**
 * Cria o ícone customizado do marcador do usuário.
 * Bolinha azul com cone direcional semitransparente.
 */
function criarIconeUsuario(heading: number | null): L.DivIcon {
  // Rotação do cone (0 = apontando para cima/Norte)
  const rotacao = heading !== null ? heading : 0;
  const mostrarCone = heading !== null;

  const html = `
    <div class="user-location-marker" style="position: relative; width: 40px; height: 40px;">
      ${
        mostrarCone
          ? `
        <div 
          class="direction-cone"
          style="
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%) rotate(${rotacao}deg);
            transform-origin: center bottom;
            width: 0;
            height: 0;
            border-left: 14px solid transparent;
            border-right: 14px solid transparent;
            border-bottom: 36px solid var(--color-info-border);
            opacity: 0.35;
            filter: blur(1px);
            pointer-events: none;
          "
        ></div>
      `
          : ''
      }
      <div 
        class="user-dot"
        style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: var(--color-brand-primary);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px var(--color-backdrop);
        "
      ></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'user-location-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

/**
 * Componente de controles do usuário no mapa.
 * Deve ser usado dentro de <MapContainer>.
 */
export function ControlesUsuarioMapa({
  localizacao,
  heading,
  permissaoConcedida,
  onPedirLocalizacao,
  carregandoLocalizacao = false,
  rastreioColaborativo,
  onAlternarRastreioColaborativo,
}: ControlesUsuarioMapaProps) {
  const analytics = useAnalytics();
  const map = useMap();
  const statusRastreio = rastreioColaborativo?.status ?? 'idle';
  const rastreioAtivo = Boolean(rastreioColaborativo?.isActive);

  const textoRastreio =
    statusRastreio === 'active'
      ? `Rastreio ativo · coleta a cada ${Math.round((rastreioColaborativo?.nextCollectionIntervalMs ?? 0) / 1000)}s`
      : statusRastreio === 'starting'
        ? 'Iniciando rastreio colaborativo'
        : statusRastreio === 'paused'
          ? `Rastreio pausado · ${rastreioColaborativo?.queueSize ?? 0} ponto(s) na fila offline`
          : statusRastreio === 'error'
            ? 'Rastreio indisponível no momento'
            : 'Rastreio colaborativo inativo';

  /**
   * Centraliza o mapa no campus principal configurado para o tenant.
   */
  const handleCentralizarCampus = () => {
    map.flyTo(COORDENADAS_CAMPUS, 15, { duration: 1 });
  };

  /**
   * Centraliza o mapa na localização do usuário
   */
  const handleCentralizar = () => {
    analytics.trackEvent({
      category: 'map_interaction',
      action: 'click_gps',
    });

    if (!permissaoConcedida) {
      onPedirLocalizacao();
      return;
    }

    if (localizacao) {
      map.flyTo(localizacao, 17, {
        duration: 1,
      });
    }
  };

  return (
    <>
      {/* Marcador de localização do usuário */}
      {localizacao && (
        <Marker
          position={localizacao}
          icon={criarIconeUsuario(heading)}
          interactive={false}
          zIndexOffset={1000}
        />
      )}

      {/* FABs - coluna vertical alinhada acima da BottomNav mobile */}
      <div className="pointer-events-none fixed bottom-24 right-4 z-1000 flex flex-col items-end gap-2 [margin-bottom:env(safe-area-inset-bottom)] md:bottom-6 md:[margin-bottom:0]">
        {rastreioColaborativo && onAlternarRastreioColaborativo ? (
          <button
            type="button"
            onClick={onAlternarRastreioColaborativo}
            aria-pressed={rastreioAtivo}
            aria-label={
              rastreioAtivo
                ? `Encerrar ${rastreioColaborativo.label}. ${textoRastreio}`
                : `Iniciar ${rastreioColaborativo.label}. ${textoRastreio}`
            }
            title={`${rastreioColaborativo.label} · ${textoRastreio}`}
            className={cn(
              'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
              rastreioAtivo
                ? 'bg-success-border text-white hover:bg-success-border/90'
                : 'bg-card text-text-primary ring-1 ring-card-border hover:bg-card-hover',
            )}
          >
            {rastreioAtivo ? (
              <Square className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Radio className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleCentralizarCampus}
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95',
            'bg-card text-text-primary ring-1 ring-card-border hover:bg-card-hover',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          )}
          aria-label={`Centralizar mapa em ${CAMPUS_DISPLAY_NAME}`}
          title={`Centralizar mapa em ${CAMPUS_DISPLAY_NAME}`}
        >
          <CornerUpLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={handleCentralizar}
          disabled={carregandoLocalizacao}
          aria-busy={carregandoLocalizacao}
          className={cn(
            'pointer-events-auto flex h-12 w-12 cursor-pointer items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95',
            'bg-brand-primary text-white hover:bg-brand-primary/90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
            'disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100',
          )}
          aria-label={
            carregandoLocalizacao
              ? 'Buscando localização...'
              : permissaoConcedida
                ? 'Centralizar mapa na minha localização'
                : 'Ativar localização'
          }
          title={
            carregandoLocalizacao
              ? 'Buscando localização...'
              : permissaoConcedida
                ? 'Centralizar mapa na minha localização'
                : 'Ativar localização'
          }
        >
          {carregandoLocalizacao ? (
            <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </>
  );
}
