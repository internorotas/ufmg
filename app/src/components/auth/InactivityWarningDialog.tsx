import { LogOut, Timer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

interface InactivityWarningDialogProps {
  open: boolean;
  onContinue: () => void;
}

export function InactivityWarningDialog({ open, onContinue }: InactivityWarningDialogProps) {
  return (
    // onOpenChange omitido: dialog não deve fechar com Escape/clique fora
    // — apenas "Continuar sessão" ou o timeout automático fecham
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm" className="mx-4 w-full max-w-sm">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning-text">
                <Timer size={20} aria-hidden="true" />
              </span>
              <Dialog.Title className="text-base font-semibold leading-snug">
                Sessão prestes a expirar
              </Dialog.Title>
            </div>

            <Dialog.Description className="text-sm text-text-secondary">
              Você ficou inativo por um tempo. Por segurança, será desconectado em{' '}
              <strong className="text-text-primary">5 minutos</strong> caso não interaja com o app.
            </Dialog.Description>

            <div className="flex flex-col gap-2">
              <Button type="button" variant="primary" fullWidth onClick={onContinue}>
                Continuar sessão
              </Button>
              <div className="flex items-center gap-1.5 rounded-lg bg-background-secondary px-3 py-2 text-xs text-text-tertiary">
                <LogOut size={12} aria-hidden="true" />
                <span>Logout automático em 5 min se não houver ação.</span>
              </div>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
