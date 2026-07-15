import { BarChart3, Cookie, Shield } from 'lucide-react';
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
      role="dialog"
      aria-modal="true"
      aria-label="Consentimento de privacidade e cookies"
      className="fixed inset-0 z-2000 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-md rounded-t-2xl bg-card p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
            <Cookie size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-text-primary">Privacidade e Cookies</h2>
            <p className="text-xs text-text-secondary">Escolha como usamos seus dados</p>
          </div>
        </div>

        <p className="mb-4 text-sm text-text-secondary">
          Usamos cookies para garantir o funcionamento do site e, opcionalmente, para analisar como
          o app é utilizado — sem coletar dados pessoais identificáveis.{' '}
          <Link
            to="/privacidade"
            className="font-medium text-brand-primary dark:text-brand-accent underline underline-offset-2"
          >
            Política de Privacidade
          </Link>
        </p>

        <div className="mb-5 space-y-2">
          <div className="flex items-start gap-3 rounded-lg border border-card-border bg-background-secondary px-3 py-2.5">
            <Shield size={15} className="mt-0.5 shrink-0 text-success-text" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold text-text-primary">Essenciais (sempre ativos)</p>
              <p className="text-xs text-text-secondary">
                Cloudflare Turnstile — proteção contra bots e spam
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-card-border bg-background-secondary px-3 py-2.5">
            <BarChart3
              size={15}
              className="mt-0.5 shrink-0 text-brand-primary dark:text-brand-accent"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold text-text-primary">Análise de uso (opcional)</p>
              <p className="text-xs text-text-secondary">
                Google Analytics — páginas visitadas e funções mais usadas
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <Button type="button" onClick={accept} fullWidth className="sm:flex-1">
            Aceitar Todos
          </Button>
          <Button type="button" variant="outline" onClick={decline} fullWidth className="sm:flex-1">
            Somente Essenciais
          </Button>
        </div>
      </div>
    </div>
  );
}
