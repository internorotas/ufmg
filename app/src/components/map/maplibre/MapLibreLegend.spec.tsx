// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MapLibreLegend } from './MapLibreLegend';

describe('MapLibreLegend', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', false);
  });

  it('lista os 4 estados de posição do mapa único', async () => {
    await act(async () => {
      root.render(<MapLibreLegend />);
    });

    expect(container.textContent).toContain('Ao vivo');
    expect(container.textContent).toContain('Estimado');
    expect(container.textContent).toContain('Posição antiga');
    expect(container.textContent).toContain('Serviço externo (BHTrans)');
  });

  it('usa <details>/<summary> nativos — acessível por teclado sem estado próprio', async () => {
    await act(async () => {
      root.render(<MapLibreLegend />);
    });

    const details = container.querySelector('details');
    const summary = container.querySelector('summary');
    expect(details).not.toBeNull();
    expect(summary).not.toBeNull();
    expect(details?.hasAttribute('open')).toBe(false);
  });
});
