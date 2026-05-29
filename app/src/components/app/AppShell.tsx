/**
 * AppShell - Layout compartilhado das páginas internas
 *
 * Aplica header consistente (voltar + título + ações opcionais), área de conteúdo
 * com largura máxima e BottomNav fixa. Usado por /perfil, /ranking, /sobre, /mais.
 *
 * A rota / (mapa) mantém seu layout próprio (MenuLateral + Mapa em tela cheia).
 */

import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface AppShellProps {
  title: string;
  description?: ReactNode;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

export function AppShell({
  title,
  description,
  backTo = '/',
  backLabel = 'Voltar ao mapa',
  actions,
  children,
  contentClassName,
}: AppShellProps) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden bg-background-secondary text-text-primary">
      <a
        href="#shell-main"
        className="sr-only absolute left-4 top-4 z-[1400] rounded-lg bg-background px-4 py-2 text-sm font-semibold text-text-primary shadow-lg focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        Pular para conteúdo
      </a>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-card-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link
              to={backTo}
              aria-label={backLabel}
              title={backLabel}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-card-border bg-background text-text-primary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
              {description ? (
                <p className="truncate text-xs text-text-secondary sm:text-sm">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </header>

        <main
          id="shell-main"
          tabIndex={-1}
          className={cn(
            'min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-5',
            contentClassName,
          )}
        >
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
