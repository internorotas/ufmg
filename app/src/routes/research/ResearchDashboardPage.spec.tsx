// @vitest-environment jsdom

import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResearchDashboardPage } from './ResearchDashboardPage';

const fetchMock = vi.fn();

describe('ResearchDashboardPage', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('renderiza opções GeoJSON e CSV e solicita email', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          filters: {},
          formats: ['GeoJSON', 'CSV'],
          latestSnapshotWeek: '2026-05-11',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await act(async () => {
      root.render(
        <BrowserRouter>
          <ResearchDashboardPage />
        </BrowserRouter>,
      );
    });

    expect(container.textContent).toContain('GeoJSON');
    expect(container.textContent).toContain('CSV');
    expect(container.textContent).toContain('Email');
  });
});
