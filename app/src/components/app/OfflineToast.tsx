/**
 * OfflineToast - Notificação de perda de conexão
 */

interface OfflineToastProps {
  show: boolean;
}

export function OfflineToast({ show }: OfflineToastProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Status de conectividade"
      className="fixed left-4 right-4 top-4 z-[1200] rounded-lg border border-warning-border bg-warning-bg px-4 py-3 text-sm font-medium text-warning-text shadow-lg sm:left-auto sm:max-w-sm"
    >
      Conexão perdida. Mapas podem não carregar, mas previsões estáticas continuam funcionando.
    </div>
  );
}
