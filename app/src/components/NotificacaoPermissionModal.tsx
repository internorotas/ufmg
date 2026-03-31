/**
 * NotificacaoPermissionModal - Modal amigável de solicitação de permissão de notificações
 * Design System - Interno Rotas UFMG
 *
 * Segue o mesmo padrão do modal de permissão de GPS (useLocalizacaoUsuario):
 * o prompt nativo NUNCA é chamado diretamente — sempre passa por este modal educativo primeiro.
 *
 * Compatibilidade iOS:
 *   - iOS < 16.4: Notificações web não suportadas (nem no Safari, nem em PWAs)
 *   - iOS ≥ 16.4 + PWA instalado: suportadas via Web Push (exige permissão normal)
 *   O modal exibe uma nota contextual para usuários iOS sobre a necessidade de instalar.
 */

import { Bell, Info } from 'lucide-react';
import { Modal } from './Modal';

// Detecta iOS de forma simples para exibir nota contextual
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

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
  const showIOSNote = isIOS();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ativar Notificações" size="sm">
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        {/* Ícone ilustrativo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary">
          <Bell size={32} className="text-white" />
        </div>

        {/* Texto explicativo */}
        <div className="space-y-2 px-2">
          <h3 className="text-base font-semibold text-text-primary">Avisos de chegada</h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Queremos te avisar quando o ônibus estiver chegando. Para isso, precisamos que você
            permita o envio de notificações.
          </p>
          <p className="text-xs text-text-tertiary">
            Você receberá alertas a cada 5 minutos e uma confirmação ao ônibus chegar.
          </p>
        </div>

        {/* Nota para usuários iOS */}
        {showIOSNote && (
          <div className="flex w-full items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              No iPhone, as notificações só funcionam se o app estiver instalado na tela inicial.
              Toque em <strong>Compartilhar → Adicionar à Tela de Início</strong> no Safari para
              ativá-las.
            </p>
          </div>
        )}

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
