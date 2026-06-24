import type { Story } from '@ladle/react';
import React from 'react';
import { CardPredio, type PredioInfo } from '@/components/map/maplibre/MapLibrePrediosLayer';
import { CategoriaDia } from '@/types/data.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const predioBasico: PredioInfo = {
  id: 1001,
  nome: 'Instituto de Ciências Exatas',
  longitude: -43.9678,
  latitude: -19.8719,
};

const predioComAmenity: PredioInfo = {
  id: 1002,
  nome: 'Restaurante Universitário Central',
  amenity: 'restaurant',
  longitude: -43.9685,
  latitude: -19.872,
};

const predioComDescricao: PredioInfo = {
  id: 1003,
  nome: 'Biblioteca Central',
  amenity: 'library',
  description: 'Biblioteca central do campus com acervo de mais de 500 mil volumes. Funciona de segunda a sábado, 8h às 22h.',
  longitude: -43.9690,
  latitude: -19.873,
};

const predioHospital: PredioInfo = {
  id: 1004,
  nome: 'Hospital das Clínicas',
  amenity: 'hospital',
  description: 'Hospital universitário de referência regional. Pronto-atendimento 24h.',
  longitude: -43.97,
  latitude: -19.875,
};

const predioAmenityDesconhecida: PredioInfo = {
  id: 1005,
  nome: 'Centro de Pesquisa Avançada',
  amenity: 'research_institute',
  longitude: -43.9695,
  latitude: -19.8715,
};

const predioSemId: PredioInfo = {
  id: '',
  nome: 'Prédio sem ID cadastrado',
  longitude: -43.9678,
  latitude: -19.8719,
};

// ---------------------------------------------------------------------------
// Wrapper de card (imita o bottom sheet do MapLibreView)
// ---------------------------------------------------------------------------

function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '16px' }}>
      <div
        style={{
          borderRadius: '16px 16px 0 0',
          background: 'var(--color-card, #fff)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          border: '1px solid var(--color-card-border, #e5e7eb)',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 16px 6px',
            borderBottom: '1px solid var(--color-card-border, #e5e7eb)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '9999px',
              background: 'var(--color-card-border, #d1d5db)',
            }}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CardPredio — variantes
// ---------------------------------------------------------------------------

export const CardPredioBasico: Story = () => (
  <CardWrapper>
    <CardPredio predio={predioBasico} onClose={() => {}} />
  </CardWrapper>
);
CardPredioBasico.storyName = 'CardPredio — só nome (sem amenity)';

export const CardPredioRestaurante: Story = () => (
  <CardWrapper>
    <CardPredio predio={predioComAmenity} onClose={() => {}} />
  </CardWrapper>
);
CardPredioRestaurante.storyName = 'CardPredio — amenity: restaurante';

export const CardPredioBiblioteca: Story = () => (
  <CardWrapper>
    <CardPredio predio={predioComDescricao} onClose={() => {}} />
  </CardWrapper>
);
CardPredioBiblioteca.storyName = 'CardPredio — amenity: biblioteca + descrição';

export const CardPredioHospital: Story = () => (
  <CardWrapper>
    <CardPredio predio={predioHospital} onClose={() => {}} />
  </CardWrapper>
);
CardPredioHospital.storyName = 'CardPredio — amenity: hospital + descrição';

export const CardPredioResearchInstitute: Story = () => (
  <CardWrapper>
    <CardPredio predio={predioAmenityDesconhecida} onClose={() => {}} />
  </CardWrapper>
);
CardPredioResearchInstitute.storyName = 'CardPredio — amenity mapeada (research_institute)';

export const CardPredioSemId: Story = () => (
  <CardWrapper>
    <CardPredio predio={predioSemId} onClose={() => {}} />
  </CardWrapper>
);
CardPredioSemId.storyName = 'CardPredio — sem id (prédio local sem OSM)';

// ---------------------------------------------------------------------------
// GpsSessionCompletedCard — motivos de encerramento
// ---------------------------------------------------------------------------

// Importamos aqui para testar visualmente os diferentes reasons
// (o componente é interno ao GpsSessionContext, então usamos a versão simplificada)

const STOP_REASON_LABELS: Record<string, string> = {
  terminal: 'Chegou ao terminal!',
  saiu_rota: 'Encerrado: você saiu do trajeto',
  parado: 'Encerrado: sem movimento por 5 min',
  timeout: 'Encerrado: limite de 1 hora atingido',
  manual: 'Rastreio encerrado',
};

function CompletedSessionPreview({
  stopReason,
  distanceKm = 3.4,
  durationMs = 18 * 60 * 1000,
  snapshotsCount = 120,
}: {
  stopReason: string;
  distanceKm?: number;
  durationMs?: number;
  snapshotsCount?: number;
}) {
  const reasonLabel = STOP_REASON_LABELS[stopReason] ?? 'Rastreio encerrado';
  const isAutoStop = stopReason !== 'manual';
  const pontosEstimados = Math.max(1, Math.floor(snapshotsCount / 2));
  const totalS = Math.floor(durationMs / 1000);
  const h = Math.floor(totalS / 3600);
  const m = Math.floor((totalS % 3600) / 60);
  const durationLabel = h > 0 ? `${h}h ${m}min` : `${m}min`;

  return (
    <div style={{ maxWidth: '240px', margin: '16px auto' }}>
      <div
        style={{
          borderRadius: '16px',
          border: '1px solid var(--color-success-border, #d1fae5)',
          background: 'var(--color-card, #fff)',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#1D6FA422',
              color: '#1D6FA4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            🚌
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success-text, #065f46)', margin: 0 }}>
              {reasonLabel}
            </p>
            <p style={{ fontSize: '10px', color: 'var(--color-text-secondary, #6b7280)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Campus — Reitoria
            </p>
          </div>
        </div>

        {isAutoStop && (
          <p style={{
            marginBottom: '8px',
            padding: '6px 10px',
            borderRadius: '8px',
            background: 'var(--color-background-secondary, #f3f4f6)',
            fontSize: '10px',
            color: 'var(--color-text-secondary, #6b7280)',
          }}>
            O rastreio foi encerrado automaticamente.
          </p>
        )}

        <div style={{ height: '1px', background: 'var(--color-card-border, #e5e7eb)', marginBottom: '12px' }} />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
          {[
            { label: 'Duração', value: durationLabel },
            { label: 'Distância', value: `${distanceKm.toFixed(2)} km` },
            { label: 'Pontos', value: `~${pontosEstimados}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                borderRadius: '8px',
                background: 'var(--color-background-secondary, #f3f4f6)',
                padding: '6px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '9px', color: 'var(--color-text-tertiary, #9ca3af)', margin: '0 0 2px' }}>{label}</p>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-primary, #111827)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '10px', color: 'var(--color-text-secondary, #6b7280)', textAlign: 'center', margin: 0 }}>
          ❤️ Obrigado por ajudar a comunidade!
        </p>
      </div>
    </div>
  );
}

export const SessionCompletedManual: Story = () => (
  <CompletedSessionPreview stopReason="manual" />
);
SessionCompletedManual.storyName = 'SessionCompleted — encerrado manualmente';

export const SessionCompletedTerminal: Story = () => (
  <CompletedSessionPreview stopReason="terminal" distanceKm={5.2} durationMs={28 * 60 * 1000} />
);
SessionCompletedTerminal.storyName = 'SessionCompleted — chegou ao terminal';

export const SessionCompletedSaiuRota: Story = () => (
  <CompletedSessionPreview stopReason="saiu_rota" distanceKm={1.1} durationMs={7 * 60 * 1000} snapshotsCount={40} />
);
SessionCompletedSaiuRota.storyName = 'SessionCompleted — saiu do trajeto';

export const SessionCompletedParado: Story = () => (
  <CompletedSessionPreview stopReason="parado" distanceKm={2.8} durationMs={22 * 60 * 1000} snapshotsCount={90} />
);
SessionCompletedParado.storyName = 'SessionCompleted — parado por 5 min';

export const SessionCompletedTimeout: Story = () => (
  <CompletedSessionPreview stopReason="timeout" distanceKm={8.1} durationMs={60 * 60 * 1000} snapshotsCount={600} />
);
SessionCompletedTimeout.storyName = 'SessionCompleted — timeout (1 hora)';
