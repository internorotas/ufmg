// @vitest-environment jsdom

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeAdminLoginPage } from './FakeAdminLoginPage';

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

function renderPage() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(<FakeAdminLoginPage />);
  });

  return { container, root };
}

describe('FakeAdminLoginPage', () => {
  it('renderiza tela fake com campo honeypot website', () => {
    const { container } = renderPage();

    const heading = container.querySelector('h1');
    expect(heading?.textContent).toBe('Admin Console');

    const websiteField = container.querySelector('input[name="website"]');
    expect(websiteField).not.toBeNull();
  });

  it('envia submit para /v1/honeypot/report com POST', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetchMock);

    const { container } = renderPage();

    const username = container.querySelector('input[name="username"]') as HTMLInputElement;
    const password = container.querySelector('input[name="password"]') as HTMLInputElement;
    const submit = container.querySelector('button[type="submit"]') as HTMLButtonElement;

    act(() => {
      username.value = 'admin';
      username.dispatchEvent(new Event('input', { bubbles: true }));
      password.value = 'secret';
      password.dispatchEvent(new Event('input', { bubbles: true }));
      submit.click();
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/v1/honeypot/report',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
