import { resolveTenantDefinition } from '@/tenants/tenantDefinitions';

export const tenantConfig = resolveTenantDefinition(import.meta.env.VITE_TENANT_SLUG);
export const tenantSlug = tenantConfig.slug;

function updateMeta(selector: string, content: string): void {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) {
    element.content = content;
  }
}

export function applyTenantDocumentMetadata(): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const appUrl = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
  const ogImageUrl = new URL(
    `${import.meta.env.BASE_URL}og-image.png`,
    window.location.origin,
  ).toString();

  document.title = tenantConfig.appName;
  updateMeta('meta[name="theme-color"]', tenantConfig.brandColor);
  updateMeta('meta[name="description"]', tenantConfig.description);
  updateMeta('meta[property="og:title"]', tenantConfig.appName);
  updateMeta('meta[property="og:description"]', tenantConfig.description);
  updateMeta('meta[property="og:site_name"]', tenantConfig.shortName);
  updateMeta('meta[property="og:url"]', appUrl);
  updateMeta('meta[property="og:image"]', ogImageUrl);
  updateMeta('meta[property="og:image:secure_url"]', ogImageUrl);
  updateMeta('meta[property="twitter:title"]', tenantConfig.appName);
  updateMeta('meta[property="twitter:description"]', tenantConfig.description);
  updateMeta('meta[property="twitter:url"]', appUrl);
  updateMeta('meta[property="twitter:image"]', ogImageUrl);

  const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.href = appUrl;
  }
}
