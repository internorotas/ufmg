import { AlertTriangle, MapPinned, Navigation } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRotasSelection } from '@/contexts/RotasContext';
import { useNearestStopsQuery } from '@/features/transit-data/queries/useNearestStopsQuery';
import { calcularDistanciaKm } from '@/lib/utils';
import type { Parada } from '@/types/data.types';

function formatarDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function ProximosPage() {
  const navigate = useNavigate();
  const { selecionarParada } = useRotasSelection();
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleParadaClick = useCallback(
    (parada: Parada) => {
      selecionarParada(parada);
      navigate('/');
    },
    [navigate, selecionarParada],
  );

  const { data: paradas, isLoading, isError } = useNearestStopsQuery(coords);

  const handleAtivarLocalizacao = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocalização não suportada neste navegador.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setCoords([position.coords.latitude, position.coords.longitude]);
      },
      (error) => {
        setIsLocating(false);
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? 'Permissão de localização negada. Verifique as configurações do navegador.'
            : 'Não foi possível obter sua localização. Tente novamente.',
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  };

  if (!coords) {
    return (
      <AppShell title="Próximos" description="Paradas e previsões perto de você">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-8">
          <EmptyState
            tone="success"
            size="lg"
            icon={<MapPinned size={40} />}
            title="Localização necessária"
            description="Ative sua localização para ver paradas próximas, distância a pé, e previsões em tempo real."
            action={{ label: 'Ativar Localização', onClick: handleAtivarLocalizacao }}
          />
          {isLocating && <p className="mt-2 text-sm text-text-tertiary">Obtendo localização...</p>}
          {geoError && (
            <p className="mt-2 text-sm text-warning-text" role="alert">
              {geoError}
            </p>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Próximos" description="Paradas e previsões perto de você">
      <div className="mx-auto w-full max-w-md flex-1 space-y-3 px-4 py-4">
        {isLoading && <p className="text-sm text-text-tertiary">Buscando paradas próximas...</p>}

        {isError && (
          <EmptyState
            tone="danger"
            icon={<AlertTriangle size={32} />}
            title="Não foi possível carregar"
            description="Tente novamente em instantes."
            action={{ label: 'Tentar novamente', onClick: handleAtivarLocalizacao }}
          />
        )}

        {paradas?.length === 0 && (
          <EmptyState
            tone="neutral"
            icon={<Navigation size={32} />}
            title="Nenhuma parada encontrada"
            description="Não encontramos paradas próximas à sua localização atual."
          />
        )}

        {paradas?.map((parada) => {
          const [lat, lng] = coords;
          const distanciaKm = calcularDistanciaKm(
            lat,
            lng,
            parada.coordenadas[0],
            parada.coordenadas[1],
          );

          return (
            <button
              key={parada.idParada}
              type="button"
              onClick={() => handleParadaClick(parada)}
              className="surface-card flex w-full items-center justify-between gap-3 p-4 text-left transition-all hover:-translate-y-px hover:shadow-(--elevation-2) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-text-primary">{parada.nome}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {parada.linhasAtendidas.slice(0, 4).map((linha) => (
                    <Badge key={linha} variant="primary" size="xs">
                      {linha}
                    </Badge>
                  ))}
                  {parada.linhasAtendidas.length > 4 && (
                    <Badge variant="neutral" size="xs">
                      +{parada.linhasAtendidas.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
              <Badge variant="outline" size="sm" className="shrink-0">
                {formatarDistancia(distanciaKm)}
              </Badge>
            </button>
          );
        })}

        <Button variant="ghost" size="sm" onClick={handleAtivarLocalizacao} fullWidth>
          Atualizar localização
        </Button>
      </div>
    </AppShell>
  );
}
