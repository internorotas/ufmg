import { AlertTriangle, Ban, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { GpsActiveSessionConflictInfo } from '@/features/gps/api/gpsClient';
import { formatDurationHuman } from '@/lib/formatters';

interface GpsActiveSessionConflictDialogProps {
  conflict: GpsActiveSessionConflictInfo;
  onResolve: (action: 'finish' | 'abandon') => Promise<void>;
  onDismiss: () => void;
}

/**
 * P0.2/Fase J — sessão de rastreio já ativa em OUTRA linha (backend nunca
 * retoma silenciosamente, ver GPS_ACTIVE_SESSION_DIFFERENT_LINE). Usuário
 * decide: encerrar a sessão antiga (fecha normalmente, dados preservados),
 * marcar como abandonada (sessão estagnada, sem encerramento normal), ou
 * cancelar a tentativa de iniciar na linha nova.
 */
export function GpsActiveSessionConflictDialog({
  conflict,
  onResolve,
  onDismiss,
}: GpsActiveSessionConflictDialogProps) {
  const [pendingAction, setPendingAction] = useState<'finish' | 'abandon' | null>(null);
  const elapsedMs = Date.now() - new Date(conflict.lastActivityAt).getTime();

  const handleResolve = async (action: 'finish' | 'abandon') => {
    setPendingAction(action);
    try {
      await onResolve(action);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => !v && onDismiss()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded bg-warning-bg text-warning-text">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <Dialog.Title className="text-base font-semibold leading-snug">
                Rastreio já ativo em outra linha
              </Dialog.Title>
            </div>

            <Dialog.Description className="text-sm text-text-secondary">
              Você tem uma sessão de rastreio ativa na linha{' '}
              <span className="font-semibold text-text-primary">{conflict.linhaId}</span>
              {conflict.staleCandidate
                ? ` — sem atividade há ${formatDurationHuman(elapsedMs)}.`
                : ', iniciada recentemente.'}{' '}
              Encerre ou marque como abandonada antes de iniciar o rastreio nesta linha.
            </Dialog.Description>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={pendingAction !== null}
                onClick={() => void handleResolve('finish')}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {pendingAction === 'finish' ? 'Encerrando…' : 'Encerrar sessão anterior'}
                </span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={pendingAction !== null}
                onClick={() => void handleResolve('abandon')}
              >
                <span className="flex items-center gap-2">
                  <Ban size={15} aria-hidden="true" />
                  {pendingAction === 'abandon' ? 'Marcando…' : 'Marcar como abandonada'}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                disabled={pendingAction !== null}
                onClick={onDismiss}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
