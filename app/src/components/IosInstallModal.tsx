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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar à tela inicial"
      description="No iOS, notificações web exigem o app instalado como atalho na tela inicial."
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Para receber notificações no iPhone, instale o app na Tela de Início e abra por lá.
        </p>

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
                  <p className="text-sm text-text-primary">{passo.descricao}</p>
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
            Entendi
          </Button>
          <Button type="button" variant="ghost" size="md" className="min-h-11 flex-1" onClick={onClose}>
            Agora não
          </Button>
        </div>
      </div>
    </Modal>
  );
}
