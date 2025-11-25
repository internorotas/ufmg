import { Modal } from "./Modal";
import { Linha, Parada } from "../types/data.types";
import { buscarParadasPorIds } from "../../lib/utils";
import { IoLocationOutline } from "react-icons/io5";

interface ItinerarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  paradas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

/**
 * Renderiza um modal que exibe o itinerário de uma linha de ônibus específica.
 *
 * @param {object} props - As propriedades do componente.
 * @param {boolean} props.isOpen - Um booleano que indica se o modal está aberto.
 * @param {() => void} props.onClose - Uma função para fechar o modal.
 * @param {Linha} props.linha - Um objeto contendo os dados da linha de ônibus.
 * @param {Parada[]} props.paradas - Um array com todas as paradas de ônibus disponíveis.
 * @param {(parada: Parada) => void} props.onParadaClick - Uma função para lidar com cliques em uma parada de ônibus.
 * @returns {JSX.Element} O componente de modal de itinerário renderizado.
 */
export function ItinerarioModal({
  isOpen,
  onClose,
  linha,
  paradas,
  onParadaClick,
}: ItinerarioModalProps) {
  // Buscar paradas do itinerário
  const paradasDoItinerario = buscarParadasPorIds(linha.itinerarioParadasIds, paradas);

  const handleParadaClick = (parada: Parada) => {
    onParadaClick(parada);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Itinerário - ${linha.nome}`}
      maxWidth="max-w-lg"
    >
      <div className="relative">
        {paradasDoItinerario.length > 0 ? (
          <div className="relative">
            {paradasDoItinerario.map((parada, index) => {
              const isFirst = index === 0;
              const isLast = index === paradasDoItinerario.length - 1;
              
              return (
                <div key={parada.idParada} className="relative flex">
                  {/* Linha conectora vertical tracejada */}
                  {!isLast && (
                    <div 
                      className="absolute left-[11px] top-[28px] w-[2px] h-full"
                      style={{ 
                        backgroundColor: `${linha.corHex}40`,
                        backgroundImage: `repeating-linear-gradient(0deg, ${linha.corHex}40, ${linha.corHex}40 6px, transparent 6px, transparent 12px)`
                      }}
                    />
                  )}
                  
                  <button
                    onClick={() => handleParadaClick(parada)}
                    className="w-full text-left py-2 flex items-start gap-3 group"
                  >
                    {/* Ícone de localização com círculo */}
                    <div className="flex-shrink-0 relative z-10 mt-0.5">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${linha.corHex}20` }}
                      >
                        <IoLocationOutline 
                          size={18}
                          style={{ color: linha.corHex }}
                        />
                      </div>
                    </div>
                    
                    {/* Conteúdo da parada */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4 className="font-semibold text-[15px] text-text-primary leading-snug group-hover:underline">
                        {parada.nome}
                      </h4>
                      
                      {isFirst && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          Ponto de Origem/Destino
                        </p>
                      )}
                      {!isFirst && !isLast && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          Parada Regular
                        </p>
                      )}
                      
                      {isFirst && (
                        <span 
                          className="inline-block text-xs font-semibold mt-1 px-0"
                          style={{ color: linha.corHex }}
                        >
                          Partida
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma parada encontrada para este itinerário.</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-card rounded-lg p-4 text-sm text-center border border-card-border">
        <p className="text-text-secondary">
          💡 Clique em uma parada para visualizá-la no mapa
        </p>
      </div>
    </Modal>
  );
}
