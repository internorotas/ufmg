export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const pathname = new URL(request.url).pathname;

    if (
      pathname.includes('/assets/') &&
      response.headers.get('content-type')?.toLowerCase().startsWith('text/html')
    ) {
      return new Response('Not found', {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    return response;
  },
};
