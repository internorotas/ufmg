/**
 * Stories para componentes de trânsito: LineCard e PrevisaoBadge
 * Design System - Interno Rotas UFMG
 */

import type { Story } from '@ladle/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import '@/i18n';
import { LineCard } from '@/components/LineCard';
import { PrevisaoBadge } from '@/components/PrevisaoBadge';
import type { Linha } from '@/types/data.types';
import { CategoriaDia } from '@/types/data.types';

// ---------------------------------------------------------------------------
// Query Client para stories isoladas
// ---------------------------------------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: Infinity },
    mutations: { retry: false },
  },
});

function WithQuery({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// ---------------------------------------------------------------------------
// Fixtures — dados realistas em português
// ---------------------------------------------------------------------------

const linhaCircular: Linha = {
  idRota: 'circular-campus',
  linha: 1,
  nome: 'Circular Campus',
  tipo: 'circular',
  sublinha: null,
  categoriaDia: CategoriaDia.DiasUteis,
  corHex: '#1565C0',
  descricao: 'Conecta os blocos principais do campus UFMG',
  horarios: [
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
  ],
  itinerarioParadasIds: ['p-reitoria', 'p-icex', 'p-fafich', 'p-medicina', 'p-engenharia'],
  trajetoDetalhado: [
    { idParada: 'p-reitoria', tempoDoAnteriorMinutos: 0 },
    { idParada: 'p-icex', tempoDoAnteriorMinutos: 5 },
    { idParada: 'p-fafich', tempoDoAnteriorMinutos: 4 },
    { idParada: 'p-medicina', tempoDoAnteriorMinutos: 6 },
    { idParada: 'p-engenharia', tempoDoAnteriorMinutos: 7 },
  ],
  coordenadasTrajeto: [
    [-19.8699, -43.9678],
    [-19.8712, -43.9692],
    [-19.8725, -43.971],
  ],
};

const linhaSabado: Linha = {
  idRota: 'expresso-sabado',
  linha: 5,
  nome: 'Expresso Pampulha',
  tipo: 'expresso',
  sublinha: 'Via Lagoa da Pampulha',
  categoriaDia: CategoriaDia.Sabado,
  corHex: '#E65100',
  descricao: 'Linha expressa para a região da Pampulha aos sábados',
  horarios: [
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ],
  itinerarioParadasIds: ['p-central', 'p-pampulha', 'p-aeroporto'],
  trajetoDetalhado: [
    { idParada: 'p-central', tempoDoAnteriorMinutos: 0 },
    { idParada: 'p-pampulha', tempoDoAnteriorMinutos: 15 },
    { idParada: 'p-aeroporto', tempoDoAnteriorMinutos: 10 },
  ],
  coordenadasTrajeto: [
    [-19.88, -43.95],
    [-19.86, -43.97],
  ],
};

const linhaFerias: Linha = {
  idRota: 'ferias-especial',
  linha: 9,
  nome: 'Especial Férias',
  tipo: 'especial',
  sublinha: 'Período de Recesso',
  categoriaDia: CategoriaDia.FeriasERecessos,
  corHex: '#6A1B9A',
  descricao: 'Linha especial que opera apenas durante férias e recessos',
  horarios: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
  itinerarioParadasIds: ['p-reitoria', 'p-biblioteca', 'p-ru'],
  trajetoDetalhado: [
    { idParada: 'p-reitoria', tempoDoAnteriorMinutos: 0 },
    { idParada: 'p-biblioteca', tempoDoAnteriorMinutos: 8 },
    { idParada: 'p-ru', tempoDoAnteriorMinutos: 5 },
  ],
  coordenadasTrajeto: [
    [-19.8699, -43.9678],
    [-19.871, -43.969],
  ],
};

const linhaVerde: Linha = {
  idRota: 'verde-botanico',
  linha: 3,
  nome: 'Verde Jardim Botânico',
  tipo: 'convencional',
  sublinha: null,
  categoriaDia: CategoriaDia.DiasUteis,
  corHex: '#2E7D32',
  descricao: 'Linha que conecta o campus ao Jardim Botânico',
  horarios: [
    '06:15',
    '07:15',
    '08:15',
    '09:15',
    '10:15',
    '11:15',
    '12:15',
    '13:15',
    '14:15',
    '15:15',
    '16:15',
    '17:15',
    '18:15',
    '19:15',
    '20:15',
  ],
  itinerarioParadasIds: ['p-reitoria', 'p-botanico', 'p-parque'],
  trajetoDetalhado: [
    { idParada: 'p-reitoria', tempoDoAnteriorMinutos: 0 },
    { idParada: 'p-botanico', tempoDoAnteriorMinutos: 12 },
    { idParada: 'p-parque', tempoDoAnteriorMinutos: 8 },
  ],
  coordenadasTrajeto: [
    [-19.8699, -43.9678],
    [-19.875, -43.96],
  ],
};

const linhaComSubLinha: Linha = {
  ...linhaCircular,
  idRota: 'circular-campus-b',
  nome: 'Circular Campus',
  sublinha: 'Variante B — Via Medicina',
  corHex: '#00796B',
};

// ---------------------------------------------------------------------------
// Wrappers
// ---------------------------------------------------------------------------

const CardWrapper = ({ children }: { children: React.ReactNode }) => (
  <WithQuery>
    <div className="max-w-md p-4 bg-background min-h-screen">{children}</div>
  </WithQuery>
);

// ---------------------------------------------------------------------------
// LineCard stories
// ---------------------------------------------------------------------------

export const LineCardDefault: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaCircular} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardSelected: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaCircular} onClick={() => {}} onDetailsClick={() => {}} isSelected />
  </CardWrapper>
);

export const LineCardNotSelected: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isSelected={false}
    />
  </CardWrapper>
);

export const LineCardFavorited: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaCircular} onClick={() => {}} onDetailsClick={() => {}} isFavorita />
  </CardWrapper>
);

export const LineCardNotFavorited: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita={false}
    />
  </CardWrapper>
);

export const LineCardFavoritedAndSelected: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita
      isSelected
    />
  </CardWrapper>
);

export const LineCardWithSubLinha: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaComSubLinha} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardSaturdayLine: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaSabado} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardVacationLine: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaFerias} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardGreenColor: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaVerde} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardOrangeColor: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaSabado} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardPurpleColor: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaFerias} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardWithParada: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      idParada="p-icex"
    />
  </CardWrapper>
);

export const LineCardWithParadaFavorited: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      idParada="p-icex"
      isFavorita
    />
  </CardWrapper>
);

export const LineCardWithCustomClass: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      className="opacity-75"
    />
  </CardWrapper>
);

export const LineCardInteractiveToggleFavorite: Story = () => {
  const [favorita, setFavorita] = React.useState(false);
  return (
    <CardWrapper>
      <p className="mb-3 text-sm text-text-secondary">
        Estado: {favorita ? 'Favoritada' : 'Não favoritada'} — clique na estrela para alternar
      </p>
      <LineCard
        linha={linhaCircular}
        onClick={() => {}}
        onDetailsClick={() => {}}
        isFavorita={favorita}
        onToggleFavorita={() => setFavorita((prev) => !prev)}
      />
    </CardWrapper>
  );
};

export const LineCardInteractiveSelectToggle: Story = () => {
  const [selected, setSelected] = React.useState(false);
  return (
    <CardWrapper>
      <p className="mb-3 text-sm text-text-secondary">
        Estado: {selected ? 'Selecionado' : 'Não selecionado'} — clique no card para alternar
      </p>
      <LineCard
        linha={linhaCircular}
        onClick={() => setSelected((prev) => !prev)}
        onDetailsClick={() => {}}
        isSelected={selected}
      />
    </CardWrapper>
  );
};

export const LineCardMultipleColors: Story = () => (
  <CardWrapper>
    <LineCard linha={linhaCircular} onClick={() => {}} onDetailsClick={() => {}} />
    <LineCard linha={linhaVerde} onClick={() => {}} onDetailsClick={() => {}} />
    <LineCard linha={linhaSabado} onClick={() => {}} onDetailsClick={() => {}} />
    <LineCard linha={linhaFerias} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const LineCardMixedStates: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isSelected
      isFavorita
    />
    <LineCard
      linha={linhaVerde}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isSelected={false}
      isFavorita={false}
    />
    <LineCard
      linha={linhaSabado}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita
      isSelected={false}
    />
  </CardWrapper>
);

export const LineCardLongName: Story = () => (
  <CardWrapper>
    <LineCard
      linha={{
        ...linhaCircular,
        nome: 'Linha Expresso Integrado Campus — Reitoria ao ICEx via FAFICH e Escola de Engenharia',
        sublinha: 'Serviço Especial com Paradas Adicionais na Medicina e na Veterinária',
      }}
      onClick={() => {}}
      onDetailsClick={() => {}}
    />
  </CardWrapper>
);

export const LineCardNoSchedules: Story = () => (
  <CardWrapper>
    <LineCard
      linha={{
        ...linhaCircular,
        horarios: [],
      }}
      onClick={() => {}}
      onDetailsClick={() => {}}
    />
  </CardWrapper>
);

export const LineCardSingleSchedule: Story = () => (
  <CardWrapper>
    <LineCard
      linha={{
        ...linhaCircular,
        horarios: ['14:00'],
      }}
      onClick={() => {}}
      onDetailsClick={() => {}}
    />
  </CardWrapper>
);

export const LineCardAllCallbacksFired: Story = () => {
  const [log, setLog] = React.useState<string[]>([]);
  const addLog = (msg: string) => setLog((prev) => [...prev.slice(-4), msg]);

  return (
    <CardWrapper>
      <div className="mb-3 rounded bg-background-secondary p-2 font-mono text-xs">
        {log.length === 0 ? (
          <span className="text-text-secondary">Interaja com o card para ver eventos...</span>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="text-text-primary">
              {entry}
            </div>
          ))
        )}
      </div>
      <LineCard
        linha={linhaCircular}
        onClick={(l) => addLog(`onClick: ${l.nome}`)}
        onDetailsClick={(l) => addLog(`onDetailsClick: ${l.nome}`)}
        isFavorita={false}
        onToggleFavorita={(id) => addLog(`onToggleFavorita: ${id}`)}
      />
    </CardWrapper>
  );
};

// ---------------------------------------------------------------------------
// PrevisaoBadge stories
// ---------------------------------------------------------------------------

/**
 * PrevisaoBadge usa useQuery internamente para buscar ETA remoto.
 * Nas stories, o QueryClient global não tem dados mockados, portanto
 * o hook cai no cálculo local baseado nos horários da linha.
 * Para simular estados específicos (chega agora, urgente, etc.) as stories
 * alteram os horários da linha fixture para que o cálculo local produza
 * o estado desejado em relação ao horário atual.
 *
 * Estado "Sem previsão" ocorre quando a linha não tem trajeto detalhado
 * com a parada ou quando não há próximo ônibus calculável.
 */

const BadgeWrapper = ({ children }: { children: React.ReactNode }) => (
  <WithQuery>
    <div className="flex min-h-32 flex-col items-end gap-4 p-6 bg-background">{children}</div>
  </WithQuery>
);

// Linha sem trajeto detalhado — PrevisaoBadge retorna null/sem previsão
const linhaSemTrajeto: Linha = {
  ...linhaCircular,
  idRota: 'sem-trajeto',
  trajetoDetalhado: undefined,
};

// Linha com parada fora do itinerário
const paradaForaDoItinerario = 'p-inexistente';

export const PrevisaoBadgeWithNoData: Story = () => (
  <BadgeWrapper>
    <PrevisaoBadge linha={linhaSemTrajeto} idParada="p-icex" />
  </BadgeWrapper>
);

export const PrevisaoBadgeParadaForaDoItinerario: Story = () => (
  <BadgeWrapper>
    <PrevisaoBadge linha={linhaCircular} idParada={paradaForaDoItinerario} />
  </BadgeWrapper>
);

export const PrevisaoBadgeLinhaIndisponivel: Story = () => (
  <BadgeWrapper>
    {/* Linha de sábado sendo consultada num dia útil — isLineAvailableToday retorna false */}
    <PrevisaoBadge linha={linhaSabado} idParada="p-central" />
  </BadgeWrapper>
);

export const PrevisaoBadgeCompacto: Story = () => (
  <BadgeWrapper>
    <PrevisaoBadge linha={linhaCircular} idParada="p-icex" compacto />
  </BadgeWrapper>
);

export const PrevisaoBadgeCompactoFalse: Story = () => (
  <BadgeWrapper>
    <PrevisaoBadge linha={linhaCircular} idParada="p-icex" compacto={false} />
  </BadgeWrapper>
);

export const PrevisaoBadgeInLinhaCard: Story = () => (
  <CardWrapper>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      idParada="p-icex"
    />
    <LineCard
      linha={linhaVerde}
      onClick={() => {}}
      onDetailsClick={() => {}}
      idParada="p-botanico"
    />
  </CardWrapper>
);

export const PrevisaoBadgeMultipleLines: Story = () => (
  <BadgeWrapper>
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Circular Campus</span>
        <PrevisaoBadge linha={linhaCircular} idParada="p-icex" />
      </div>
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Verde Jardim Botânico</span>
        <PrevisaoBadge linha={linhaVerde} idParada="p-botanico" />
      </div>
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Expresso Pampulha (Sábado)</span>
        <PrevisaoBadge linha={linhaSabado} idParada="p-pampulha" />
      </div>
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Especial Férias</span>
        <PrevisaoBadge linha={linhaFerias} idParada="p-biblioteca" />
      </div>
    </div>
  </BadgeWrapper>
);

export const PrevisaoBadgeMultipleCompacto: Story = () => (
  <BadgeWrapper>
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Circular Campus</span>
        <PrevisaoBadge linha={linhaCircular} idParada="p-icex" compacto />
      </div>
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Verde Jardim Botânico</span>
        <PrevisaoBadge linha={linhaVerde} idParada="p-botanico" compacto />
      </div>
      <div className="flex items-center justify-between rounded border border-card-border bg-card px-3 py-2">
        <span className="text-sm font-medium text-text-primary">Expresso Pampulha (Sábado)</span>
        <PrevisaoBadge linha={linhaSabado} idParada="p-pampulha" compacto />
      </div>
    </div>
  </BadgeWrapper>
);

// ---------------------------------------------------------------------------
// Grouped showcase stories
// ---------------------------------------------------------------------------

export const ShowcaseAllLineCardVariants: Story = () => (
  <CardWrapper>
    <h2 className="mb-4 text-base font-bold text-text-primary">Azul — Dias Úteis</h2>
    <LineCard linha={linhaCircular} onClick={() => {}} onDetailsClick={() => {}} />

    <h2 className="mb-4 mt-6 text-base font-bold text-text-primary">Verde — Dias Úteis</h2>
    <LineCard linha={linhaVerde} onClick={() => {}} onDetailsClick={() => {}} />

    <h2 className="mb-4 mt-6 text-base font-bold text-text-primary">Laranja — Sábado</h2>
    <LineCard linha={linhaSabado} onClick={() => {}} onDetailsClick={() => {}} />

    <h2 className="mb-4 mt-6 text-base font-bold text-text-primary">Roxo — Férias/Recessos</h2>
    <LineCard linha={linhaFerias} onClick={() => {}} onDetailsClick={() => {}} />

    <h2 className="mb-4 mt-6 text-base font-bold text-text-primary">Com Sublinha</h2>
    <LineCard linha={linhaComSubLinha} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

export const ShowcaseLineCardInteractionStates: Story = () => (
  <CardWrapper>
    <h2 className="mb-2 text-base font-bold text-text-primary">Padrão</h2>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita={false}
      isSelected={false}
    />

    <h2 className="mb-2 mt-4 text-base font-bold text-text-primary">Selecionado</h2>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita={false}
      isSelected
    />

    <h2 className="mb-2 mt-4 text-base font-bold text-text-primary">Favoritado</h2>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita
      isSelected={false}
    />

    <h2 className="mb-2 mt-4 text-base font-bold text-text-primary">Selecionado e Favoritado</h2>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      isFavorita
      isSelected
    />
  </CardWrapper>
);

export const ShowcaseLineCardWithEtaBadges: Story = () => (
  <CardWrapper>
    <h2 className="mb-2 text-base font-bold text-text-primary">Com Badge de ETA (parada real)</h2>
    <LineCard
      linha={linhaCircular}
      onClick={() => {}}
      onDetailsClick={() => {}}
      idParada="p-icex"
    />
    <LineCard
      linha={linhaVerde}
      onClick={() => {}}
      onDetailsClick={() => {}}
      idParada="p-botanico"
    />

    <h2 className="mb-2 mt-4 text-base font-bold text-text-primary">Sem Badge de ETA</h2>
    <LineCard linha={linhaCircular} onClick={() => {}} onDetailsClick={() => {}} />
  </CardWrapper>
);

// ---------------------------------------------------------------------------
// Named exports ordering
