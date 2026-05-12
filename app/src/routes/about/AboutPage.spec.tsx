// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
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

  it('renderiza a copy de transparência da monetização no app', async () => {
    await act(async () => {
      root.render(
        <BrowserRouter>
          <AboutPage />
        </BrowserRouter>,
      );
    });

    expect(container.textContent).toContain('Transparência do Interno Rotas');
    expect(container.textContent).toContain('AbacatePay');
    expect(container.textContent).toContain('sem anúncios intrusivos');
    expect(container.textContent).toContain('sem tracking de terceiros');
    expect(container.textContent).toContain('Sem paywall funcional nesta fase');
  });
});
