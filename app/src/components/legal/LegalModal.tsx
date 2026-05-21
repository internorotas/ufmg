import type { ReactNode } from 'react';
import { Modal } from '@/components/Modal';
import type { LegalModalType } from '@/types/legal.types';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';
import { TermsOfUseContent } from './TermsOfUseContent';

interface LegalModalProps {
  modalType: LegalModalType | null;
  onClose: () => void;
}

const LEGAL_CONTENT: Record<LegalModalType, { title: string; body: ReactNode }> = {
  sobre: {
    title: 'Sobre o Interno Rotas',
    body: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-text-primary">Projeto colaborativo</h3>
          <p className="mt-2 text-sm text-text-secondary">
            O Interno Rotas ajuda estudantes, servidores e visitantes a acompanhar as linhas
            internas universitárias de forma simples e resiliente, inclusive com conectividade
            instável.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Missão</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Melhorar a experiência de deslocamento no campus com informação clara de linhas, paradas
            e previsões, sem quebrar o fluxo de uso do aplicativo.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Código aberto</h3>
          <p className="mt-2 text-sm text-text-secondary">
            O frontend é público e evolui por fases com foco em acessibilidade, segurança e LGPD.
          </p>
        </section>
      </div>
    ),
  },
  privacidade: {
    title: 'Política de Privacidade',
    body: <PrivacyPolicyContent />,
  },
  termos: {
    title: 'Termos de Uso',
    body: <TermsOfUseContent />,
  },
};

export function LegalModal({ modalType, onClose }: LegalModalProps) {
  if (!modalType) {
    return null;
  }

  const content = LEGAL_CONTENT[modalType];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={content.title}
      size="xl"
      aria-label={`Modal ${content.title}`}
    >
      {content.body}
    </Modal>
  );
}
