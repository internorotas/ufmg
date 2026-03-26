/**
 * NotificacaoPermissionModal - Modal amigável de solicitação de permissão de notificações
 * Design System - Interno Rotas UFMG
 *
 * Segue o mesmo padrão do modal de permissão de GPS (useLocalizacaoUsuario):
 * o prompt nativo NUNCA é chamado diretamente — sempre passa por este modal educativo primeiro.
 */

import { Bell } from 'lucide-react';
import { Modal } from './Modal';

interface NotificacaoPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chamado ao clicar em "Permitir" — deve invocar Notification.requestPermission() */
  onConfirmar: () => Promise<void>;
}

export function NotificacaoPermissionModal({
  isOpen,
  onClose,
  onConfirmar,
}: NotificacaoPermissionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ativar Notificações" size="sm">
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        {/* Ícone ilustrativo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
          <Bell size={32} className="text-brand-primary" />
        </div>

        {/* Texto explicativo */}
        <div className="space-y-2 px-2">
          <h3 className="text-base font-semibold text-text-primary">Avisos de chegada</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Queremos te avisar quando o ônibus estiver chegando. Para isso, precisamos que você
            permita o envio de notificações.
          </p>
          <p className="text-xs text-text-tertiary">
            Você receberá um aviso quando faltar aproximadamente 5 minutos para o ônibus chegar.
          </p>
        </div>

        {/* Botões de ação — coluna no mobile, linha no desktop */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirmar}
            className="min-h-11 flex-1 rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary active:scale-95"
          >
            Permitir
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-lg border border-card-border px-6 py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            Agora Não
          </button>
        </div>
      </div>
    </Modal>
  );
}
