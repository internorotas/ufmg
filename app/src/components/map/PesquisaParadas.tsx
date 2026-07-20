import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setTermo('');
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
    <div
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
          <li className="px-4 py-6 text-center text-sm text-text-tertiary">
            Nenhuma parada encontrada
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
  );
}
