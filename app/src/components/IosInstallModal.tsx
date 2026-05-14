/**
 * IosInstallModal - Modal educativo para usuários de iPhone não-PWA
 *
 * Exibido quando o utilizador tenta ativar um alarme no Safari iOS
 * sem ter o app instalado na Tela de Início.
 */

import { Bell, Plus, Share } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { Button } from './ui/Button';

export interface IosInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSOS = [
  {
    id: 'compartilhar',
    icone: Share,
    i18nKey: 'iosInstall.steps.share',
  },
  {
    id: 'adicionar',
    icone: Plus,
    i18nKey: 'iosInstall.steps.add',
  },
  {
    id: 'abrir',
    icone: Bell,
    i18nKey: 'iosInstall.steps.open',
  },
];

export function IosInstallModal({ isOpen, onClose }: IosInstallModalProps) {
  const { t } = useTranslation('modals');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('iosInstall.title')}
      description={t('iosInstall.description')}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{t('iosInstall.body')}</p>

        <ol className="space-y-2">
          {PASSOS.map((passo, idx) => {
            const Icone = passo.icone;
            return (
              <li
                key={passo.id}
                className="flex items-start gap-3 rounded-lg border border-card-border bg-background-secondary p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-text-inverse">
                  {idx + 1}
                </div>
                <div className="flex items-start gap-2">
                  <Icone size={16} className="mt-0.5 shrink-0 text-brand-accent" />
                  <p className="text-sm text-text-primary">
                    <Trans
                      i18nKey={passo.i18nKey}
                      ns="modals"
                      components={{ strong: <strong /> }}
                    />
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="min-h-11 flex-1"
            data-autofocus="true"
            onClick={onClose}
          >
            {t('iosInstall.actions.understood')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="min-h-11 flex-1"
            onClick={onClose}
          >
            {t('iosInstall.actions.later')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
