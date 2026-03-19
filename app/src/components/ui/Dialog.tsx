/**
 * Dialog - Componente headless de modal/diálogo
 * Design System - Interno Rotas UFMG
 *
 * @description Sistema de dialog composável com Portal, Backdrop e animações.
 * Segue padrões de acessibilidade ARIA e suporte a ESC para fechar.
 *
 * Inspirado no padrão Base UI Dialog mas compatível com React 19.
 */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { tv, type VariantProps } from "tailwind-variants";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

// ============================================================================
// CONTEXT
// ============================================================================

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within a Dialog.Root");
  }
  return context;
}

// ============================================================================
// VARIANTS
// ============================================================================

/**
 * Variantes do backdrop
 */
export const dialogBackdropVariants = tv({
  base: [
    "fixed inset-0 z-[1999] bg-black/70 cursor-pointer",
    "data-[state=open]:animate-fade-in",
    "data-[state=closed]:animate-fade-out",
  ],
});

/**
 * Variantes do popup/content
 */
export const dialogPopupVariants = tv({
  base: [
    "relative flex max-h-[90vh] w-full flex-col",
    "rounded-xl border border-card-border bg-modal text-text-primary shadow-2xl",
    "data-[state=open]:animate-modal-in",
    "data-[state=closed]:animate-modal-out",
  ],
  variants: {
    size: {
      xs: "max-w-xs",
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
      "3xl": "max-w-3xl",
      "4xl": "max-w-4xl",
      full: "max-w-[95vw]",
    },
  },
  defaultVariants: {
    size: "2xl",
  },
});

/**
 * Variantes do título
 */
export const dialogTitleVariants = tv({
  base: "text-xl font-bold text-text-primary",
});

/**
 * Variantes da descrição
 */
export const dialogDescriptionVariants = tv({
  base: "text-sm text-text-secondary",
});

/**
 * Variantes do botão de fechar
 */
export const dialogCloseVariants = tv({
  base: [
    "inline-flex items-center justify-center rounded-lg p-2",
    "text-text-secondary transition-colors cursor-pointer",
    "hover:bg-card hover:text-text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  ],
});

// ============================================================================
// TYPES
// ============================================================================

export interface DialogRootProps {
  /** Se o dialog está aberto */
  open: boolean;
  /** Callback quando o estado muda */
  onOpenChange: (open: boolean) => void;
  /** Conteúdo do dialog */
  children: ReactNode;
}

export interface DialogPortalProps {
  /** Container para o portal (default: document.body) */
  container?: Element | null;
  /** Conteúdo a ser renderizado no portal */
  children: ReactNode;
}

export interface DialogBackdropProps
  extends ComponentProps<"div">, VariantProps<typeof dialogBackdropVariants> {}

export interface DialogPopupProps
  extends ComponentProps<"div">, VariantProps<typeof dialogPopupVariants> {}

export interface DialogTitleProps
  extends ComponentProps<"h2">, VariantProps<typeof dialogTitleVariants> {}

export interface DialogDescriptionProps
  extends ComponentProps<"p">, VariantProps<typeof dialogDescriptionVariants> {}

export interface DialogCloseProps
  extends ComponentProps<"button">, VariantProps<typeof dialogCloseVariants> {
  /** Label para acessibilidade */
  "aria-label"?: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Root - Container principal que gerencia o estado do dialog
 *
 * @example
 * ```tsx
 * <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
 *   <Dialog.Portal>
 *     <Dialog.Backdrop />
 *     <Dialog.Popup>
 *       <Dialog.Title>Título</Dialog.Title>
 *       <Dialog.Description>Descrição</Dialog.Description>
 *       <Dialog.Close />
 *     </Dialog.Popup>
 *   </Dialog.Portal>
 * </Dialog.Root>
 * ```
 */
function DialogRoot({ open, onOpenChange, children }: DialogRootProps) {
  const titleId = useId();
  const descriptionId = useId();

  // Bloquear scroll quando aberto
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogContext.Provider
      value={{ open, onOpenChange, titleId, descriptionId }}
    >
      {children}
    </DialogContext.Provider>
  );
}

/**
 * Portal - Renderiza o conteúdo em um portal
 */
function DialogPortal({ container, children }: DialogPortalProps) {
  const target = container ?? document.body;
  return createPortal(children, target);
}

/**
 * Backdrop - Overlay escuro atrás do dialog
 */
function DialogBackdrop({ className, onClick, ...props }: DialogBackdropProps) {
  const { open, onOpenChange } = useDialogContext();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onOpenChange(false);
    onClick?.(e);
  };

  return (
    <div
      data-slot="dialog-backdrop"
      data-state={open ? "open" : "closed"}
      onClick={handleClick}
      className={cn(dialogBackdropVariants(), className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Popup - Container do conteúdo do dialog
 */
function DialogPopup({
  size,
  className,
  children,
  ...props
}: DialogPopupProps) {
  const { open, titleId, descriptionId } = useDialogContext();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[2000] flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        data-slot="dialog-popup"
        data-state={open ? "open" : "closed"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "pointer-events-auto",
          dialogPopupVariants({ size }),
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Title - Título do dialog
 */
function DialogTitle({ className, children, ...props }: DialogTitleProps) {
  const { titleId } = useDialogContext();

  return (
    <h2
      data-slot="dialog-title"
      id={titleId}
      className={cn(dialogTitleVariants(), className)}
      {...props}
    >
      {children}
    </h2>
  );
}

/**
 * Description - Descrição do dialog
 */
function DialogDescription({
  className,
  children,
  ...props
}: DialogDescriptionProps) {
  const { descriptionId } = useDialogContext();

  return (
    <p
      data-slot="dialog-description"
      id={descriptionId}
      className={cn(dialogDescriptionVariants(), className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Close - Botão para fechar o dialog
 */
function DialogClose({
  className,
  children,
  onClick,
  "aria-label": ariaLabel = "Fechar",
  ...props
}: DialogCloseProps) {
  const { onOpenChange } = useDialogContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(false);
    onClick?.(e);
  };

  return (
    <button
      data-slot="dialog-close"
      type="button"
      onClick={handleClick}
      className={cn(dialogCloseVariants(), className)}
      aria-label={ariaLabel}
      title={ariaLabel}
      {...props}
    >
      {children ?? <X className="size-6" />}
    </button>
  );
}

// ============================================================================
// COMPOUND EXPORT
// ============================================================================

/**
 * Dialog - Compound component para modals/diálogos
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
 *   <Dialog.Portal>
 *     <Dialog.Backdrop />
 *     <Dialog.Popup size="lg">
 *       <header className="flex items-center justify-between border-b border-card-border p-4">
 *         <Dialog.Title>Título do Modal</Dialog.Title>
 *         <Dialog.Close />
 *       </header>
 *       <div className="p-4">
 *         <Dialog.Description>
 *           Conteúdo do modal aqui.
 *         </Dialog.Description>
 *       </div>
 *     </Dialog.Popup>
 *   </Dialog.Portal>
 * </Dialog.Root>
 * ```
 */
export const Dialog = {
  Root: DialogRoot,
  Portal: DialogPortal,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};

// Named exports for individual components
export {
  DialogRoot,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
