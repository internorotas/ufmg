/**
 * InfoBanner - Banner informativo
 * Design System - Interno Rotas UFMG
 */

import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { Info } from "lucide-react";
import { cn } from "../lib/utils";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do banner
 */
export const bannerVariants = tv({
  base: [
    "flex items-start gap-2 rounded-lg border p-3",
    "mb-3",
  ],
  variants: {
    intent: {
      info: "border-info-border bg-info-bg text-info-text",
      warning: "border-warning-border bg-warning-bg text-warning-text",
      success: "border-success-border bg-success-bg text-success-text",
      neutral: "border-neutral-border bg-neutral-bg text-neutral-text",
    },
  },
  defaultVariants: {
    intent: "info",
  },
});

// ============================================================================
// TYPES
// ============================================================================

export interface InfoBannerProps
  extends ComponentProps<"div">,
    VariantProps<typeof bannerVariants> {}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Banner informativo sobre a saída dos ônibus.
 *
 * @example
 * ```tsx
 * <InfoBanner />
 * ```
 */
export function InfoBanner({ className, ...props }: InfoBannerProps) {
  return (
    <div
      data-slot="banner"
      data-intent="info"
      className={cn(bannerVariants({ intent: "info" }), className)}
      {...props}
    >
      <Info className="mt-0.5 size-5 shrink-0" />
      <p className="text-xs leading-relaxed lg:text-sm">
        Todas as rotas iniciam e terminam próximas à{" "}
        <strong>Escola de Música</strong>. Os horários indicam a saída dos
        ônibus deste ponto.
      </p>
    </div>
  );
}
