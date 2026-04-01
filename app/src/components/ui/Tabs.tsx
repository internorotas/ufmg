/**
 * Tabs - Componente de navegação por abas
 * Design System - Interno Rotas UFMG
 *
 * @description Sistema de tabs composável com suporte a estados controlados.
 * Segue padrões de acessibilidade ARIA.
 */

import { type ComponentProps, createContext, type ReactNode, useContext, useState } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';
import { cn } from '../../lib/utils';

// CONTEXT

interface TabsContextValue {
  activeValue: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
}

/**
 * Variantes do container de tabs
 */
export const tabsVariants = tv({
  base: 'flex flex-col',
});

/**
 * Variantes da lista de tabs
 */
export const tabsListVariants = tv({
  base: 'flex',
  variants: {
    variant: {
      default: 'gap-1 rounded-lg bg-card-hover p-1',
      underline: 'gap-2 border-b border-card-border',
      pills: 'gap-2',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    fullWidth: true,
  },
});

/**
 * Variantes do trigger (botão da tab)
 */
export const tabsTriggerVariants = tv({
  base: [
    'inline-flex items-center justify-center whitespace-nowrap cursor-pointer',
    'font-medium transition-all duration-150 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.97]',
  ],
  variants: {
    variant: {
      default: [
        'rounded-md px-3 py-1.5 text-sm',
        'data-[state=active]:bg-background data-[state=active]:text-text-primary data-[state=active]:shadow-sm',
        'data-[state=inactive]:text-text-secondary data-[state=inactive]:hover:text-text-primary data-[state=inactive]:hover:bg-card-hover/50',
      ],
      underline: [
        'border-b-2 border-transparent px-4 py-2 text-sm',
        'data-[state=active]:border-brand-primary data-[state=active]:text-text-primary',
        'data-[state=inactive]:text-text-secondary data-[state=inactive]:hover:text-text-primary data-[state=inactive]:hover:bg-card-hover/30',
      ],
      pills: [
        'rounded-full px-4 py-2 text-sm',
        'data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm',
        'data-[state=inactive]:bg-card data-[state=inactive]:text-text-secondary',
        'data-[state=inactive]:hover:bg-card-hover data-[state=inactive]:hover:text-text-primary',
      ],
    },
    fullWidth: {
      true: 'flex-1',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    fullWidth: true,
  },
});

/**
 * Variantes do conteúdo da tab
 */
export const tabsContentVariants = tv({
  base: [
    'mt-2 focus-visible:outline-none',
    'data-[state=inactive]:hidden',
    // Animação suave de entrada
    'data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200',
  ],
});

export interface TabsProps
  extends Omit<ComponentProps<'div'>, 'defaultValue'>,
    VariantProps<typeof tabsVariants> {
  /** Valor ativo (controlado) */
  value?: string;
  /** Valor padrão (não controlado) */
  defaultValue?: string;
  /** Callback quando o valor muda */
  onValueChange?: (value: string) => void;
  /** Conteúdo das tabs */
  children: ReactNode;
}

export interface TabsListProps
  extends ComponentProps<'div'>,
    VariantProps<typeof tabsListVariants> {
  /** Lista de triggers */
  children: ReactNode;
}

export interface TabsTriggerProps
  extends ComponentProps<'button'>,
    Omit<VariantProps<typeof tabsTriggerVariants>, 'variant'> {
  /** Valor único da tab */
  value: string;
  /** Conteúdo do trigger */
  children: ReactNode;
}

export interface TabsContentProps extends ComponentProps<'div'> {
  /** Valor que corresponde ao trigger */
  value: string;
  /** Conteúdo quando a tab está ativa */
  children: ReactNode;
}

// COMPONENTS

/**
 * Container principal das tabs
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1" onValueChange={handleChange}>
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Conteúdo 1</TabsContent>
 *   <TabsContent value="tab2">Conteúdo 2</TabsContent>
 * </Tabs>
 * ```
 */
export function Tabs({
  value,
  defaultValue = '',
  onValueChange,
  children,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeValue, onValueChange: handleValueChange }}>
      <div data-slot="tabs" className={cn(tabsVariants(), className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/**
 * Lista que contém os triggers das tabs
 */
export function TabsList({ children, className, variant, fullWidth, ...props }: TabsListProps) {
  return (
    <div
      data-slot="tabs-list"
      role="tablist"
      className={cn(tabsListVariants({ variant, fullWidth }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Botão de trigger para cada tab
 */
export function TabsTrigger({
  value,
  children,
  className,
  fullWidth,
  disabled,
  onClick,
  ...props
}: TabsTriggerProps) {
  const { activeValue, onValueChange } = useTabsContext();
  const isActive = activeValue === value;

  // Detecta a variante do pai TabsList (simplificado, usa default)
  const variant = 'default';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      onValueChange(value);
    }
    onClick?.(e);
  };

  return (
    <button
      data-slot="tabs-trigger"
      role="tab"
      type="button"
      id={`tab-${value}`}
      aria-controls={`panel-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      aria-selected={isActive}
      disabled={disabled}
      onClick={handleClick}
      className={cn(tabsTriggerVariants({ variant, fullWidth }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Conteúdo de cada tab
 */
export function TabsContent({ value, children, className, ...props }: TabsContentProps) {
  const { activeValue } = useTabsContext();
  const isActive = activeValue === value;

  return (
    <div
      data-slot="tabs-content"
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      data-state={isActive ? 'active' : 'inactive'}
      hidden={!isActive}
      className={cn(tabsContentVariants(), className)}
      {...props}
    >
      {children}
    </div>
  );
}
