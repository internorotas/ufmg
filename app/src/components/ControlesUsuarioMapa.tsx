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
import { CornerUpLeft, LocateFixed } from 'lucide-react';
import { Marker, useMap } from 'react-leaflet';
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
            border-left: 15px solid transparent;
            border-right: 15px solid transparent;
            border-bottom: 40px solid rgba(59, 130, 246, 0.3);
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
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
}: ControlesUsuarioMapaProps) {
  const analytics = useAnalytics();
  const map = useMap();

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
        {/* Botão: centralizar no campus UFMG */}
        <button
          type="button"
          onClick={handleCentralizarUFMG}
          className={cn(
            'flex h-12 w-12 items-center justify-center',
            'rounded-full shadow-lg transition-all duration-200',
            'bg-blue-100 hover:bg-blue-200 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
          )}
          aria-label="Centralizar mapa no campus UFMG"
          title="Voltar para a UFMG"
        >
          <CornerUpLeft className="h-6 w-6 text-brand-primary" />
        </button>

        {/* Botão: centralizar na localização do usuário */}
        <button
          type="button"
          onClick={handleCentralizar}
          className={cn(
            // Tamanho mínimo para touch (48x48px) - Mobile friendly
            'flex h-12 w-12 items-center justify-center',
            // Estilo visual - Azul brand igual ao botão Ver Linhas
            'rounded-full shadow-lg transition-all duration-200',
            'bg-brand-primary hover:bg-blue-700 active:scale-95',
            // Focus state para acessibilidade
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
          )}
          aria-label={
            permissaoConcedida ? 'Centralizar mapa na minha localização' : 'Ativar localização'
          }
          title={
            permissaoConcedida ? 'Centralizar mapa na minha localização' : 'Ativar localização'
          }
        >
          <LocateFixed className="h-6 w-6 text-white" />
        </button>
      </div>
    </>
  );
}
