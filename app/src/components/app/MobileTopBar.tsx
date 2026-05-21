/**
 * MobileTopBar - Barra superior fixa exibida apenas na rota /
 *
 * Mostra a marca e o status de autenticação como ponto de referência permanente
 * para o usuário em mobile. O MenuLateral (sidebar) aparece por cima quando
 * aberto, então não há conflito com seu próprio header.
 */

import logo from '@/assets/logo-horizontal-transparente.svg';

export interface MobileTopBarProps {
  authStatus: 'booting' | 'authenticated' | 'anonymous';
  isAuthenticated: boolean;
  onAuthAction: () => void;
}

export function MobileTopBar({ authStatus, isAuthenticated, onAuthAction }: MobileTopBarProps) {
  return (
    <header
      data-slot="mobile-top-bar"
      className="pointer-events-none fixed inset-x-0 top-0 z-1001 flex justify-center pt-[env(safe-area-inset-top)] md:hidden"
    >
      <div className="pointer-events-auto mx-3 mt-3 flex w-full max-w-sm items-center gap-2 rounded-2xl bg-brand-primary px-3 py-2 shadow-lg backdrop-blur">
        <div className="flex-1">
          <img
            src={logo}
            alt="Interno Rotas"
            className="h-5 w-auto"
            width="115"
            height="20"
            loading="eager"
          />
        </div>

        {authStatus === 'booting' ? (
          <span
            role="status"
            aria-label="Carregando sessão"
            className="inline-flex h-9 min-w-16 animate-pulse items-center justify-center rounded-full bg-white/20"
          />
        ) : (
          <button
            type="button"
            onClick={onAuthAction}
            aria-label={isAuthenticated ? 'Abrir seu perfil' : 'Entrar com sua conta'}
            className="inline-flex min-h-9 items-center justify-center rounded-full bg-white px-3 text-xs font-semibold text-brand-primary shadow-sm transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            {isAuthenticated ? 'Perfil' : 'Entrar'}
          </button>
        )}
      </div>
    </header>
  );
}
