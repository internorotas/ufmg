import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/Button';

interface LgpdConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => Promise<void>;
  onRefuse: () => Promise<void>;
}

export function LgpdConsentDialog({ isOpen, onClose, onAccept, onRefuse }: LgpdConsentDialogProps) {
  const { t } = useTranslation('common');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('lgpdConsent.title')}
      description={t('lgpdConsent.description')}
      size="sm"
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/12">
          <ShieldCheck size={30} className="text-brand-primary" aria-hidden="true" />
        </div>

        <p className="text-sm leading-relaxed text-text-secondary">{t('lgpdConsent.purpose')}</p>
        <p className="text-xs leading-relaxed text-text-tertiary">{t('lgpdConsent.retention')}</p>

        <div className="mt-2 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant="primary"
            onClick={() => void onAccept()}
            className="min-h-11"
          >
            {t('lgpdConsent.actions.accept')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRefuse()}
            className="min-h-11"
          >
            {t('lgpdConsent.actions.refuse')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
