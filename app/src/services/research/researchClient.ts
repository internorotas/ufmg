export interface ResearchExportFilters {
  linhaId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: string;
}

export interface ResearchExportRequest extends ResearchExportFilters {
  email: string;
  format: 'GeoJSON' | 'CSV';
}

function resolveResearchEndpoint(pathname: '/v1/research/exports'): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL;
  if (!apiBaseUrl) {
    return pathname;
  }

  return new URL(pathname, apiBaseUrl).toString();
}

export async function fetchResearchExportPreview(filters: ResearchExportFilters) {
  const endpoint = new URL(resolveResearchEndpoint('/v1/research/exports'), window.location.origin);
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      endpoint.searchParams.set(key, value);
    }
  }

  const response = await fetch(endpoint.toString(), { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Falha ao carregar preview de pesquisa: HTTP ${response.status}`);
  }

  return response.json() as Promise<{
    filters: ResearchExportFilters;
    formats: Array<'GeoJSON' | 'CSV'>;
    latestSnapshotWeek: string;
  }>;
}

export async function requestResearchExport(payload: ResearchExportRequest) {
  const response = await fetch(resolveResearchEndpoint('/v1/research/exports'), {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Falha ao solicitar exportação: HTTP ${response.status}`);
  }

  return response.json() as Promise<{ requestId: string; data: string }>;
}
