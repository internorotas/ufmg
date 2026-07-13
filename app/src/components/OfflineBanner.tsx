import { WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 bg-warning-bg px-4 py-2 text-warning-text border-b border-(--card-border)">
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm font-medium">Dados offline — mostrando versão em cache</span>
    </div>
  );
}
