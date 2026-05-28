import { X } from 'lucide-react';
import type { AriaRole, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '@/lib/utils';

const systemBannerVariants = tv({
  slots: {
    root: 'mb-3 rounded-lg border p-3',
    header: 'flex items-start gap-2',
    icon: 'mt-0.5 size-5 shrink-0',
    body: 'min-w-0 flex-1',
    title: 'text-xs font-semibold uppercase tracking-wide',
    description: 'mt-1 text-xs leading-relaxed lg:text-sm',
    actions: 'mt-3 flex flex-wrap gap-2',
    close: [
      'ml-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary',
    ],
  },
  variants: {
    variant: {
      info: {
        root: 'border-info-border bg-info-bg text-info-text',
        close: 'border-info-border hover:bg-info-border/20',
      },
      warning: {
        root: 'border-warning-border bg-warning-bg text-warning-text',
        close: 'border-warning-border hover:bg-warning-border/20',
      },
      success: {
        root: 'border-success-border bg-success-bg text-success-text',
        close: 'border-success-border hover:bg-success-border/20',
      },
      neutral: {
        root: 'border-neutral-border bg-neutral-bg text-neutral-text',
        close: 'border-neutral-border hover:bg-neutral-border/20',
      },
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

export interface SystemBannerProps extends VariantProps<typeof systemBannerVariants> {
  title?: string;
  description: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  dismissLabel?: string;
  onDismiss?: () => void;
  role?: AriaRole;
  className?: string;
}

export function SystemBanner({
  variant,
  title,
  description,
  icon,
  actions,
  dismissLabel,
  onDismiss,
  role,
  className,
}: SystemBannerProps) {
  const { t } = useTranslation('system-banner');
  const slots = systemBannerVariants({ variant });
  const resolvedRole = role ?? (variant === 'warning' ? 'alert' : 'status');

  return (
    <section
      data-slot="system-banner"
      data-intent={variant}
      role={resolvedRole}
      aria-live={resolvedRole === 'alert' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(slots.root(), className)}
    >
      <div className={slots.header()}>
        {icon ? <span className={slots.icon()}>{icon}</span> : null}
        <div className={slots.body()}>
          {title ? <p className={slots.title()}>{title}</p> : null}
          <div className={slots.description()}>{description}</div>
          {actions ? <div className={slots.actions()}>{actions}</div> : null}
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel || t('dismiss')}
            title={dismissLabel || t('dismiss')}
            className={slots.close()}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </section>
  );
}
