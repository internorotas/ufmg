/**
 * IosInstallModal - Modal educativo para usuários de iPhone não-PWA
 *
 * Exibido quando o utilizador tenta ativar um alarme no Safari iOS
 * sem ter o app instalado na Tela de Início.
 */

import { Bell, Plus, Share } from 'lucide-react';
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
    descricao: (
      <>
        Toque no ícone de <span className="font-semibold">Compartilhar</span> (quadrado com seta
        para cima) na barra inferior do Safari.
      </>
    ),
  },
  {
    id: 'adicionar',
    icone: Plus,
    descricao: (
      <>
        Toque em <span className="font-semibold">"Adicionar à Tela de Início"</span>.
      </>
    ),
  },
  {
    id: 'abrir',
    icone: Bell,
    descricao: <>Abra o aplicativo por lá e ative seu alarme!</>,
  },
];

export function IosInstallModal({ isOpen, onClose }: IosInstallModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alarmes no iPhone" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          A Apple exige que você adicione este app à sua Tela de Início para poder receber alertas
          de quando o ônibus estiver chegando, inclusive com o app fechado.
        </p>

        <ol className="space-y-2">
          {PASSOS.map((passo, idx) => {
            const Icone = passo.icone;
            return (
              <li
                key={passo.id}
                className="flex items-start gap-3 rounded-lg border border-card-border bg-background-secondary p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-text-inverse">
                  {idx + 1}
                </div>
                <div className="flex items-start gap-2">
                  <Icone size={15} className="mt-0.75 shrink-0 text-brand-accent" />
                  <p className="text-sm text-text-primary">{passo.descricao}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <Button type="button" variant="secondary" size="md" className="w-full" onClick={onClose}>
          Entendi
        </Button>
      </div>
    </Modal>
  );
}
