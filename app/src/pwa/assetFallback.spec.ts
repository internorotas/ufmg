import { describe, expect, it } from 'vitest';
import { isHtmlFallbackForAsset, missingAssetResponse } from './assetFallback';

describe('asset fallback', () => {
  it('identifica HTML entregue para um asset', () => {
    expect(
      isHtmlFallbackForAsset(
        '/assets/chunk-ausente.js',
        new Response('<!doctype html>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
      ),
    ).toBe(true);
  });

  it('preserva respostas JavaScript de assets', () => {
    expect(
      isHtmlFallbackForAsset(
        '/assets/chunk.js',
        new Response('export {};', {
          headers: { 'content-type': 'application/javascript' },
        }),
      ),
    ).toBe(false);
  });

  it('protege assets quando o app usa um subcaminho', () => {
    expect(
      isHtmlFallbackForAsset(
        '/ufmg/assets/chunk-ausente.js',
        new Response('<!doctype html>', {
          headers: { 'content-type': 'text/html' },
        }),
      ),
    ).toBe(true);
  });

  it('não trata uma rota SPA como asset', () => {
    expect(
      isHtmlFallbackForAsset(
        '/login',
        new Response('<!doctype html>', {
          headers: { 'content-type': 'text/html' },
        }),
      ),
    ).toBe(false);
  });

  it('retorna 404 sem cache para asset ausente', () => {
    const response = missingAssetResponse();

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toContain('text/plain');
  });
});
