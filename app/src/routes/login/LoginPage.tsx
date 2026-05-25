/**
 * LoginPage - Página de entrada com autenticação Google
 *
 * Rota: /login
 * Contexto: Qualquer usuário não autenticado que clicar em "Entrar"
 *           é redirecionado aqui antes de iniciar o fluxo OAuth.
 */

import { Bus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '@/components/app/BottomNav';
import { NavRail } from '@/components/app/NavRail';
import { Button } from '@/components/ui/Button';
import { AuthRequestError, startGoogleLoginFlow } from '@/features/auth/api/authClient';
import { tenantConfig } from '@/tenants/tenantConfig';

/** Mensagem amigável por status HTTP (ou null para rede). */
function resolveErrorMessage(error: unknown): string {
  if (error instanceof AuthRequestError) {
    const { status } = error;
    if (status === null) return 'Falha de conexão. Verifique sua internet e tente novamente.';
    if (status === 429) return 'Muitas tentativas. Aguarde alguns segundos e tente novamente.';
    if (status >= 500) return 'Serviço temporariamente indisponível. Tente novamente em instantes.';
    if (status === 401 || status === 403) return 'Login indisponível no momento. Tente mais tarde.';
  }
  return 'Falha ao iniciar login com Google. Tente novamente.';
}

/** Ícone "G" do Google como SVG inline (sem dependência extra). */
function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await startGoogleLoginFlow();
      // startGoogleLoginFlow chama window.location.assign — página navega para fora
    } catch (error) {
      setErrorMsg(resolveErrorMessage(error));
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background-secondary text-text-primary">
      <NavRail />
      <main className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pt-12 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-card-border bg-card px-8 py-8 shadow-sm">
            {/* Brand header */}
            <div className="mb-8 flex flex-col items-center gap-3 text-center">
              <div
                className="flex size-14 items-center justify-center rounded-2xl shadow-sm"
                style={{ backgroundColor: tenantConfig.brandColor }}
              >
                <Bus size={26} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">{tenantConfig.shortName}</h1>
                <p className="mt-1 text-sm text-text-secondary">{tenantConfig.campusDisplayName}</p>
              </div>
            </div>

            {/* Mensagem de erro */}
            {errorMsg ? (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 rounded-lg border border-warning-border bg-warning-bg px-3 py-2.5 text-xs leading-relaxed text-warning-text"
              >
                {errorMsg}
              </div>
            ) : null}

            {/* Botão Google */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              loading={isLoading}
              leftIcon={isLoading ? undefined : <GoogleIcon />}
              onClick={() => void handleGoogleLogin()}
              aria-label="Entrar com Google"
            >
              {isLoading ? 'Redirecionando…' : 'Entrar com Google'}
            </Button>

            {/* Pular login */}
            <p className="mt-4 text-center text-xs text-text-tertiary">
              <Link
                to="/"
                className="underline underline-offset-2 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 rounded-sm"
              >
                Continuar sem login
              </Link>
            </p>
          </div>

          {/* Nota de privacidade */}
          <p className="mt-5 text-center text-[11px] leading-relaxed text-text-tertiary">
            Ao entrar, você concorda com nossa{' '}
            <Link
              to="/privacidade"
              className="underline underline-offset-2 hover:text-text-secondary"
            >
              política de privacidade
            </Link>
            .<br />
            Sem publicidade. Sem venda de dados.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
