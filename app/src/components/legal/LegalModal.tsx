import type { ReactNode } from 'react';
import { Modal } from '@/components/Modal';
import type { LegalModalType } from '@/types/legal.types';

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
            internas da UFMG de forma simples e resiliente, inclusive com conectividade instavel.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Missao</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Melhorar a experiencia de deslocamento no campus com informacao clara de linhas, paradas
            e previsoes, sem quebrar o fluxo de uso do aplicativo.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Codigo aberto</h3>
          <p className="mt-2 text-sm text-text-secondary">
            O frontend e publico e evolui por fases com foco em acessibilidade, seguranca e LGPD.
          </p>
        </section>
      </div>
    ),
  },
  privacidade: {
    title: 'Politica de Privacidade',
    body: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-text-primary">Dados de localizacao</h3>
          <p className="mt-2 text-sm text-text-secondary">
            A localizacao e usada para melhorar a previsao de chegada e o acompanhamento
            colaborativo. Aplicamos minimizacao de dados e protecao de informacoes sensiveis.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Seus direitos (LGPD)</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Voce pode solicitar acesso, correcao e exclusao de dados conforme a LGPD.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Transparencia</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Explicamos de forma objetiva como os dados sao tratados e mantemos o app com controles
            de seguranca voltados para privacidade por padrao.
          </p>
        </section>
      </div>
    ),
  },
  termos: {
    title: 'Termos de Uso',
    body: (
      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold text-text-primary">Uso responsavel</h3>
          <p className="mt-2 text-sm text-text-secondary">
            O servico apoia deslocamento no campus. As previsoes podem variar conforme transito,
            operacao e colaboracao dos usuarios.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Disponibilidade</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Em cenarios offline, o app pode operar com dados em cache ou fallback estatico, sem
            garantia de atualizacao em tempo real.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-text-primary">Evolucao continua</h3>
          <p className="mt-2 text-sm text-text-secondary">
            O produto evolui por fases, com ajustes tecnicos e de usabilidade para manter
            confiabilidade e seguranca.
          </p>
        </section>
      </div>
    ),
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
