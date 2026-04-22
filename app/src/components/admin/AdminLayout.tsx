import { useCallback, useEffect, useState } from 'react';
import dataLinhas from '../../data/linhas';
import dataParadas from '../../data/paradas';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import type { CategoriaLinhas, Parada } from '../../types/data.types';
import { AdminLinhasTab } from './AdminLinhasTab';
import { AdminParadasTab } from './AdminParadasTab';

function downloadFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<'paradas' | 'linhas'>('paradas');

  const {
    state: paradasState,
    setState: setParadasState,
    undo: undoParadas,
    redo: redoParadas,
    canUndo: canUndoParadas,
    canRedo: canRedoParadas,
    undoCount: undoCountParadas,
  } = useUndoRedo<Parada[]>(dataParadas.paradas);

  const {
    state: linhasState,
    setState: setLinhasState,
    undo: undoLinhas,
    redo: redoLinhas,
    canUndo: canUndoLinhas,
    canRedo: canRedoLinhas,
    undoCount: undoCountLinhas,
  } = useUndoRedo<CategoriaLinhas>(dataLinhas);

  const isParadasTab = activeTab === 'paradas';
  const canUndo = isParadasTab ? canUndoParadas : canUndoLinhas;
  const canRedo = isParadasTab ? canRedoParadas : canRedoLinhas;
  const changesCount = isParadasTab ? undoCountParadas : undoCountLinhas;

  const handleUndo = useCallback(() => {
    if (isParadasTab) undoParadas();
    else undoLinhas();
  }, [isParadasTab, undoParadas, undoLinhas]);

  const handleRedo = useCallback(() => {
    if (isParadasTab) redoParadas();
    else redoLinhas();
  }, [isParadasTab, redoParadas, redoLinhas]);

  // Atalhos de teclado: ignora quando o foco está em um campo de texto
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const exportParadas = useCallback(() => {
    const content = [
      `import type { Parada } from '../types/data.types';`,
      ``,
      `const dataParadas: { paradas: Parada[] } = {`,
      `  paradas: ${JSON.stringify(paradasState, null, 2)},`,
      `};`,
      ``,
      `export default dataParadas;`,
      ``,
    ].join('\n');
    downloadFile('paradas.ts', content);
  }, [paradasState]);

  const exportLinhas = useCallback(() => {
    const content = [
      `import type { CategoriaLinhas } from '../types/data.types';`,
      ``,
      `const data: CategoriaLinhas = ${JSON.stringify(linhasState, null, 2)};`,
      ``,
      `export default data;`,
      ``,
    ].join('\n');
    downloadFile('linhas.ts', content);
  }, [linhasState]);

  const btnBase =
    'rounded-xl border px-2.5 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-text-primary">
      {/* Barra de topo fixa */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-card-border bg-card px-3 py-2">
        <span className="whitespace-nowrap text-sm font-bold text-text-primary">⚙️ Admin Panel</span>

        {/* Seletor de aba */}
        <div className="flex overflow-hidden rounded-xl border border-card-border text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('paradas')}
            className={`px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
              isParadasTab
                ? 'bg-brand-primary text-text-inverse'
                : 'text-text-secondary hover:bg-background-secondary'
            }`}
          >
            Paradas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('linhas')}
            className={`border-l border-card-border px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
              !isParadasTab
                ? 'bg-brand-primary text-text-inverse'
                : 'text-text-secondary hover:bg-background-secondary'
            }`}
          >
            Linhas
          </button>
        </div>

        {/* Indicador de alterações */}
        {changesCount > 0 && (
          <span className="rounded-full border border-warning-border bg-warning-bg px-2 py-0.5 text-xs text-warning-text">
            {changesCount} {changesCount === 1 ? 'alteração' : 'alterações'}
          </span>
        )}

        <div className="flex-1" />

        {/* Desfazer / Refazer */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className={`${btnBase} border-card-border hover:enabled:bg-background-secondary`}
          >
            ↩ Desfazer
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className={`${btnBase} border-card-border hover:enabled:bg-background-secondary`}
          >
            ↪ Refazer
          </button>
        </div>

        {/* Exportar */}
        <div className="flex gap-1 border-l border-card-border pl-2">
          <button
            type="button"
            onClick={exportParadas}
            title="Baixar paradas.ts atualizado"
            className={`${btnBase} border-card-border hover:bg-background-secondary`}
          >
            ↓ paradas.ts
          </button>
          <button
            type="button"
            onClick={exportLinhas}
            title="Baixar linhas.ts atualizado"
            className={`${btnBase} border-card-border hover:bg-background-secondary`}
          >
            ↓ linhas.ts
          </button>
          <button
            type="button"
            onClick={() => {
              exportParadas();
              exportLinhas();
            }}
            className="rounded-xl bg-brand-primary px-3 py-2 text-xs font-semibold text-text-inverse transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            ↓ Exportar Tudo
          </button>
        </div>
      </header>

      {/* Conteúdo da aba */}
      <div className="flex flex-1 overflow-hidden">
        {isParadasTab ? (
          <AdminParadasTab
            paradas={paradasState}
            setParadas={setParadasState}
            linhasData={linhasState}
          />
        ) : (
          <AdminLinhasTab
            linhasData={linhasState}
            setLinhasData={setLinhasState}
            paradas={paradasState}
          />
        )}
      </div>
    </div>
  );
}
