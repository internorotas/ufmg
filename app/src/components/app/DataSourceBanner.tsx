interface DataSourceBannerProps {
  isVisible: boolean;
  source: 'api' | 'public-data' | 'source-fallback';
  updatedAt?: string;
}

function resolveBannerMessage(source: DataSourceBannerProps['source'], updatedAt?: string): string {
  const suffix = updatedAt
    ? ` Atualizado em: ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
    : '';

  if (source === 'public-data') {
    return `Dados offline — mostrando versão em cache.${suffix}`;
  }

  return `Dados offline — usando fallback local de segurança.${suffix}`;
}

export function DataSourceBanner({ isVisible, source, updatedAt }: DataSourceBannerProps) {
  if (!isVisible || source === 'api') {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed left-4 right-4 top-20 z-1199 neo-brutal-sm border-warning-border bg-warning-bg px-4 py-3 text-sm font-medium text-warning-text sm:left-auto sm:max-w-md"
    >
      {resolveBannerMessage(source, updatedAt)}
    </div>
  );
}
