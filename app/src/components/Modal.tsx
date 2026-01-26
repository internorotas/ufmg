/**
 * Modal - Componente de modal genérico usando Dialog headless
 * Design System - Interno Rotas UFMG
 *
 * Este componente é um wrapper de alto nível sobre o Dialog headless,
 * fornecendo uma API simplificada para casos de uso comuns.
 */

import { type ReactNode, type ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn } from "../lib/utils";
import { Dialog, dialogPopupVariants } from "./ui/Dialog";

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do header
 */
export const modalHeaderVariants = tv({
  base: [
    "flex items-center justify-between",
    "rounded-t-xl border-b border-card-border bg-background-secondary p-4",
  ],
});

// Re-export variants for backward compatibility
export { dialogPopupVariants as modalContentVariants };

export const modalOverlayVariants = tv({
  base: "fixed inset-0 z-[2000] flex items-center justify-center p-4",
});

export const modalBackdropVariants = tv({
  base: "absolute inset-0 bg-black/70 animate-fade-in",
});

export const modalCloseButtonVariants = tv({
  base: [
    "rounded-lg p-2 transition-colors",
    "hover:bg-card",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ],
});

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps
  extends
    Omit<ComponentProps<"div">, "title">,
    VariantProps<typeof dialogPopupVariants> {
  /** Se o modal está aberto */
  isOpen: boolean;
  /** Callback para fechar o modal */
  onClose: () => void;
  /** Título do modal (pode ser string ou ReactNode) */
  title: string | ReactNode;
  /** Conteúdo do modal */
  children: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Componente de modal genérico usando Dialog headless.
 *
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Título do Modal"
 *   size="lg"
 * >
 *   <p>Conteúdo do modal</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size,
  className,
  ...props
}: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size={size} className={cn(className)} {...props}>
          {/* Header */}
          <div data-slot="header" className={modalHeaderVariants()}>
            {typeof title === "string" ? (
              <Dialog.Title>{title}</Dialog.Title>
            ) : (
              <div className="flex-1">{title}</div>
            )}
            <Dialog.Close aria-label="Fechar modal" />
          </div>

          {/* Content */}
          <div
            data-slot="body"
            className="flex-1 overflow-y-auto rounded-b-xl bg-modal p-4"
          >
            {children}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
