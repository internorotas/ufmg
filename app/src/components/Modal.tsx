import { ReactNode, useEffect } from "react";
import { IoClose } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-2xl" }: ModalProps) {
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
      <div className={`relative bg-modal text-text-primary rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-slide-up border border-card-border`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border bg-background-secondary">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-card transition-colors"
            aria-label="Fechar modal"
          >
            <IoClose size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-4 flex-1 bg-modal">
          {children}
        </div>
      </div>
    </div>
  );
}
