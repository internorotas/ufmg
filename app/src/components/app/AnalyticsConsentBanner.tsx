import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { GA_MEASUREMENT_ID } from '@/config/analytics';
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent';

export function AnalyticsConsentBanner() {
  const { consent, accept, decline } = useAnalyticsConsent();

  if (!GA_MEASUREMENT_ID || consent !== null) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-label="Consentimento de analytics"
      aria-live="polite"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[1300] border-t-2 border-(--neo-border-color) bg-card px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-0 md:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center neo-brutal-sm bg-brand-primary text-white">
            <BarChart3 size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">Análise de uso (opcional)</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Usamos Google Analytics para entender como o app é utilizado e melhorar a experiência.
              Nenhum dado pessoal identificável é coletado.{' '}
              <Link
                to="/privacidade"
                className="font-medium text-brand-primary underline underline-offset-2"
              >
                Política de privacidade
              </Link>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={decline}
            className="min-h-9 text-xs"
          >
            Recusar
          </Button>
          <Button type="button" size="sm" onClick={accept} className="min-h-9 text-xs">
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
