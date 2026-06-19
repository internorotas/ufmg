import type { Story } from '@ladle/react';
import React from 'react';
import { GpsLinePickerModal } from '@/features/gps/components/GpsLinePickerModal';
import { GpsPositionWarningDialog } from '@/features/gps/components/GpsPositionWarningDialog';
import { GpsTrackingCard } from '@/features/gps/components/GpsTrackingCard';
import type { GpsTrackingState } from '@/features/gps/hooks/useGpsTrackingSession';
import type { CategoriaLinhas, Linha } from '@/types/data.types';
import { CategoriaDia } from '@/types/data.types';
import { StoryContainer } from './StoryContainer';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const linhaCircular: Linha = {
  idRota: 'circular-campus',
  linha: 501,
  nome: 'Campus — Reitoria',
  tipo: 'urbano',
  sublinha: null,
  categoriaDia: CategoriaDia.DiasUteis,
  corHex: '#1D6FA4',
  descricao: 'Linha circular que percorre o campus universitário',
  horarios: ['07:00', '08:00', '09:00', '12:00', '13:00', '17:00', '18:00'],
  itinerarioParadasIds: ['p1', 'p2', 'p3'],
  coordenadasTrajeto: [
    [-19.8719, -43.9678],
    [-19.8725, -43.969],
    [-19.873, -43.9705],
  ],
};

const linhaExpresso: Linha = {
  idRota: 'expresso-reitoria-hospital',
  linha: 502,
  nome: 'Reitoria — Hospital',
  tipo: 'urbano',
  sublinha: 'Via Pampulha',
  categoriaDia: CategoriaDia.DiasUteis,
  corHex: '#D44F27',
  descricao: 'Linha expressa entre Reitoria e Hospital',
  horarios: ['07:30', '09:30', '11:30', '14:30', '16:30'],
  itinerarioParadasIds: ['p2', 'p4', 'p5'],
  coordenadasTrajeto: [
    [-19.8725, -43.969],
    [-19.88, -43.975],
  ],
};

const _linhaExpressoVariante: Linha = {
  idRota: 'expresso-reitoria-hospital-b',
  linha: 502,
  nome: 'Reitoria — Hospital',
  tipo: 'urbano',
  sublinha: 'Via Centro',
  categoriaDia: CategoriaDia.DiasUteis,
  corHex: '#D44F27',
  descricao: 'Linha expressa entre Reitoria e Hospital via Centro',
  horarios: ['07:30', '09:30', '11:30', '14:30', '16:30'],
  itinerarioParadasIds: ['p2', 'p6', 'p5'],
  coordenadasTrajeto: [
    [-19.8725, -43.969],
    [-19.885, -43.98],
  ],
};

const linhaSabado: Linha = {
  idRota: 'sabado-campus',
  linha: 510,
  nome: 'Campus — Estação Central',
  tipo: 'urbano',
  sublinha: null,
  categoriaDia: CategoriaDia.Sabado,
  corHex: '#7C3AED',
  descricao: 'Linha de sábado',
  horarios: ['09:00', '11:00', '14:00'],
  itinerarioParadasIds: ['p1', 'p7'],
  coordenadasTrajeto: [
    [-19.8719, -43.9678],
    [-19.89, -43.99],
  ],
};

const linhaFerias: Linha = {
  idRota: 'ferias-campus',
  linha: 520,
  nome: 'Campus — UFMG Férias',
  tipo: 'urbano',
  sublinha: null,
  categoriaDia: CategoriaDia.FeriasERecessos,
  corHex: '#059669',
  descricao: 'Linha exclusiva de férias',
  horarios: ['08:00', '10:00', '13:00', '16:00'],
  itinerarioParadasIds: ['p1', 'p3'],
  coordenadasTrajeto: [
    [-19.8719, -43.9678],
    [-19.873, -43.9705],
  ],
};

const noop = () => Promise.resolve();

function makeRastreio(overrides: Partial<GpsTrackingState> = {}): GpsTrackingState {
  return {
    label: 'Estou no ônibus agora',
    isActive: true,
    status: 'active',
    sessionId: 'sess-abc123',
    queueSize: 0,
    isSyncing: false,
    nextCollectionIntervalMs: 5000,
    lastStopReason: null,
    distanceKm: 0,
    durationMs: 0,
    snapshotsCount: 0,
    lockedLine: linhaCircular,
    start: noop,
    stop: noop,
    ingestSnapshot: noop,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// GpsTrackingCard — Expanded states
// ---------------------------------------------------------------------------

export const TrackingCardActive: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 7 * 60 * 1000 + 34 * 1000,
        distanceKm: 2.47,
        snapshotsCount: 62,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaCircular}
      speedKmh={28}
      accuracyM={12}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardActive.storyName = 'TrackingCard — Ativo (sinal ótimo, em dia)';

export const TrackingCardStarting: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        status: 'starting',
        durationMs: 0,
        distanceKm: 0,
        snapshotsCount: 0,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaCircular}
      speedKmh={undefined}
      accuracyM={undefined}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardStarting.storyName = 'TrackingCard — Iniciando (spinner)';

export const TrackingCardLongSession: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 1 * 3600 * 1000 + 12 * 60 * 1000 + 8 * 1000,
        distanceKm: 18.35,
        snapshotsCount: 860,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaExpresso}
      speedKmh={45}
      accuracyM={8}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardLongSession.storyName = 'TrackingCard — Sessão longa (> 1h, distância grande)';

export const TrackingCardQueued: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 3 * 60 * 1000 + 12 * 1000,
        distanceKm: 1.12,
        snapshotsCount: 24,
        queueSize: 7,
        isSyncing: false,
      })}
      linha={linhaCircular}
      speedKmh={20}
      accuracyM={38}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardQueued.storyName = 'TrackingCard — Offline com fila pendente (sinal médio)';

export const TrackingCardSyncing: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 5 * 60 * 1000,
        distanceKm: 0.98,
        snapshotsCount: 40,
        queueSize: 0,
        isSyncing: true,
      })}
      linha={linhaCircular}
      speedKmh={15}
      accuracyM={25}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardSyncing.storyName = 'TrackingCard — Sincronizando (spinner fila)';

export const TrackingCardPoorSignal: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 2 * 60 * 1000 + 5 * 1000,
        distanceKm: 0.45,
        snapshotsCount: 14,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaExpresso}
      speedKmh={5}
      accuracyM={87}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardPoorSignal.storyName = 'TrackingCard — Sinal GPS ruim (>50 m)';

export const TrackingCardNoSpeed: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 30 * 1000,
        distanceKm: 0.02,
        snapshotsCount: 2,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaCircular}
      speedKmh={0}
      accuracyM={15}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardNoSpeed.storyName = 'TrackingCard — Sem velocidade (parado)';

export const TrackingCardUnknownAccuracy: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 45 * 1000,
        distanceKm: 0.08,
        snapshotsCount: 6,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaFerias}
      speedKmh={undefined}
      accuracyM={undefined}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardUnknownAccuracy.storyName = 'TrackingCard — Precisão GPS desconhecida';

export const TrackingCardColorVariant: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 10 * 60 * 1000,
        distanceKm: 4.2,
        snapshotsCount: 120,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaSabado}
      speedKmh={32}
      accuracyM={18}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardColorVariant.storyName = 'TrackingCard — Linha roxa (cor variante)';

export const TrackingCardWithSubline: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 6 * 60 * 1000 + 22 * 1000,
        distanceKm: 3.1,
        snapshotsCount: 76,
        queueSize: 0,
        isSyncing: false,
      })}
      linha={linhaExpresso}
      speedKmh={38}
      accuracyM={10}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardWithSubline.storyName = 'TrackingCard — Linha com sublinha';

export const TrackingCardQueueAndSyncing: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 8 * 60 * 1000,
        distanceKm: 2.9,
        snapshotsCount: 96,
        queueSize: 15,
        isSyncing: true,
      })}
      linha={linhaCircular}
      speedKmh={22}
      accuracyM={55}
      isMinimized={false}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardQueueAndSyncing.storyName = 'TrackingCard — Fila + sincronizando simultaneamente';

// ---------------------------------------------------------------------------
// GpsTrackingCard — Minimized states
// ---------------------------------------------------------------------------

export const TrackingCardMinimized: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio({
        durationMs: 7 * 60 * 1000,
        distanceKm: 2.47,
        snapshotsCount: 62,
      })}
      linha={linhaCircular}
      speedKmh={28}
      accuracyM={12}
      isMinimized={true}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardMinimized.storyName = 'TrackingCard — Minimizado (linha azul)';

export const TrackingCardMinimizedOrangeVariant: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio()}
      linha={linhaExpresso}
      speedKmh={35}
      accuracyM={18}
      isMinimized={true}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardMinimizedOrangeVariant.storyName = 'TrackingCard — Minimizado (linha laranja)';

export const TrackingCardMinimizedPurple: Story = () => (
  <div className="relative h-96 bg-background p-4">
    <GpsTrackingCard
      rastreio={makeRastreio()}
      linha={linhaSabado}
      speedKmh={0}
      accuracyM={30}
      isMinimized={true}
      onToggleMinimize={() => undefined}
    />
  </div>
);
TrackingCardMinimizedPurple.storyName = 'TrackingCard — Minimizado (linha roxa)';

// ---------------------------------------------------------------------------
// GpsTrackingCard — Interactive toggle
// ---------------------------------------------------------------------------

export const TrackingCardInteractiveToggle: Story = () => {
  const [minimized, setMinimized] = React.useState(false);
  return (
    <div className="relative h-96 bg-background p-4">
      <p className="mb-2 text-sm text-text-secondary">
        Clique no botão do card para alternar minimizado/expandido
      </p>
      <GpsTrackingCard
        rastreio={makeRastreio({
          durationMs: 4 * 60 * 1000 + 18 * 1000,
          distanceKm: 1.63,
          snapshotsCount: 46,
          queueSize: 0,
          isSyncing: false,
        })}
        linha={linhaCircular}
        speedKmh={24}
        accuracyM={14}
        isMinimized={minimized}
        onToggleMinimize={() => setMinimized((v) => !v)}
      />
    </div>
  );
};
TrackingCardInteractiveToggle.storyName = 'TrackingCard — Toggle interativo expandir/minimizar';

// ---------------------------------------------------------------------------
// GpsPositionWarningDialog
// ---------------------------------------------------------------------------

export const PositionWarningClose: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsPositionWarningDialog
        open={isOpen}
        linha={linhaCircular}
        distanceMeters={450}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
PositionWarningClose.storyName = 'PositionWarning — Distância em metros (450 m)';

export const PositionWarningKm: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsPositionWarningDialog
        open={isOpen}
        linha={linhaExpresso}
        distanceMeters={2300}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
PositionWarningKm.storyName = 'PositionWarning — Distância em quilômetros (2.3 km)';

export const PositionWarningWithSubline: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsPositionWarningDialog
        open={isOpen}
        linha={linhaExpresso}
        distanceMeters={870}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
PositionWarningWithSubline.storyName = 'PositionWarning — Linha com sublinha';

export const PositionWarningNoSubline: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsPositionWarningDialog
        open={isOpen}
        linha={linhaCircular}
        distanceMeters={150}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
PositionWarningNoSubline.storyName = 'PositionWarning — Linha sem sublinha';

export const PositionWarningPurpleLine: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsPositionWarningDialog
        open={isOpen}
        linha={linhaSabado}
        distanceMeters={3100}
        onConfirm={() => setOpen(false)}
        onCancel={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
PositionWarningPurpleLine.storyName = 'PositionWarning — Linha roxa, distância grande';

export const PositionWarningInteractive: Story = () => {
  const [open, setOpen] = React.useState(true);
  const [result, setResult] = React.useState<string | null>(null);

  return (
    <div className="p-4">
      <button
        type="button"
        className="mb-4 rounded bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
        onClick={() => {
          setOpen(true);
          setResult(null);
        }}
      >
        Abrir dialog
      </button>
      {result && (
        <p className="text-sm text-text-secondary">
          Ação escolhida: <strong>{result}</strong>
        </p>
      )}
      <GpsPositionWarningDialog
        open={open}
        linha={linhaCircular}
        distanceMeters={620}
        onConfirm={() => {
          setOpen(false);
          setResult('Contribuir mesmo assim');
        }}
        onCancel={() => {
          setOpen(false);
          setResult('Escolher outra linha');
        }}
      />
    </div>
  );
};
PositionWarningInteractive.storyName = 'PositionWarning — Interativo (confirmar/cancelar)';

export const PositionWarningClosed: Story = () => (
  <div className="p-4">
    <p className="text-sm text-text-secondary">
      Dialog fechado — abaixo não há nenhum overlay visível.
    </p>
    <GpsPositionWarningDialog
      open={false}
      linha={linhaCircular}
      distanceMeters={450}
      onConfirm={() => undefined}
      onCancel={() => undefined}
    />
  </div>
);
PositionWarningClosed.storyName = 'PositionWarning — Fechado (sem overlay)';

// ---------------------------------------------------------------------------
// GpsLinePickerModal — fixtures with active lines
// ---------------------------------------------------------------------------

// The modal filters by isLineActiveNow() which checks real-time schedules.
// To guarantee lines appear, we use horarios that span the full day so at
// least one window is always active.
function makeAlwaysActiveLine(overrides: Partial<Linha>): Linha {
  const horarios: string[] = [];
  for (let h = 0; h < 24; h++) {
    horarios.push(`${String(h).padStart(2, '0')}:00`);
  }
  return {
    idRota: 'fallback',
    linha: 500,
    nome: 'Linha Fallback',
    tipo: 'urbano',
    sublinha: null,
    categoriaDia: CategoriaDia.DiasUteis,
    corHex: '#1D6FA4',
    descricao: '',
    horarios,
    itinerarioParadasIds: [],
    coordenadasTrajeto: [],
    ...overrides,
  };
}

const linhasDataRich: CategoriaLinhas = {
  categoriasDias: [
    {
      id: 1,
      categoriaDia: CategoriaDia.DiasUteis,
      displayName: 'Dias Úteis',
      exibir: true,
      linhas: [
        makeAlwaysActiveLine({
          idRota: 'circ-campus',
          linha: 501,
          nome: 'Campus — Reitoria',
          sublinha: null,
          corHex: '#1D6FA4',
        }),
        makeAlwaysActiveLine({
          idRota: 'exp-a',
          linha: 502,
          nome: 'Reitoria — Hospital',
          sublinha: 'Via Pampulha',
          corHex: '#D44F27',
        }),
        makeAlwaysActiveLine({
          idRota: 'exp-b',
          linha: 502,
          nome: 'Reitoria — Hospital',
          sublinha: 'Via Centro',
          corHex: '#D44F27',
        }),
        makeAlwaysActiveLine({
          idRota: 'int-a',
          linha: 503,
          nome: 'FAFICH — Escola de Engenharia',
          sublinha: null,
          corHex: '#059669',
        }),
        makeAlwaysActiveLine({
          idRota: 'int-b',
          linha: 503,
          nome: 'FAFICH — Escola de Engenharia',
          sublinha: 'Via ICB',
          corHex: '#059669',
        }),
        makeAlwaysActiveLine({
          idRota: 'ext-504',
          linha: 504,
          nome: 'UFMG — Estação Pampulha',
          sublinha: null,
          corHex: '#7C3AED',
        }),
        makeAlwaysActiveLine({
          idRota: 'ext-505',
          linha: 505,
          nome: 'UFMG — Shopping Del Rey',
          sublinha: null,
          corHex: '#B45309',
        }),
        makeAlwaysActiveLine({
          idRota: 'ext-506',
          linha: 506,
          nome: 'Campus — Ouro Preto (UFOP)',
          sublinha: null,
          corHex: '#DC2626',
        }),
      ],
    },
  ],
};

const linhasDataEmpty: CategoriaLinhas = {
  categoriasDias: [
    {
      id: 1,
      categoriaDia: CategoriaDia.DiasUteis,
      displayName: 'Dias Úteis',
      exibir: true,
      linhas: [],
    },
  ],
};

const linhasDataSingleLine: CategoriaLinhas = {
  categoriasDias: [
    {
      id: 1,
      categoriaDia: CategoriaDia.DiasUteis,
      displayName: 'Dias Úteis',
      exibir: true,
      linhas: [
        makeAlwaysActiveLine({
          idRota: 'circ-campus-only',
          linha: 501,
          nome: 'Campus — Reitoria',
          sublinha: null,
          corHex: '#1D6FA4',
        }),
      ],
    },
  ],
};

export const LinePickerOpen: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsLinePickerModal
        open={isOpen}
        onClose={() => setOpen(false)}
        linhasData={linhasDataRich}
        onSelect={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
LinePickerOpen.storyName = 'LinePicker — Aberto com múltiplas linhas';

export const LinePickerSingleLine: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsLinePickerModal
        open={isOpen}
        onClose={() => setOpen(false)}
        linhasData={linhasDataSingleLine}
        onSelect={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
LinePickerSingleLine.storyName = 'LinePicker — Apenas uma linha disponível';

export const LinePickerEmpty: Story = () => (
  <StoryContainer>
    {(isOpen, setOpen) => (
      <GpsLinePickerModal
        open={isOpen}
        onClose={() => setOpen(false)}
        linhasData={linhasDataEmpty}
        onSelect={() => setOpen(false)}
      />
    )}
  </StoryContainer>
);
LinePickerEmpty.storyName = 'LinePicker — Nenhuma linha em operação (vazio)';

export const LinePickerClosed: Story = () => (
  <div className="p-4">
    <p className="text-sm text-text-secondary">Modal fechado — nenhum overlay visível.</p>
    <GpsLinePickerModal
      open={false}
      onClose={() => undefined}
      linhasData={linhasDataRich}
      onSelect={() => undefined}
    />
  </div>
);
LinePickerClosed.storyName = 'LinePicker — Fechado (sem overlay)';

export const LinePickerInteractive: Story = () => {
  const [open, setOpen] = React.useState(true);
  const [selected, setSelected] = React.useState<Linha | null>(null);

  return (
    <div className="p-4">
      <button
        type="button"
        className="mb-4 rounded bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
        onClick={() => setOpen(true)}
      >
        Selecionar linha
      </button>
      {selected && (
        <div className="rounded border border-card-border bg-card p-3">
          <p className="text-sm font-semibold text-text-primary">
            Linha selecionada: {selected.linha} — {selected.nome}
          </p>
          {selected.sublinha && <p className="text-xs text-text-secondary">{selected.sublinha}</p>}
        </div>
      )}
      <GpsLinePickerModal
        open={open}
        onClose={() => setOpen(false)}
        linhasData={linhasDataRich}
        onSelect={(linha) => {
          setSelected(linha);
          setOpen(false);
        }}
      />
    </div>
  );
};
LinePickerInteractive.storyName = 'LinePicker — Interativo (selecionar linha)';

// ---------------------------------------------------------------------------
// Story ordering
