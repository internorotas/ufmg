interface DataSourceBannerProps {
  isVisible: boolean;
  source: 'api' | 'public-data' | 'source-fallback';
}

function resolveBannerMessage(source: DataSourceBannerProps['source']): string {
  if (source === 'public-data') {
    return 'Dados offline — mostrando versão em cache.';
  }

  return 'Dados offline — usando fallback local de segurança.';
}

export function DataSourceBanner({ isVisible, source }: DataSourceBannerProps) {
  if (!isVisible || source === 'api') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed left-4 right-4 top-20 z-[1199] rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm font-medium text-warning-text shadow-lg sm:left-auto sm:max-w-md"
    >
      {resolveBannerMessage(source)}
    </div>
  );
}
