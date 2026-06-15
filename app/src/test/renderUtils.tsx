// Custom render utilities that use react-dom/createRoot directly (Vite's module system),
// avoiding the dual React instance issue that occurs with @testing-library/react's render
// when running under pnpm + Windows junctions + Vitest 4.
import { type ReactNode, act } from 'react';
import { createRoot } from 'react-dom/client';

interface RenderResult {
  container: HTMLDivElement;
  rerender: (ui: ReactNode) => void;
  unmount: () => void;
}

export function render(ui: ReactNode): RenderResult {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(ui);
  });

  return {
    container,
    rerender(newUi: ReactNode) {
      act(() => {
        root.render(newUi);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

// renderHook equivalent using createRoot — avoids @testing-library/react's dual-instance issue
interface RenderHookResult<T> {
  result: { current: T };
  rerender: (newProps?: unknown) => void;
  unmount: () => void;
}

export function renderHook<T>(renderFn: () => T): RenderHookResult<T> {
  const result: { current: T } = { current: undefined as unknown as T };

  function HookWrapper() {
    result.current = renderFn();
    return null;
  }

  const { rerender, unmount } = render(<HookWrapper />);

  return {
    result,
    rerender() {
      rerender(<HookWrapper />);
    },
    unmount,
  };
}
