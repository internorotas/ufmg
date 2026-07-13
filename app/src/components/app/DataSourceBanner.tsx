interface DataSourceBannerProps {
  isVisible: boolean;
  source: 'api' | 'source-fallback';
  updatedAt?: string;
}

function resolveBannerMessage(updatedAt?: string): string {
  const suffix = updatedAt
    ? ` Atualizado em: ${new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
    : '';

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
      className="fixed left-4 right-18 top-20 z-1199 surface-card-sm border-warning-border bg-warning-bg px-4 py-3 text-sm font-medium text-warning-text sm:left-auto sm:right-4 sm:max-w-md"
    >
      {resolveBannerMessage(updatedAt)}
    </div>
  );
}
