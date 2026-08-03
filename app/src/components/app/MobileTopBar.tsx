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
      className="shrink-0 bg-brand-primary pt-[env(safe-area-inset-top)] md:hidden"
    >
      <div className="flex min-h-14 w-full items-center gap-3 px-4 py-2">
        <div className="flex flex-1 items-center">
          <img
            src={logo}
            alt="Interno Rotas"
            className="h-7 w-auto"
            width="138"
            height="24"
            loading="eager"
          />
        </div>

        {authStatus === 'booting' ? (
          <span
            role="status"
            aria-label="Carregando sessão"
            className="inline-flex size-10 animate-pulse items-center justify-center rounded-full bg-white/20"
          />
        ) : (
          <button
            type="button"
            onClick={onAuthAction}
            aria-label={isAuthenticated ? 'Abrir seu perfil' : 'Entrar com sua conta'}
            className="inline-flex min-h-10 items-center justify-center rounded-(--shape-sm) bg-white px-3 text-xs font-semibold text-brand-primary shadow-(--elevation-1) transition-[background-color,transform] hover:bg-white/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
          >
            {isAuthenticated ? 'Perfil' : 'Entrar'}
          </button>
        )}
      </div>
    </header>
  );
}
