import { MapPin, Navigation } from 'lucide-react';
import type { ReactNode } from 'react';
import { DISTANCIA_MAXIMA_KM } from '../../hooks/useLocalizacaoUsuario';
import { Modal } from '../Modal';
import { Button } from '../ui/Button';

interface ModalManagerProps {
  erroLocalizacao: string | null;
  carregandoLocalizacao: boolean;
  mostrarModalPermissao: boolean;
  mostrarModalLonge: boolean;
  onClosePermissao: () => void;
  onCloseLonge: () => void;
  onPermitirLocalizacao: () => void;
  onVoltarUFMG: () => void;
  onContinuarAqui: () => void;
}

export function ModalManager({
  erroLocalizacao,
  carregandoLocalizacao,
  mostrarModalPermissao,
  mostrarModalLonge,
  onClosePermissao,
  onCloseLonge,
  onPermitirLocalizacao,
  onVoltarUFMG,
  onContinuarAqui,
}: ModalManagerProps): ReactNode {
  return (
    <>
      <Modal
        isOpen={mostrarModalPermissao}
        onClose={onClosePermissao}
        titleLabel="Ativar localização"
        description="Permita acesso à localização para mostrar sua posição no mapa e encontrar paradas próximas."
        title={
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10">
              <Navigation aria-hidden="true" className="h-4 w-4 text-brand-primary" />
            </span>
            <span>Ativar Localização</span>
          </div>
        }
        size="sm"
      >
        <div className="space-y-4 p-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary shadow-sm">
              <MapPin aria-hidden="true" className="h-8 w-8 text-text-inverse" />
            </div>
            <p className="text-text-secondary">
              Para mostrar sua localização no mapa e te ajudar a encontrar a parada mais próxima,
              precisamos acessar seu GPS.
            </p>
          </div>
          {erroLocalizacao && (
            <div className="rounded-lg bg-warning-bg p-3 text-center text-sm text-warning-text">
              {erroLocalizacao}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              fullWidth
              disabled={carregandoLocalizacao}
              data-autofocus="true"
              onClick={onPermitirLocalizacao}
            >
              {carregandoLocalizacao ? 'Obtendo localização...' : 'Permitir Localização'}
            </Button>
            <Button variant="ghost" fullWidth onClick={onClosePermissao}>
              Agora não
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={mostrarModalLonge}
        onClose={onCloseLonge}
        title="Você está longe do campus"
        description={`Você está a mais de ${DISTANCIA_MAXIMA_KM} quilômetros da UFMG e pode voltar a centralizar o mapa no campus ou continuar na posição atual.`}
        size="sm"
      >
        <div className="space-y-4 p-4">
          <div className="text-center">
            <p className="text-text-secondary">
              Parece que você está a mais de {DISTANCIA_MAXIMA_KM}km da UFMG. Deseja voltar a
              visualizar o campus no mapa?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" fullWidth data-autofocus="true" onClick={onVoltarUFMG}>
              Voltar para a UFMG
            </Button>
            <Button variant="ghost" fullWidth onClick={onContinuarAqui}>
              Continuar aqui
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
