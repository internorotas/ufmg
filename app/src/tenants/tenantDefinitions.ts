export const TENANT_SLUG_HEADER = 'x-tenant-slug';
export const DEFAULT_TENANT_SLUG = 'ufmg';

export interface TenantDefinition {
  slug: string;
  appName: string;
  shortName: string;
  institutionName: string;
  cityName: string;
  brandColor: string;
  description: string;
  basePath: `/${string}/`;
  campusDisplayName: string;
  campusCenter: [number, number];
  campusZoom: number;
  distanceAlertKm: number;
  transportSiteUrl: string | null;
  transportContactEmail: string | null;
  transportContactPhone: string | null;
  transportContactPhoneHref: string | null;
  publicRepositoryUrl: string | null;
  researchEmailExample: string;
}

export const TENANT_DEFINITIONS = {
  ufmg: {
    slug: 'ufmg',
    appName: 'Interno Rotas UFMG',
    shortName: 'Interno Rotas',
    institutionName: 'Universidade Federal de Minas Gerais',
    cityName: 'Belo Horizonte',
    brandColor: '#2c0eeb',
    description:
      'Planeje seus trajetos no campus Pampulha da UFMG com mapa interativo, linhas, paradas e previsões em tempo real.',
    basePath: '/ufmg/',
    campusDisplayName: 'campus Pampulha',
    campusCenter: [-19.87055, -43.96775],
    campusZoom: 15,
    distanceAlertKm: 4,
    transportSiteUrl: 'https://www.ufmg.br/transporte/',
    transportContactEmail: 'sfrota@dsg.ufmg.br',
    transportContactPhone: '3409-4601 / 4606',
    transportContactPhoneHref: 'tel:34094601',
    publicRepositoryUrl: 'https://github.com/internorotas/ufmg',
    researchEmailExample: 'pesquisa@ufmg.br',
  },
  'usp-mock': {
    slug: 'usp-mock',
    appName: 'Interno Rotas USP Mock',
    shortName: 'Interno Rotas',
    institutionName: 'Universidade de São Paulo',
    cityName: 'São Paulo',
    brandColor: '#8b1d3b',
    description:
      'Consulte linhas universitárias, paradas e previsões em tempo real com um shell público único do Interno Rotas.',
    basePath: '/usp-mock/',
    campusDisplayName: 'campus da universidade',
    campusCenter: [-23.559616, -46.731386],
    campusZoom: 15,
    distanceAlertKm: 4,
    transportSiteUrl: null,
    transportContactEmail: null,
    transportContactPhone: null,
    transportContactPhoneHref: null,
    publicRepositoryUrl: 'https://github.com/internorotas',
    researchEmailExample: 'pesquisa@usp.br',
  },
} as const satisfies Record<string, TenantDefinition>;

export type TenantSlug = keyof typeof TENANT_DEFINITIONS;

export function normalizeTenantSlug(value?: string | null): string {
  if (!value) {
    return DEFAULT_TENANT_SLUG;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : DEFAULT_TENANT_SLUG;
}

export function resolveTenantDefinition(value?: string | null): TenantDefinition {
  const normalized = normalizeTenantSlug(value);
  return TENANT_DEFINITIONS[normalized as TenantSlug] ?? TENANT_DEFINITIONS[DEFAULT_TENANT_SLUG];
}
