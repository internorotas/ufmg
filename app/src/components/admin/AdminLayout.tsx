import { Settings } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import dataLinhas from '../../data/linhas';
import dataParadas from '../../data/paradas';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import type { CategoriaLinhas, Parada } from '../../types/data.types';
import { AdminLinhasTab } from './AdminLinhasTab';
import { AdminMobilidadeTab } from './AdminMobilidadeTab';
import { AdminParadasTab } from './AdminParadasTab';
import { AdminPrediosTab } from './AdminPrediosTab';

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
  const [activeTab, setActiveTab] = useState<'paradas' | 'linhas' | 'predios' | 'mobilidade'>('paradas');

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
  const isLinhasTab = activeTab === 'linhas';
  const isMobilidadeTab = activeTab === 'mobilidade';
  const isPrediosTab = activeTab === 'predios';
  const canUndo = isLinhasTab ? canUndoLinhas : canUndoParadas;
  const canRedo = isLinhasTab ? canRedoLinhas : canRedoParadas;
  const changesCount = isLinhasTab ? undoCountLinhas : undoCountParadas;

  const handleUndo = useCallback(() => {
    if (isLinhasTab) undoLinhas();
    else undoParadas();
  }, [isLinhasTab, undoLinhas, undoParadas]);

  const handleRedo = useCallback(() => {
    if (isLinhasTab) redoLinhas();
    else redoParadas();
  }, [isLinhasTab, redoLinhas, redoParadas]);

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
    'px-2.5 py-1.5 text-xs rounded-(--neo-radius) border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* Barra de topo fixa */}
      <header className="flex items-center gap-2 px-3 py-2 bg-card border-b-2 border-(--neo-border-color) shrink-0 flex-wrap">
        <span className="font-bold text-sm text-text-primary whitespace-nowrap flex items-center gap-1.5">
          <Settings size={16} aria-hidden="true" />
          Admin Panel
        </span>

        {/* Seletor de aba */}
        <div className="flex neo-brutal-sm overflow-hidden text-xs font-medium">
          {(
            [
              { id: 'paradas', label: 'Paradas' },
              { id: 'linhas', label: 'Linhas' },
              { id: 'predios', label: 'Prédios' },
              { id: 'mobilidade', label: 'Mobilidade' },
            ] as const
          ).map(({ id, label }, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 transition-colors ${i > 0 ? 'border-l border-card-border' : ''} ${
                activeTab === id
                  ? 'bg-brand-primary text-text-inverse'
                  : 'text-text-secondary hover:bg-background-secondary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Indicador de alterações — oculto em abas sem edição local */}
        {!isMobilidadeTab && !isPrediosTab && changesCount > 0 && (
          <span className="px-2 py-0.5 text-xs bg-warning-bg text-warning-text border border-warning-border rounded">
            {changesCount} {changesCount === 1 ? 'alteração' : 'alterações'}
          </span>
        )}

        <div className="flex-1" />

        {/* Desfazer / Refazer — oculto em abas sem edição local */}
        {!isMobilidadeTab && !isPrediosTab && (
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
        )}

        {/* Exportar — oculto em abas sem edição local */}
        {!isMobilidadeTab && !isPrediosTab && (
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
              className="px-3 py-1.5 text-xs neo-brutal-sm font-semibold bg-brand-primary text-text-inverse hover:opacity-90 transition-opacity"
            >
              ↓ Exportar Tudo
            </button>
          </div>
        )}
      </header>

      {/* Conteúdo da aba */}
      <div className="flex flex-1 overflow-hidden">
        {isMobilidadeTab ? (
          <AdminMobilidadeTab />
        ) : isPrediosTab ? (
          <AdminPrediosTab />
        ) : isParadasTab ? (
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
