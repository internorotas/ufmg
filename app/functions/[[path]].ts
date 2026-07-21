import { isHtmlFallbackForAsset, missingAssetResponse } from '../src/pwa/assetFallback';

interface AssetBinding {
  fetch(request: Request): Promise<Response>;
}

interface PagesContext {
  env: { ASSETS: AssetBinding };
  request: Request;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const response = await context.env.ASSETS.fetch(context.request);
  const pathname = new URL(context.request.url).pathname;

  return isHtmlFallbackForAsset(pathname, response) ? missingAssetResponse() : response;
}
