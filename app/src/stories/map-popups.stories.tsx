/**
 * Stories for map popup cards:
 * - BhtransCard — popup ao clicar em ônibus BHTrans ao vivo
 * - BusMarkerPopup — popup ao clicar em ônibus UFMG teórico
 *
 * Estes são os cards exibidos nos popups do mapa. Não requerem backend rodando.
 */

import type { Story } from '@ladle/react';
import React from 'react';
import { BusMarkerPopup } from '@/components/map/maplibre/MapLibreAllBusMarkers';
import { BhtransCard } from '@/components/map/maplibre/MapLibreBhtransMarkers';
import type { PosicaoTeorica } from '@/lib/busPosition';
import type { Linha } from '@/types/data.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date().toISOString();
const AGO_40S = new Date(Date.now() - 40_000).toISOString();
const AGO_2MIN = new Date(Date.now() - 120_000).toISOString();

const linhaCircularCampi: Linha = {
  idRota: 'CIRC1',
  linha: 1,
  nome: 'Circular Campi',
  tipo: 'circular',
  sublinha: null,
  categoriaDia: 'diasUteis',
  corHex: '#1D6FA4',
  descricao: 'Circular pelos campi da UFMG',
  horarios: ['07:00', '07:20', '07:40', '08:00', '19:20', '19:40'],
  itinerarioParadasIds: [],
  coordenadasTrajeto: [],
};

const linhaReitoriaSaude: Linha = {
  idRota: 'RS2',
  linha: 2,
  nome: 'Reitoria / Saúde',
  tipo: 'regular',
  sublinha: 'Via Medicina',
  categoriaDia: 'diasUteis',
  corHex: '#e74c3c',
  descricao: 'Da Reitoria até a Faculdade de Medicina',
  horarios: ['07:10', '07:30', '07:50'],
  itinerarioParadasIds: [],
  coordenadasTrajeto: [],
};

const linhaFerias: Linha = {
  idRota: 'FER5',
  linha: 5,
  nome: 'Campus Especial',
  tipo: 'regular',
  sublinha: 'Férias e Recessos',
  categoriaDia: 'feriasRecessos',
  corHex: '#8e44ad',
  descricao: 'Operação em férias',
  horarios: ['08:00', '12:00', '18:00'],
  itinerarioParadasIds: [],
  coordenadasTrajeto: [],
};

const posicaoInicio: PosicaoTeorica = {
  lat: -19.871,
  lng: -43.967,
  heading: 45,
  horarioSaida: '19:20',
  elapsedMin: 3,
};

const posicaoMeio: PosicaoTeorica = {
  lat: -19.873,
  lng: -43.969,
  heading: 180,
  horarioSaida: '07:00',
  elapsedMin: 17,
};

const posicaoLonga: PosicaoTeorica = {
  lat: -19.875,
  lng: -43.97,
  heading: 270,
  horarioSaida: '06:40',
  elapsedMin: 48,
};

// ---------------------------------------------------------------------------
// Wrapper — imita o popup do MapLibre
// ---------------------------------------------------------------------------

function PopupWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 flex-wrap p-6">
      <div
        className="rounded shadow-lg border border-card-border bg-card overflow-hidden"
        style={{ minWidth: 220, maxWidth: 260 }}
      >
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BhtransCard — popup do ônibus BHTrans ao vivo
// ---------------------------------------------------------------------------

export const BhtransMOVE: Story = () => (
  <PopupWrapper>
    <BhtransCard
      linhaId="64"
      nome="SAO GERALDO / PAMPULHA VIA MOVE"
      vehicleId="18432"
      recordedAt={AGO_40S}
      fetchedAt={NOW}
    />
  </PopupWrapper>
);
BhtransMOVE.storyName = 'BhtransCard — MOVE (linha 64)';

export const BhtransBHComum: Story = () => (
  <PopupWrapper>
    <BhtransCard
      linhaId="9502"
      nome="SAO GERALDO/SAO FRANCISCO VIA ESPLANADA"
      vehicleId="11164"
      recordedAt={AGO_40S}
      fetchedAt={NOW}
    />
  </PopupWrapper>
);
BhtransBHComum.storyName = 'BhtransCard — BH Comum (linha 9502)';

export const BhtransSuplem: Story = () => (
  <PopupWrapper>
    <BhtransCard
      linhaId="S53"
      nome="PAMPULHA / CENTRO VIA SUPLEMENTAR"
      vehicleId="7892"
      recordedAt={AGO_2MIN}
      fetchedAt={AGO_40S}
    />
  </PopupWrapper>
);
BhtransSuplem.storyName = 'BhtransCard — Suplementar (S53, GPS antigo)';

export const BhtransSemNome: Story = () => (
  <PopupWrapper>
    <BhtransCard linhaId="9550" nome="" vehicleId="3301" recordedAt={AGO_40S} fetchedAt={null} />
  </PopupWrapper>
);
BhtransSemNome.storyName = 'BhtransCard — sem itinerário, sem fetchedAt';

export const BhtransDesconhecida: Story = () => (
  <PopupWrapper>
    <BhtransCard
      linhaId="9999"
      nome="LINHA NAO MAPEADA / TERMINUS"
      vehicleId="0001"
      recordedAt={AGO_2MIN}
      fetchedAt={NOW}
    />
  </PopupWrapper>
);
BhtransDesconhecida.storyName = 'BhtransCard — linha desconhecida (fallback cinza)';

export const BhtransTodas: Story = () => (
  <div className="flex flex-wrap gap-4 p-6">
    {(
      [
        { linhaId: '64', nome: 'PAMPULHA / SAVASSI', vehicleId: '11001' },
        { linhaId: '9502', nome: 'SAO GERALDO / SAO FRANCISCO', vehicleId: '11164' },
        { linhaId: '9550', nome: 'PAMPULHA / LAGOINHA', vehicleId: '22340' },
        { linhaId: 'S53', nome: 'CAMPUS / CENTRO VIA SUPLEMENTAR', vehicleId: '7892' },
        { linhaId: 'S56', nome: 'PAMPULHA / BARREIRO', vehicleId: '5512' },
      ] as const
    ).map(({ linhaId, nome, vehicleId }) => (
      <div
        key={linhaId}
        className="rounded shadow-lg border border-card-border bg-card overflow-hidden"
        style={{ minWidth: 220, maxWidth: 260 }}
      >
        <BhtransCard
          linhaId={linhaId}
          nome={nome}
          vehicleId={vehicleId}
          recordedAt={AGO_40S}
          fetchedAt={NOW}
        />
      </div>
    ))}
  </div>
);
BhtransTodas.storyName = 'BhtransCard — todas as variantes juntas';

// ---------------------------------------------------------------------------
// BusMarkerPopup — popup do ônibus UFMG teórico
// ---------------------------------------------------------------------------

export const BusUFMGInicio: Story = () => (
  <PopupWrapper>
    <BusMarkerPopup
      linha={linhaCircularCampi}
      pos={posicaoInicio}
      onVerLinha={() => alert('Ver linha')}
    />
  </PopupWrapper>
);
BusUFMGInicio.storyName = 'BusMarkerPopup — início de rota (3 min)';

export const BusUFMGMeio: Story = () => (
  <PopupWrapper>
    <BusMarkerPopup
      linha={linhaReitoriaSaude}
      pos={posicaoMeio}
      onVerLinha={() => alert('Ver linha')}
    />
  </PopupWrapper>
);
BusUFMGMeio.storyName = 'BusMarkerPopup — com sublinha, meio da rota (17 min)';

export const BusUFMGLongo: Story = () => (
  <PopupWrapper>
    <BusMarkerPopup linha={linhaFerias} pos={posicaoLonga} onVerLinha={() => alert('Ver linha')} />
  </PopupWrapper>
);
BusUFMGLongo.storyName = 'BusMarkerPopup — sublinha férias, rota longa (48 min)';

export const BusUFMGInterativo: Story = () => {
  const [clicked, setClicked] = React.useState(false);
  return (
    <div className="p-6 space-y-3">
      <PopupWrapper>
        <BusMarkerPopup
          linha={linhaCircularCampi}
          pos={posicaoInicio}
          onVerLinha={() => setClicked(true)}
        />
      </PopupWrapper>
      {clicked && (
        <p className="text-sm text-brand-primary font-medium px-2">
          ✓ "Ver esta linha" clicado — linha seria selecionada no mapa
        </p>
      )}
    </div>
  );
};
BusUFMGInterativo.storyName = 'BusMarkerPopup — interativo (clique "Ver esta linha")';

// ---------------------------------------------------------------------------
// Comparação lado a lado — BHTrans vs UFMG
// ---------------------------------------------------------------------------

export const ComparacaoPopups: Story = () => (
  <div className="p-6 flex flex-wrap gap-8">
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        BHTrans (ao vivo)
      </p>
      <div
        className="rounded shadow-lg border border-card-border bg-card overflow-hidden"
        style={{ minWidth: 220 }}
      >
        <BhtransCard
          linhaId="9502"
          nome="SAO GERALDO/SAO FRANCISCO VIA ESPLANADA"
          vehicleId="11164"
          recordedAt={AGO_40S}
          fetchedAt={NOW}
        />
      </div>
    </div>
    <div className="space-y-2">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        UFMG (estimativa)
      </p>
      <div
        className="rounded shadow-lg border border-card-border bg-card overflow-hidden"
        style={{ minWidth: 220 }}
      >
        <BusMarkerPopup linha={linhaCircularCampi} pos={posicaoInicio} onVerLinha={() => {}} />
      </div>
    </div>
  </div>
);
ComparacaoPopups.storyName = 'Comparação — BHTrans vs UFMG (design padronizado)';
