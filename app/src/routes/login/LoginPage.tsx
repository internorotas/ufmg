/**
 * LoginPage - Página de entrada com autenticação Google
 *
 * Rota: /login
 * Contexto: Qualquer usuário não autenticado que clicar em "Entrar"
 *           é redirecionado aqui antes de iniciar o fluxo OAuth.
 *
 * Parâmetros de URL aceitos:
 *   ?from=<path>   - destino após login (sobrepõe router state)
 *   ?error=<code>  - código de erro vindo do callback do backend
 */

import { Bus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import {
  AuthRequestError,
  startGoogleLoginFlow,
  warmupBackend,
} from '@/features/auth/api/authClient';
import { useAuthStore } from '@/features/auth/store/authStore';
import { tenantConfig } from '@/tenants/tenantConfig';

type LoadingState = 'idle' | 'warming' | 'redirecting';

/** Mensagem amigável por código de erro de URL ou status HTTP. */
function resolveErrorMessage(errorOrCode: unknown): string {
  // Erros vindos do URL param ?error=<code> (retornados pelo backend)
  if (typeof errorOrCode === 'string') {
    if (errorOrCode === 'auth_failed') return 'Falha na autenticação. Tente novamente.';
    if (errorOrCode === 'missing_params') return 'Erro ao processar autenticação. Tente novamente.';
    return 'Erro desconhecido. Tente novamente.';
  }
  // Erros de rede/HTTP lançados por startGoogleLoginFlow
  if (errorOrCode instanceof AuthRequestError) {
    const { status } = errorOrCode;
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
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const navigate = useNavigate();
  const location = useLocation();

  const authStatus = useAuthStore((s) => s.authStatus);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const searchParams = new URLSearchParams(location.search);

  // `from` pode vir de:
  // 1. URL param ?from=<path> — sobrevive ao redirect OAuth
  // 2. React Router state — para navegações internas
  // Apenas caminhos relativos são aceitos para evitar open redirect.
  const rawFrom =
    searchParams.get('from') ?? (location.state as { from?: string } | null)?.from ?? '/';
  const from = rawFrom.startsWith('/') ? rawFrom : '/';

  // Erro vindo do callback do backend (?error=auth_failed | ?error=missing_params)
  const urlErrorCode = searchParams.get('error');
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    urlErrorCode ? resolveErrorMessage(urlErrorCode) : null,
  );

  // Redireciona para a página de origem assim que o bootstrap confirmar
  // autenticação. Cobre o retorno do OAuth: backend → /login?from=... → aqui.
  useEffect(() => {
    if (authStatus !== 'booting' && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authStatus, isAuthenticated, navigate, from]);

  // Enquanto o bootstrap verifica a sessão, mostrar spinner para evitar
  // flash do formulário de login em usuários já autenticados.
  if (authStatus === 'booting') {
    return (
      <div className="flex flex-1 items-center justify-center bg-background-secondary">
        <div
          className="size-7 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"
          role="status"
          aria-label="Carregando"
        />
      </div>
    );
  }

  async function handleGoogleLogin() {
    setLoadingState('warming');
    setErrorMsg(null);
    try {
      // Acorda o backend (Render free tier pode estar dormindo).
      await warmupBackend();
      setLoadingState('redirecting');
      // O continueUrl é a própria página de login com ?from=... codificado.
      // Isso garante que erros do backend redirecionem de volta para cá,
      // e que o destino final sobreviva ao redirect OAuth.
      const loginPageUrl = new URL(window.location.pathname, window.location.origin);
      if (from !== '/') {
        loginPageUrl.searchParams.set('from', from);
      }
      await startGoogleLoginFlow(loginPageUrl.toString());
      // startGoogleLoginFlow chama window.location.assign — página navega para fora
    } catch (error) {
      setErrorMsg(resolveErrorMessage(error));
      setLoadingState('idle');
    }
  }

  const isLoading = loadingState !== 'idle';
  const buttonLabel =
    loadingState === 'warming'
      ? 'Conectando…'
      : loadingState === 'redirecting'
        ? 'Redirecionando…'
        : 'Entrar com Google';

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background-secondary text-text-primary">
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

            {errorMsg ? (
              <FeedbackBanner
                message={errorMsg}
                live="assertive"
                className="mb-4 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
              />
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
              {buttonLabel}
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
    </div>
  );
}
