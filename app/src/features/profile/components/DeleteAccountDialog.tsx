import { AlertTriangle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

const REQUIRED_CONFIRMATION_TEXT = 'EXCLUIR';

export function DeleteAccountDialog({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: DeleteAccountDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const isConfirmationValid = useMemo(
    () => confirmationText.trim().toUpperCase() === REQUIRED_CONFIRMATION_TEXT,
    [confirmationText],
  );

  const handleClose = () => {
    if (isPending) {
      return;
    }

    setConfirmationText('');
    onClose();
  };

  const handleConfirm = async () => {
    if (!isConfirmationValid || isPending) {
      return;
    }

    await onConfirm();
    setConfirmationText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Excluir conta"
      description="Fluxo LGPD para solicitação de exclusão com dupla confirmação."
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-warning-border bg-warning-bg/60 p-4">
          <div className="mb-2 flex items-center gap-2 text-warning-text">
            <AlertTriangle size={18} aria-hidden="true" />
            <strong className="text-sm">Ação irreversível</strong>
          </div>
          <p className="text-sm text-warning-text">
            Sua conta será marcada para anonimização completa em até 30 dias. O acesso é encerrado
            imediatamente após a solicitação.
          </p>
        </div>

        <label htmlFor="delete-account-confirm" className="text-sm font-medium text-text-primary">
          Digite <strong>{REQUIRED_CONFIRMATION_TEXT}</strong> para confirmar
        </label>
        <Input
          id="delete-account-confirm"
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder="EXCLUIR"
          autoComplete="off"
          autoCapitalize="characters"
          className="uppercase"
        />

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            className="min-h-11"
            onClick={() => void handleConfirm()}
            disabled={!isConfirmationValid || isPending}
            loading={isPending}
          >
            Confirmar exclusão
          </Button>
        </div>
      </div>
    </Modal>
  );
}
