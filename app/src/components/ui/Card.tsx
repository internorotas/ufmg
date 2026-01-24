/**
 * Card - Compound Components para cards
 * Design System - Interno Rotas UFMG
 *
 * @description Sistema de card composável com Header, Title, Content e Footer.
 * Permite flexibilidade na construção de cards complexos.
 */

import type { ComponentProps, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "../../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do card root
 */
export const cardVariants = tv({
  base: [
    "rounded-xl border bg-card text-text-primary",
    "transition-all duration-200",
  ],
  variants: {
    variant: {
      default: "border-card-border shadow-sm",
      elevated: "border-card-border shadow-md hover:shadow-lg",
      outline: "border-card-border bg-transparent",
      ghost: "border-transparent bg-transparent shadow-none",
      interactive: [
        "border-card-border shadow-sm cursor-pointer",
        "hover:border-info-border hover:shadow-md",
        "active:scale-[0.99]",
      ],
    },
    selected: {
      true: [
        "border-2 border-internoRotas-azul-eletrico shadow-lg",
        "ring-1 ring-internoRotas-azul-eletrico/20",
      ],
      false: "",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    variant: "default",
    selected: false,
    padding: "none",
  },
});

/**
 * Variantes do header do card
 */
export const cardHeaderVariants = tv({
  base: "flex flex-col gap-1.5",
  variants: {
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
    withBorder: {
      true: "border-b border-card-border",
      false: "",
    },
  },
  defaultVariants: {
    padding: "md",
    withBorder: false,
  },
});

/**
 * Variantes do título do card
 */
export const cardTitleVariants = tv({
  base: "font-semibold leading-tight tracking-tight",
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

/**
 * Variantes do conteúdo do card
 */
export const cardContentVariants = tv({
  base: "",
  variants: {
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    padding: "md",
  },
});

/**
 * Variantes do footer do card
 */
export const cardFooterVariants = tv({
  base: "flex items-center",
  variants: {
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
    withBorder: {
      true: "border-t border-card-border",
      false: "",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
    },
  },
  defaultVariants: {
    padding: "md",
    withBorder: false,
    justify: "end",
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface CardProps
  extends
    Omit<ComponentProps<"div">, "ref">,
    VariantProps<typeof cardVariants> {
  /** Conteúdo do card */
  children: ReactNode;
  /** Elemento HTML a ser renderizado */
  as?: "article" | "div" | "section";
}

export interface CardHeaderProps
  extends ComponentProps<"header">, VariantProps<typeof cardHeaderVariants> {
  /** Conteúdo do header */
  children: ReactNode;
}

export interface CardTitleProps
  extends ComponentProps<"h3">, VariantProps<typeof cardTitleVariants> {
  /** Elemento HTML para o título */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span";
  /** Conteúdo do título */
  children: ReactNode;
}

export interface CardDescriptionProps extends ComponentProps<"p"> {
  /** Conteúdo da descrição */
  children: ReactNode;
}

export interface CardContentProps
  extends ComponentProps<"div">, VariantProps<typeof cardContentVariants> {
  /** Conteúdo principal */
  children: ReactNode;
}

export interface CardFooterProps
  extends ComponentProps<"footer">, VariantProps<typeof cardFooterVariants> {
  /** Conteúdo do footer */
  children: ReactNode;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Card root - Container principal do card
 *
 * @example
 * ```tsx
 * <Card variant="interactive" onClick={handleClick}>
 *   <CardHeader>
 *     <CardTitle>Título do Card</CardTitle>
 *     <CardDescription>Descrição opcional</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Conteúdo do card...</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Ação</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */
export function Card({
  children,
  className,
  variant,
  selected,
  padding,
  as: Element = "article",
  ...props
}: CardProps) {
  return (
    <Element
      data-slot="card"
      data-selected={selected || undefined}
      className={cn(cardVariants({ variant, selected, padding }), className)}
      {...props}
    >
      {children}
    </Element>
  );
}

/**
 * Header do card - Contém título e descrição
 */
export function CardHeader({
  children,
  className,
  padding,
  withBorder,
  ...props
}: CardHeaderProps) {
  return (
    <header
      data-slot="card-header"
      className={cn(cardHeaderVariants({ padding, withBorder }), className)}
      {...props}
    >
      {children}
    </header>
  );
}

/**
 * Título do card
 */
export function CardTitle({
  children,
  className,
  size,
  as: Element = "h3",
  ...props
}: CardTitleProps) {
  return (
    <Element
      data-slot="card-title"
      className={cn(cardTitleVariants({ size }), className)}
      {...props}
    >
      {children}
    </Element>
  );
}

/**
 * Descrição do card - Texto secundário abaixo do título
 */
export function CardDescription({
  children,
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Conteúdo principal do card
 */
export function CardContent({
  children,
  className,
  padding,
  ...props
}: CardContentProps) {
  return (
    <div
      data-slot="card-content"
      className={cn(cardContentVariants({ padding }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Footer do card - Ações e informações adicionais
 */
export function CardFooter({
  children,
  className,
  padding,
  withBorder,
  justify,
  ...props
}: CardFooterProps) {
  return (
    <footer
      data-slot="card-footer"
      className={cn(
        cardFooterVariants({ padding, withBorder, justify }),
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  );
}
