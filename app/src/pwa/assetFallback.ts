export function isHtmlFallbackForAsset(pathname: string, response: Response): boolean {
  return (
    pathname.includes('/assets/') &&
    (response.headers.get('content-type')?.toLowerCase().startsWith('text/html') ?? false)
  );
}

export function missingAssetResponse(): Response {
  return new Response('Not found', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
