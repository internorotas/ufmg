import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  /** Horário da última atualização dos dados em cache, se disponível */
  updatedAt?: string;
}

export function OfflineBanner({ isOffline, updatedAt }: OfflineBannerProps) {
  if (!isOffline) {
    return null;
  }

  const horario = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-warning-text border-b border-(--card-border)"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">
        Dados offline, mostrando versão em cache{horario ? ` de ${horario}` : ''}
      </span>
    </div>
  );
}
