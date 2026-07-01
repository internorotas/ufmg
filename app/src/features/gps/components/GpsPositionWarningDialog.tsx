import { AlertTriangle, MapPin, Radio } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import type { Linha } from '@/types/data.types';

interface GpsPositionWarningDialogProps {
  open: boolean;
  linha: Linha;
  distanceMeters: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GpsPositionWarningDialog({
  open,
  linha,
  distanceMeters,
  onConfirm,
  onCancel,
}: GpsPositionWarningDialogProps) {
  const distText =
    distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onCancel()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup size="sm">
          <div className="flex flex-col gap-4 p-5">
            {/* Ícone */}
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded bg-warning-bg text-warning-text">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <Dialog.Title className="text-base font-semibold leading-snug">
                Você está longe desta linha
              </Dialog.Title>
            </div>

            <Dialog.Description className="sr-only">
              Aviso de validação de posição GPS para contribuição colaborativa.
            </Dialog.Description>

            {/* Detalhes */}
            <div className="neo-brutal bg-card p-3">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
                  style={{ backgroundColor: `${linha.corHex}22`, color: linha.corHex }}
                  aria-hidden="true"
                >
                  {linha.linha}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{linha.nome}</p>
                  {linha.sublinha ? (
                    <p className="truncate text-xs text-text-secondary">{linha.sublinha}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <p className="text-sm text-text-secondary">
              Sua localização está{' '}
              <span className="font-semibold text-warning-text">~{distText}</span> do trajeto desta
              linha. Verifique se selecionou a sublinha correta — trajetos diferentes podem gerar
              dados sobrepostos.
            </p>

            <div className="flex items-center gap-1.5 rounded-lg bg-background-secondary px-3 py-2.5 text-xs text-text-secondary">
              <MapPin size={13} className="shrink-0 text-text-tertiary" aria-hidden="true" />
              <span>
                O rastreio para automaticamente se você sair do trajeto após{' '}
                <strong className="text-text-primary">300 m</strong>.
              </span>
            </div>

            {/* Ações */}
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="primary"
                fullWidth
                onClick={onConfirm}
              >
                <span className='flex gap-2 items-center'>

                <Radio size={15} aria-hidden="true" />
                Contribuir mesmo assim
                </span>
              </Button>
              <Button type="button" variant="ghost" fullWidth onClick={onCancel}>
                Escolher outra linha
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
