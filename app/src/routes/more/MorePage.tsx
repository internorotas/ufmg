/**
 * MorePage (/mais) - Hub central de navegação secundária
 *
 * Reúne em um único lugar todas as ações que antes ficavam dispersas (footer do
 * menu lateral, links soltos no header, modais legais), oferecendo a "listagem
 * de telas" que faltava ao usuário.
 */

import {
  ArrowUpRight,
  ExternalLink,
  FileText,
  Heart,
  Info,
  LifeBuoy,
  LogIn,
  LogOut,
  ScrollText,
  ShieldCheck,
  SunMoon,
  Trophy,
  UserCircle2,
} from 'lucide-react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/app/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { tenantConfig } from '@/tenants/tenantConfig';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface InternalItem {
  kind: 'link';
  to: string;
  icon: IconComponent;
  label: string;
  description: string;
  badge?: string;
}

interface ExternalItem {
  kind: 'external';
  href: string;
  icon: IconComponent;
  label: string;
  description: string;
  analyticsLabel: string;
}

interface ActionItem {
  kind: 'action';
  icon: IconComponent;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

interface SwitchItem {
  kind: 'switch';
  icon: IconComponent;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

type MoreItem = InternalItem | ExternalItem | ActionItem | SwitchItem;

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-text-secondary">{description}</p> : null}
      </header>
      <div className="grid grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ItemShell({
  icon: Icon,
  label,
  description,
  badge,
  trailing,
  variant = 'default',
}: {
  icon: IconComponent;
  label: string;
  description: string;
  badge?: string;
  trailing?: ReactNode;
  variant?: 'default' | 'danger';
}) {
  return (
    <div className="flex w-full items-center gap-3">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          variant === 'danger'
            ? 'bg-warning-bg text-warning-text ring-1 ring-warning-border'
            : 'bg-brand-primary text-white'
        }`}
      >
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text-primary">
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {badge ? (
            <Badge variant="info" size="sm" className="shrink-0">
              {badge}
            </Badge>
          ) : null}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">{description}</p>
      </div>
      {trailing}
    </div>
  );
}

function renderItem(item: MoreItem, key: string): ReactNode {
  if (item.kind === 'link') {
    return (
      <Link
        key={key}
        to={item.to}
        className="flex w-full min-h-14 items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2.5 transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <ItemShell
          icon={item.icon}
          label={item.label}
          description={item.description}
          badge={item.badge}
          trailing={
            <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-text-tertiary" />
          }
        />
      </Link>
    );
  }

  if (item.kind === 'external') {
    return (
      <a
        key={key}
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full min-h-14 items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2.5 transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <ItemShell
          icon={item.icon}
          label={item.label}
          description={item.description}
          trailing={
            <ExternalLink size={16} aria-hidden="true" className="shrink-0 text-text-tertiary" />
          }
        />
      </a>
    );
  }

  if (item.kind === 'switch') {
    return (
      <button
        key={key}
        type="button"
        role="switch"
        aria-checked={item.checked}
        onClick={item.onToggle}
        disabled={item.disabled}
        className="flex w-full min-h-14 items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ItemShell
          icon={item.icon}
          label={item.label}
          description={item.description}
          trailing={<Switch checked={item.checked} disabled={item.disabled} />}
        />
      </button>
    );
  }

  return (
    <button
      key={key}
      type="button"
      onClick={item.onClick}
      disabled={item.disabled}
      className={`flex w-full min-h-14 items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-60 ${
        item.variant === 'danger' ? 'hover:bg-warning-bg/40' : ''
      }`}
    >
      <ItemShell
        icon={item.icon}
        label={item.label}
        description={item.description}
        variant={item.variant}
      />
    </button>
  );
}

export function MorePage() {
  const navigate = useNavigate();
  const { isAuthenticated, authStatus } = useAuthContext();
  const { logout, isPending: isLogoutPending } = useLogout();
  const { theme, toggleTheme } = useTheme();
  const { trackPageView, trackEvent } = useAnalytics();

  useEffect(() => {
    trackPageView('/mais');
  }, [trackPageView]);

  const identidade: MoreItem[] = useMemo(() => {
    if (isAuthenticated) {
      return [
        {
          kind: 'link',
          to: '/perfil',
          icon: UserCircle2,
          label: 'Meu perfil',
          description: 'Pontos, emblemas e preferências de privacidade.',
        },
        {
          kind: 'action',
          icon: LogOut,
          label: 'Encerrar sessão',
          description: 'Sai da conta neste dispositivo.',
          disabled: isLogoutPending || authStatus === 'booting',
          variant: 'danger',
          onClick: () => {
            trackEvent({
              category: 'navigation',
              action: 'click_internal_link',
              label: 'Logout (Mais)',
            });
            void logout();
          },
        },
      ];
    }

    return [
      {
        kind: 'link',
        to: '/login',
        icon: LogIn,
        label: 'Entrar',
        description: 'Entre com Google para contribuir com GPS e aparecer no ranking.',
        badge: 'Grátis',
      },
    ];
  }, [authStatus, isAuthenticated, isLogoutPending, logout, trackEvent]);

  const engajamento: MoreItem[] = useMemo(
    () => [
      {
        kind: 'link',
        to: '/ranking',
        icon: Trophy,
        label: 'Ranking',
        description: 'Veja o top 10 público ou a visão completa com login.',
      },
    ],
    [],
  );

  const sobre: MoreItem[] = useMemo(() => {
    const baseItems: MoreItem[] = [
      {
        kind: 'link',
        to: '/sobre',
        icon: Info,
        label: 'Sobre o projeto',
        description: 'Como o app funciona, monetização e privacidade.',
      },
      {
        kind: 'external',
        href: 'https://forms.gle/5e9MHq9pp1p8T5Px5',
        icon: LifeBuoy,
        label: 'Reportar problema',
        description: 'Canal direto de feedback, dúvidas e relatos.',
        analyticsLabel: 'Contato',
      },
    ];

    if (tenantConfig.publicRepositoryUrl) {
      baseItems.push({
        kind: 'external',
        href: tenantConfig.publicRepositoryUrl,
        icon: Heart,
        label: 'Código aberto',
        description: 'Repositório público com o histórico do frontend.',
        analyticsLabel: 'Repositorio publico',
      });
    }

    return baseItems;
  }, []);

  const legal: MoreItem[] = useMemo(
    () => [
      {
        kind: 'link',
        to: '/privacidade',
        icon: ShieldCheck,
        label: 'Política de privacidade',
        description: 'Como tratamos dados de localização e identificação.',
      },
      {
        kind: 'link',
        to: '/termos',
        icon: FileText,
        label: 'Termos de uso',
        description: 'Regras de uso, responsabilidades e limites do serviço.',
      },
      {
        kind: 'external',
        href: 'https://forms.gle/5e9MHq9pp1p8T5Px5',
        icon: ScrollText,
        label: 'Dúvidas legais',
        description: 'Entre em contato sobre privacidade, dados ou direitos LGPD.',
        analyticsLabel: 'Duvidas legais',
      },
    ],
    [],
  );

  const preferencias: MoreItem[] = useMemo(
    () => [
      {
        kind: 'switch',
        icon: SunMoon,
        label: 'Modo escuro',
        description: `Aparência ${theme === 'dark' ? 'escura' : 'clara'} ativa.`,
        checked: theme === 'dark',
        onToggle: () => {
          trackEvent({
            category: 'preferences',
            action: 'toggle_theme',
            label: theme === 'dark' ? 'to_light' : 'to_dark',
          });
          toggleTheme();
        },
      },
    ],
    [theme, toggleTheme, trackEvent],
  );

  return (
    <AppShell
      title="Mais"
      description="Atalhos, conta e informações do projeto"
      backTo="/"
      actions={
        <button
          type="button"
          onClick={() => navigate('/')}
          className="hidden min-h-11 items-center justify-center rounded-lg border border-card-border bg-background px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-card-hover sm:inline-flex"
        >
          Ir ao mapa
        </button>
      }
    >
      <div className="space-y-6">
        <Section
          title={isAuthenticated ? 'Sua conta' : 'Entrar'}
          description={
            isAuthenticated
              ? 'Gerencie perfil, privacidade e sessão.'
              : 'Faça login para contribuir com GPS colaborativo e aparecer no ranking.'
          }
        >
          {identidade.map((item, index) => renderItem(item, `identidade-${index}`))}
        </Section>

        <Section
          title="Comunidade"
          description="Compare sua posição e veja o desempenho da comunidade."
        >
          {engajamento.map((item, index) => renderItem(item, `engajamento-${index}`))}
        </Section>

        <Section title="Sobre" description="Tudo sobre o projeto, contato e código.">
          {sobre.map((item, index) => renderItem(item, `sobre-${index}`))}
        </Section>

        <Section title="Legal" description="Documentos legais e compromissos do projeto.">
          {legal.map((item, index) => renderItem(item, `legal-${index}`))}
        </Section>

        <Section title="Preferências" description="Ajustes de aparência e experiência.">
          {preferencias.map((item, index) => renderItem(item, `preferencias-${index}`))}
        </Section>
      </div>
    </AppShell>
  );
}
