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
import { useAnalytics } from '../hooks/useAnalytics';
import { COORDENADAS_UFMG } from '../hooks/useLocalizacaoUsuario';
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
   * Centraliza o mapa no campus da UFMG
   */
  const handleCentralizarUFMG = () => {
    map.flyTo(COORDENADAS_UFMG, 15, { duration: 1 });
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

      {/* FABs - Floating Action Buttons */}
      <div className="fixed bottom-6 right-4 z-1000 flex flex-col gap-2 md:bottom-6">
        {rastreioColaborativo && onAlternarRastreioColaborativo ? (
          <button
            type="button"
            onClick={onAlternarRastreioColaborativo}
            aria-pressed={rastreioAtivo}
            className={cn(
              'flex min-h-11 min-w-11 max-w-64 items-center gap-2 rounded-full px-4 py-3 text-left shadow-lg transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
              rastreioAtivo
                ? 'bg-success-bg text-success-text hover:bg-success-bg/90'
                : 'bg-background text-text-primary hover:bg-card-hover',
            )}
            title={rastreioColaborativo.label}
          >
            {rastreioAtivo ? (
              <Square className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{rastreioColaborativo.label}</span>
              <span className="block text-[11px] opacity-80">{textoRastreio}</span>
            </span>
          </button>
        ) : null}

        {/* Botão: centralizar no campus UFMG */}
        <button
          type="button"
          onClick={handleCentralizarUFMG}
          className={cn(
            'flex h-12 w-12 cursor-pointer items-center justify-center',
            'rounded-full shadow-lg transition-all duration-200',
            'bg-brand-primary hover:bg-brand-primary/90 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
          )}
          aria-label="Centralizar mapa no campus UFMG"
          title="Centralizar mapa no campus UFMG"
        >
          <CornerUpLeft className="h-6 w-6 text-white" aria-hidden="true" />
        </button>

        {/* Botão: centralizar na localização do usuário */}
        <button
          type="button"
          onClick={handleCentralizar}
          disabled={carregandoLocalizacao}
          aria-busy={carregandoLocalizacao}
          className={cn(
            // Tamanho mínimo para touch (48x48px) - Mobile friendly
            'flex h-12 w-12 cursor-pointer items-center justify-center',
            // Estilo visual - Azul brand igual ao botão Ver Linhas
            'rounded-full shadow-lg transition-all duration-200',
            'bg-brand-primary hover:bg-brand-primary/90 active:scale-95',
            // Focus state para acessibilidade
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
            <LoaderCircle className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-6 w-6 text-white" aria-hidden="true" />
          )}
        </button>
      </div>
    </>
  );
}
