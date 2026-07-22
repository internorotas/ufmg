import { SearchX, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/Input';
import { useRotas, useRotasSelection } from '@/contexts/RotasContext';
import type { Parada } from '@/types/data.types';

interface PesquisaParadasProps {
  paradas: Parada[];
  isOpen: boolean;
  onClose: () => void;
}

export function PesquisaParadas({ paradas, isOpen, onClose }: PesquisaParadasProps) {
  const [termo, setTermo] = useState('');
  const { mapaRef } = useRotas();
  const { selecionarParada } = useRotasSelection();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTermo('');
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Escape fecha e, junto com o backdrop clicável, o Tab preso no painel
  // fazem esta busca se comportar como o role="dialog" aria-modal que ela
  // já declara — sem isso, o leitor de tela anuncia "diálogo modal" mas o
  // mapa por trás continua totalmente interativo.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const resultados = useMemo(() => {
    const normalizado = termo.trim().toLowerCase();
    if (!normalizado) return paradas.slice(0, 8);
    return paradas
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(normalizado) ||
          p.categoria?.toLowerCase().includes(normalizado) ||
          p.linhasAtendidas.some((l) => l.toLowerCase().includes(normalizado)),
      )
      .slice(0, 12);
  }, [paradas, termo]);

  const handleSelect = useCallback(
    (parada: Parada) => {
      selecionarParada(parada);
      mapaRef.current?.centralizarParada(parada);
      onClose();
    },
    [selecionarParada, mapaRef, onClose],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop — bloqueia interação com o mapa por trás enquanto a busca
          está aberta, cumprindo a semântica de aria-modal declarada abaixo. */}
      <button
        type="button"
        aria-label="Fechar pesquisa"
        onClick={onClose}
        className="absolute inset-0 z-(--z-search-panel) cursor-default bg-black/20"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pesquisar paradas"
        className="pointer-events-auto absolute inset-x-0 top-0 z-(--z-search-panel) flex max-h-[70%] flex-col bg-card shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-card-border px-3 py-2">
          <SearchInput
            ref={inputRef}
            value={termo}
            onValueChange={setTermo}
            placeholder="Nome da parada ou linha…"
            showClear
            onClear={() => setTermo('')}
            className="flex-1"
            aria-label="Pesquisar paradas"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pesquisa"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Resultados */}
        <ul className="overflow-y-auto" aria-label={`${resultados.length} paradas encontradas`}>
          {resultados.length === 0 ? (
            <li>
              <EmptyState
                size="sm"
                icon={<SearchX size={24} aria-hidden="true" />}
                title="Nenhuma parada encontrada"
                description="Tente outro nome de parada ou linha."
              />
            </li>
          ) : (
            resultados.map((parada) => (
              <li key={parada.idParada}>
                <button
                  type="button"
                  onClick={() => handleSelect(parada)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text-primary">
                      {parada.nome}
                    </span>
                    {parada.categoria ? (
                      <span className="block truncate text-xs text-text-secondary">
                        {parada.categoria}
                      </span>
                    ) : null}
                  </span>
                  {parada.linhasAtendidas.length > 0 ? (
                    <span className="shrink-0 text-xs text-text-tertiary">
                      {parada.linhasAtendidas.slice(0, 3).join(', ')}
                      {parada.linhasAtendidas.length > 3
                        ? ` +${parada.linhasAtendidas.length - 3}`
                        : ''}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </>
  );
}
