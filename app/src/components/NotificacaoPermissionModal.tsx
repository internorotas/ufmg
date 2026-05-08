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
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './ui/Button';

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
  const { t } = useTranslation('modals');
  const showIOSNote = isIOS();
  const [confirmando, setConfirmando] = useState(false);

  const handleConfirmar = useCallback(async () => {
    if (confirmando) return;
    setConfirmando(true);
    try {
      await onConfirmar();
    } finally {
      setConfirmando(false);
    }
  }, [confirmando, onConfirmar]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('notificationPermission.title')}
      description={t('notificationPermission.description')}
      size="sm"
    >
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        {/* Ícone ilustrativo */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/12">
          <Bell size={32} className="text-brand-primary" aria-hidden="true" />
        </div>

        {/* Texto explicativo */}
        <div className="space-y-2 px-2">
          <h3 className="text-base font-semibold text-text-primary">
            {t('notificationPermission.subtitle')}
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            {t('notificationPermission.body')}
          </p>
          <p className="text-xs text-text-tertiary">{t('notificationPermission.helper')}</p>
        </div>

        {/* Nota para usuários iOS */}
        {showIOSNote && (
          <div className="flex w-full items-start gap-2 rounded-lg border border-warning-border bg-warning-bg p-3 text-left">
            <Info size={16} className="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-warning-text">
              <Trans
                i18nKey="notificationPermission.iosNote"
                ns="modals"
                components={{ strong: <strong /> }}
              />
            </p>
          </div>
        )}

        {/* Botões de ação — coluna no mobile, linha no desktop */}
        <div className="flex w-full flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            type="button"
            onClick={handleConfirmar}
            loading={confirmando}
            className="flex-1 min-h-11"
            data-autofocus="true"
          >
            {t('notificationPermission.actions.allow')}
          </Button>
          <Button variant="outline" type="button" onClick={onClose} className="flex-1 min-h-11">
            {t('notificationPermission.actions.later')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
