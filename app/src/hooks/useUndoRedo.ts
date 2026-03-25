import { useCallback, useReducer } from 'react';

const MAX_HISTORY = 50;

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

type HistoryAction<T> = { type: 'SET'; payload: T } | { type: 'UNDO' | 'REDO' };

/**
 * Hook de undo/redo genérico que mantém um histórico de estados.
 * O disparo via Ctrl+Z / Ctrl+Y é gerenciado externamente (no AdminLayout).
 */
export function useUndoRedo<T>(initialState: T) {
  const [{ past, present, future }, dispatch] = useReducer(
    (state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> => {
      switch (action.type) {
        case 'SET': {
          const trimmed =
            state.past.length >= MAX_HISTORY
              ? state.past.slice(state.past.length - MAX_HISTORY + 1)
              : state.past;
          return { past: [...trimmed, state.present], present: action.payload, future: [] };
        }
        case 'UNDO':
          if (state.past.length === 0) return state;
          return {
            past: state.past.slice(0, -1),
            present: state.past[state.past.length - 1],
            future: [state.present, ...state.future],
          };
        case 'REDO':
          if (state.future.length === 0) return state;
          return {
            past: [...state.past, state.present],
            present: state.future[0],
            future: state.future.slice(1),
          };
        default:
          return state;
      }
    },
    { past: [], present: initialState, future: [] },
  );

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      const resolved =
        typeof newState === 'function' ? (newState as (prev: T) => T)(present) : newState;
      dispatch({ type: 'SET', payload: resolved });
    },
    [present],
  );

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  return {
    state: present,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undoCount: past.length,
  };
}
