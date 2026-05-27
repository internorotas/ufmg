/**
 * Input - Componente de input base
 * Design System - Interno Rotas UFMG
 *
 * @description Input reutilizável com suporte a ícones e validação.
 */

import { Search, X } from 'lucide-react';
import { type ComponentProps, forwardRef, type ReactNode, useId } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../../lib/utils';

/**
 * Variantes do input base
 */
export const inputVariants = tv({
  base: [
    'w-full rounded-lg border bg-input',
    'border-input-border text-text-primary',
    'placeholder:text-text-tertiary',
    'transition-all duration-200',
    'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    hasLeftIcon: {
      true: 'pl-10',
      false: '',
    },
    hasRightIcon: {
      true: 'pr-10',
      false: '',
    },
    error: {
      true: 'border-warning-border focus:ring-warning-border',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    hasLeftIcon: false,
    hasRightIcon: false,
    error: false,
  },
});

/**
 * Variantes do container de input
 */
export const inputContainerVariants = tv({
  base: 'relative',
  variants: {
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});

export interface InputProps
  extends Omit<ComponentProps<'input'>, 'size'>,
    Omit<VariantProps<typeof inputVariants>, 'hasLeftIcon' | 'hasRightIcon'> {
  /** Ícone à esquerda */
  leftIcon?: ReactNode;
  /** Ícone à direita */
  rightIcon?: ReactNode;
  /** Mensagem de erro */
  errorMessage?: string;
  /** Container full width */
  fullWidth?: boolean;
}

/**
 * Componente de input com suporte a ícones e estados
 *
 * @example
 * ```tsx
 * // Input simples
 * <Input placeholder="Digite algo..." />
 *
 * // Input com ícone
 * <Input
 *   leftIcon={<Search size={20} />}
 *   placeholder="Pesquisar..."
 * />
 *
 * // Input com erro
 * <Input
 *   error
 *   errorMessage="Campo obrigatório"
 * />
 * ```
 */
export function Input({
  className,
  size,
  error,
  leftIcon,
  rightIcon,
  errorMessage,
  fullWidth = true,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  const errorId = useId();
  const describedBy = [ariaDescribedBy, errorMessage && error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-slot="input-container" className={inputContainerVariants({ fullWidth })}>
      {leftIcon && (
        <span
          data-slot="input-left-icon"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        >
          {leftIcon}
        </span>
      )}

      <input
        data-slot="input"
        data-error={error || undefined}
        aria-describedby={describedBy || undefined}
        aria-invalid={ariaInvalid ?? error ?? undefined}
        className={cn(
          inputVariants({
            size,
            hasLeftIcon: !!leftIcon,
            hasRightIcon: !!rightIcon,
            error,
          }),
          className,
        )}
        {...props}
      />

      {rightIcon && (
        <span
          data-slot="input-right-icon"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
        >
          {rightIcon}
        </span>
      )}

      {errorMessage && error && (
        <p
          data-slot="input-error"
          id={errorId}
          role="alert"
          className="mt-1 text-xs text-warning-text"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// SEARCH INPUT PRESET

export interface SearchInputProps extends Omit<ComponentProps<'input'>, 'size'> {
  /** Valor do input */
  value?: string;
  /** Callback quando o valor muda */
  onValueChange?: (value: string) => void;
  /** Callback para limpar o input */
  onClear?: () => void;
  /** Mostrar botão de limpar */
  showClear?: boolean;
  /** Tecla de atalho para focar (ex: "⌘K") */
  shortcut?: string;
}

/**
 * Input de busca com ícone e botão de limpar
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={search}
 *   onValueChange={setSearch}
 *   placeholder="Pesquisar linha..."
 *   shortcut="⌘K"
 * />
 * ```
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    { value, onValueChange, onClear, showClear = true, onChange, shortcut, className, ...props },
    ref,
  ) => {
    const fallbackAriaLabel =
      props['aria-label'] ??
      (typeof props.placeholder === 'string' ? props.placeholder : 'Pesquisar');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      onValueChange?.('');
      onClear?.();
    };

    const hasValue = Boolean(value);

    const ariaKeyShortcuts = shortcut
      ? shortcut.replace('⌘', 'Meta+').replace('Ctrl', 'Control')
      : undefined;

    return (
      <div data-slot="search-input" className="relative w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />

        <input
          ref={ref}
          data-slot="input"
          type="search"
          value={value}
          onChange={handleChange}
          aria-label={fallbackAriaLabel}
          aria-keyshortcuts={ariaKeyShortcuts}
          enterKeyHint="search"
          className={cn(
            inputVariants({
              hasLeftIcon: true,
              hasRightIcon: (showClear && hasValue) || (!hasValue && !!shortcut),
            }),
            'pr-10',
            className,
          )}
          {...props}
        />

        {showClear && hasValue ? (
          <button
            data-slot="clear-button"
            type="button"
            onClick={handleClear}
            onMouseDown={(e) => e.preventDefault()}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-secondary transition-colors cursor-pointer hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            aria-label="Limpar busca"
            title="Limpar busca"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : shortcut ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
            {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: visual shortcut hint only */}
            <kbd
              aria-hidden="true"
              className="inline-flex h-5 items-center rounded border border-card-border bg-background px-1.5 text-[10px] font-medium text-text-tertiary font-mono"
            >
              {shortcut}
            </kbd>
          </div>
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
