import { ChevronRight, Radio, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { isLineAvailableToday } from '@/config/specialPeriods';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { CategoriaLinhas, Linha } from '@/types/data.types';

interface GpsLinePickerModalProps {
  open: boolean;
  onClose: () => void;
  linhasData: CategoriaLinhas;
  onSelect: (linha: Linha) => void;
}

interface LinhaGroup {
  numero: number;
  linhas: Linha[];
}

function LineNumberBadge({ numero, corHex }: { numero: number; corHex: string }) {
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
      style={{ backgroundColor: `${corHex}22`, color: corHex }}
      aria-hidden="true"
    >
      {numero}
    </div>
  );
}

function SublinhaRow({ linha, onSelect }: { linha: Linha; onSelect: (l: Linha) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(linha)}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
      aria-label={`Selecionar linha ${linha.linha}${linha.sublinha ? ` — ${linha.sublinha}` : ''}: ${linha.nome}`}
    >
      <LineNumberBadge numero={linha.linha} corHex={linha.corHex} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{linha.nome}</p>
        {linha.sublinha ? (
          <p className="mt-0.5 truncate text-xs text-text-secondary">{linha.sublinha}</p>
        ) : null}
      </div>

      <ChevronRight size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
    </button>
  );
}

function GroupedRow({ group, onSelect }: { group: LinhaGroup; onSelect: (l: Linha) => void }) {
  const first = group.linhas[0];
  const hasVariants = group.linhas.length > 1;

  if (!hasVariants) {
    return first ? <SublinhaRow key={first.idRota} linha={first} onSelect={onSelect} /> : null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: first?.corHex }}
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          Linha {group.numero} — {group.linhas.length} variantes
        </p>
      </div>
      <div
        className="flex flex-col pl-2 border-l-2 ml-3.5"
        style={{ borderColor: `${first?.corHex}40` }}
      >
        {group.linhas.map((linha) => (
          <SublinhaRow key={linha.idRota} linha={linha} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

const ACTIVE_WINDOW_MINUTES = 40;

function getCurrentSaoPauloMinutes(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  return hour * 60 + minute;
}

function isLineActiveNow(linha: Linha): boolean {
  if (!isLineAvailableToday(linha.categoriaDia)) return false;
  if (linha.horarios.length === 0) return false;

  const currentMinutes = getCurrentSaoPauloMinutes();

  return linha.horarios.some((horario) => {
    const parts = horario.split(':');
    if (parts.length !== 2) return false;
    const [h, m] = parts.map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return false;
    const departureMins = h * 60 + m;
    const windowEnd = departureMins + ACTIVE_WINDOW_MINUTES;
    if (windowEnd >= 1440) {
      return currentMinutes >= departureMins || currentMinutes <= windowEnd - 1440;
    }
    return currentMinutes >= departureMins && currentMinutes <= windowEnd;
  });
}

export function GpsLinePickerModal({
  open,
  onClose,
  linhasData,
  onSelect,
}: GpsLinePickerModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { trackEvent } = useAnalytics();

  // Tracking: modal aberto
  useEffect(() => {
    if (open) {
      trackEvent({
        event: 'gps_line_picker_viewed',
        category: 'engagement',
        action: 'gps_line_picker_viewed',
      });
    }
  }, [open, trackEvent]);

  const todasLinhas = useMemo(
    () => linhasData.categoriasDias.flatMap((cat) => cat.linhas).filter(isLineActiveNow),
    [linhasData],
  );

  const filtradas = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return todasLinhas;
    return todasLinhas.filter(
      (l) =>
        l.nome.toLowerCase().includes(q) ||
        String(l.linha).includes(q) ||
        (l.sublinha?.toLowerCase().includes(q) ?? false),
    );
  }, [query, todasLinhas]);

  const grupos = useMemo<LinhaGroup[]>(() => {
    const map = new Map<number, Linha[]>();
    for (const linha of filtradas) {
      const existing = map.get(linha.linha) ?? [];
      map.set(linha.linha, [...existing, linha]);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([numero, linhas]) => ({ numero, linhas }));
  }, [filtradas]);

  const handleSelect = (linha: Linha) => {
    trackEvent({
      event: 'gps_line_selected_from_picker',
      category: 'engagement',
      action: 'gps_line_selected_from_picker',
      label: linha.nome,
      params: { linha_id: linha.idRota },
    });
    onSelect(linha);
    setQuery('');
    onClose();
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      trackEvent({
        event: 'gps_line_picker_cancelled',
        category: 'engagement',
        action: 'gps_line_picker_cancelled',
      });
      setQuery('');
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup
          size="sm"
          className="fixed inset-x-0 bottom-0 top-auto flex max-h-[88dvh] w-full max-w-none flex-col rounded-b-none rounded-t-2xl sm:static sm:max-h-[85vh] sm:max-w-md sm:rounded-xl"
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-card-border bg-background-secondary px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <Radio size={15} aria-hidden="true" />
              </span>
              <div>
                <Dialog.Title className="text-base font-semibold">
                  Qual linha você está?
                </Dialog.Title>
              </div>
            </div>
            <Dialog.Close aria-label="Fechar seleção de linha" className="min-h-11 min-w-11" />
          </header>

          <Dialog.Description className="sr-only">
            Selecione a linha de ônibus que você está utilizando para contribuir com dados de
            localização colaborativa.
          </Dialog.Description>

          {/* Search */}
          <div className="shrink-0 bg-background-secondary px-4 pb-3 pt-2">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                data-autofocus="true"
                placeholder="Buscar por nome, número ou destino…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-input-border bg-input py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label="Buscar linha de ônibus"
              />
            </div>
            {filtradas.length > 0 && (
              <p className="mt-1.5 text-[11px] text-text-tertiary">
                {filtradas.length === 1
                  ? '1 linha disponível'
                  : `${filtradas.length} linhas disponíveis`}
                {' · '}toque para selecionar
              </p>
            )}
          </div>

          {/* List */}
          <div
            className="min-h-0 flex-1 overflow-y-auto bg-background px-2 pb-4"
            role="listbox"
            aria-label="Linhas de ônibus disponíveis"
          >
            {grupos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Search size={28} className="text-text-tertiary" aria-hidden="true" />
                <p className="text-sm font-medium text-text-secondary">Nenhuma linha encontrada</p>
                <p className="text-xs text-text-tertiary">
                  {query ? 'Tente outro número ou nome' : 'Nenhuma linha em operação neste horário'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 pt-1">
                {grupos.map((group) => (
                  <GroupedRow key={group.numero} group={group} onSelect={handleSelect} />
                ))}
              </div>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
