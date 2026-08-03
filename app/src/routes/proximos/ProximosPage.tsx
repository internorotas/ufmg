import { AlertTriangle, Heart, MapPinned, Navigation } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useLocationContext } from '@/contexts/LocationContext';
import { useRotas, useRotasSelection } from '@/contexts/RotasContext';
import { useNearestStopsQuery } from '@/features/transit-data/queries/useNearestStopsQuery';
import { useParadasFavoritas } from '@/hooks/useParadasFavoritas';
import { formatDistanceKm } from '@/lib/formatters';
import { calcularDistanciaKm } from '@/lib/utils';
import type { Parada } from '@/types/data.types';

function ParadaCard({
  parada,
  distanciaKm,
  isFavorita,
  onToggleFavorita,
  onClick,
}: {
  parada: Parada;
  distanciaKm?: number;
  isFavorita: boolean;
  onToggleFavorita: () => void;
  onClick: () => void;
}) {
  return (
    <div className="surface-card flex w-full items-center gap-2 p-4 transition hover:-translate-y-px hover:shadow-(--elevation-2)">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
        aria-label={`Abrir parada ${parada.nome} no mapa`}
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
        {distanciaKm !== undefined && (
          <Badge variant="outline" size="sm" className="shrink-0">
            {formatDistanceKm(distanciaKm)}
          </Badge>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorita();
        }}
        aria-label={
          isFavorita ? `Remover ${parada.nome} dos favoritos` : `Favoritar ${parada.nome}`
        }
        aria-pressed={isFavorita}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <Heart
          size={16}
          aria-hidden="true"
          className={
            isFavorita
              ? 'fill-brand-primary text-brand-primary dark:fill-brand-accent dark:text-brand-accent'
              : ''
          }
        />
      </button>
    </div>
  );
}

export function ProximosPage() {
  const navigate = useNavigate();
  const { selecionarParada } = useRotasSelection();
  const { todasParadas } = useRotas();
  const { localizacao, carregando, iniciarRastreamento } = useLocationContext();
  const { getParadasFavoritas, isFavorita, toggleFavorita } = useParadasFavoritas();

  const paradasFavoritas = getParadasFavoritas(todasParadas ?? []);

  const handleParadaClick = useCallback(
    (parada: Parada) => {
      selecionarParada(parada);
      navigate('/');
    },
    [navigate, selecionarParada],
  );

  const { data: paradas, isLoading, isError, refetch } = useNearestStopsQuery(localizacao);

  return (
    <AppShell title="Próximos" description="Paradas e previsões perto de você">
      <div className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 py-4">
        {/* Seção de favoritas */}
        {paradasFavoritas.length > 0 && (
          <section aria-labelledby="favoritas-heading">
            <h2
              id="favoritas-heading"
              className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text-secondary"
            >
              <Heart
                size={12}
                aria-hidden="true"
                className="text-brand-primary dark:text-brand-accent"
              />
              Paradas favoritas
            </h2>
            <div className="space-y-2">
              {paradasFavoritas.map((parada) => (
                <ParadaCard
                  key={parada.idParada}
                  parada={parada}
                  isFavorita={true}
                  onToggleFavorita={() => toggleFavorita(parada.idParada, parada.nome)}
                  onClick={() => handleParadaClick(parada)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Seção de paradas próximas */}
        <section aria-labelledby="proximas-heading">
          <h2 id="proximas-heading" className="mb-2 text-xs font-semibold text-text-secondary">
            Próximas de você
          </h2>

          {!localizacao ? (
            <EmptyState
              tone="success"
              size="lg"
              icon={<MapPinned size={40} />}
              title={carregando ? 'Obtendo localização...' : 'Localização necessária'}
              description={
                carregando
                  ? 'Aguarde enquanto obtemos sua posição.'
                  : 'Ative sua localização para ver paradas próximas, distância a pé, e previsões em tempo real.'
              }
              action={
                carregando
                  ? undefined
                  : { label: 'Ativar Localização', onClick: () => void iniciarRastreamento() }
              }
            />
          ) : (
            <div className="space-y-2">
              {isLoading && (
                <p className="text-sm text-text-tertiary">Buscando paradas próximas...</p>
              )}

              {isError && (
                <EmptyState
                  tone="danger"
                  icon={<AlertTriangle size={32} />}
                  title="Não foi possível carregar"
                  description="Tente novamente em instantes."
                  action={{ label: 'Tentar novamente', onClick: () => void refetch() }}
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
                const [lat, lng] = localizacao;
                const distanciaKm = calcularDistanciaKm(
                  lat,
                  lng,
                  parada.coordenadas[0],
                  parada.coordenadas[1],
                );

                return (
                  <ParadaCard
                    key={parada.idParada}
                    parada={parada}
                    distanciaKm={distanciaKm}
                    isFavorita={isFavorita(parada.idParada)}
                    onToggleFavorita={() => toggleFavorita(parada.idParada, parada.nome)}
                    onClick={() => handleParadaClick(parada)}
                  />
                );
              })}

              {paradas && paradas.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => void refetch()} fullWidth>
                  Atualizar localização
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
