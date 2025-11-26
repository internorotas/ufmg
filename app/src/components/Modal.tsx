import { ReactNode, useEffect } from "react";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

/**
 * Renderiza um componente de modal genérico.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.isOpen - Um booleano que indica se o modal está aberto.
 * @param {() => void} props.onClose - Uma função para fechar o modal.
 * @param {string} props.title - O título do modal.
 * @param {ReactNode} props.children - O conteúdo a ser exibido dentro do modal.
 * @param {string} [props.maxWidth="max-w-2xl"] - A largura máxima do modal.
 * @returns {JSX.Element | null} O componente de modal renderizado, ou nulo se não estiver aberto.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}: ModalProps) {
  // Fechar modal com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/70 animate-fade-in"
      />

      {/* Modal Content */}
      <div
        className={`relative bg-modal text-text-primary rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-slide-up border border-card-border`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border bg-background-secondary rounded-t-xl">
          {typeof title === 'string' ? (
            <h2 className="text-xl font-bold">{title}</h2>
          ) : (
            title
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card transition-colors"
            aria-label="Fechar modal"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1 bg-modal rounded-b-xl">{children}</div>
      </div>
    </div>
  );
}
