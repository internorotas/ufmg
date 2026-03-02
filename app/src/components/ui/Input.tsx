/**
 * Input - Componente de input base
 * Design System - Interno Rotas UFMG
 *
 * @description Input reutilizável com suporte a ícones e validação.
 */

import { type ComponentProps, type ReactNode, forwardRef } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do input base
 */
export const inputVariants = tv({
  base: [
    "w-full rounded-lg border bg-input",
    "border-input-border text-text-primary",
    "placeholder:text-text-tertiary",
    "transition-all duration-200",
    "focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  variants: {
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-4 text-base",
    },
    hasLeftIcon: {
      true: "pl-10",
      false: "",
    },
    hasRightIcon: {
      true: "pr-10",
      false: "",
    },
    error: {
      true: "border-red-500 focus:ring-red-500",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    hasLeftIcon: false,
    hasRightIcon: false,
    error: false,
  },
});

/**
 * Variantes do container de input
 */
export const inputContainerVariants = tv({
  base: "relative",
  variants: {
    fullWidth: {
      true: "w-full",
      false: "",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface InputProps
  extends
    Omit<ComponentProps<"input">, "size">,
    Omit<VariantProps<typeof inputVariants>, "hasLeftIcon" | "hasRightIcon"> {
  /** Ícone à esquerda */
  leftIcon?: ReactNode;
  /** Ícone à direita */
  rightIcon?: ReactNode;
  /** Mensagem de erro */
  errorMessage?: string;
  /** Container full width */
  fullWidth?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

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
  ...props
}: InputProps) {
  return (
    <div
      data-slot="input-container"
      className={inputContainerVariants({ fullWidth })}
    >
      {leftIcon && (
        <span
          data-slot="input-left-icon"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        >
          {leftIcon}
        </span>
      )}

      <input
        data-slot="input"
        data-error={error || undefined}
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
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
        >
          {rightIcon}
        </span>
      )}

      {errorMessage && error && (
        <p data-slot="input-error" className="mt-1 text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// SEARCH INPUT PRESET
// ============================================================================

export interface SearchInputProps extends Omit<
  ComponentProps<"input">,
  "size"
> {
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
    {
      value,
      onValueChange,
      onClear,
      showClear = true,
      onChange,
      shortcut,
      className,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      onValueChange?.("");
      onClear?.();
    };

    const hasValue = Boolean(value);

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
          className={cn(
            inputVariants({
              hasLeftIcon: true,
              hasRightIcon: (showClear && hasValue) || (!hasValue && !!shortcut),
            }),
            "pr-10",
            className,
          )}
          {...props}
        />

        {showClear && hasValue ? (
          <button
            data-slot="clear-button"
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-text-secondary transition-colors cursor-pointer hover:bg-card-hover hover:text-text-primary"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        ) : shortcut ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden md:block">
            <kbd className="inline-flex h-5 items-center rounded border border-card-border bg-background px-1.5 text-[10px] font-medium text-text-tertiary font-mono">
              {shortcut}
            </kbd>
          </div>
        ) : null}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
