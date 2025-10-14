import { Modal } from "./Modal";
import { IoLocationSharp } from "react-icons/io5";
import { Linha, Parada } from "../types/data.types";

interface ItinerarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  linha: Linha;
  paradas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

export function ItinerarioModal({
  isOpen,
  onClose,
  linha,
  paradas,
  onParadaClick,
}: ItinerarioModalProps) {
  // Buscar paradas do itinerário
  const paradasDoItinerario = linha.itinerarioParadasIds
    .map((idParada) => paradas.find((p) => p.idParada === idParada))
    .filter((p): p is Parada => p !== undefined);

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
      <div className="space-y-2">
        {paradasDoItinerario.length > 0 ? (
          paradasDoItinerario.map((parada, index) => (
            <button
              key={parada.idParada}
              onClick={() => handleParadaClick(parada)}
              className="w-full text-left p-4 bg-internoRotas-cinza-grafite hover:bg-internoRotas-azul-eletrico rounded-lg transition-all flex items-start gap-3 group"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded-full bg-internoRotas-azul-eletrico group-hover:bg-white flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <IoLocationSharp className="text-internoRotas-laranja-ambar mt-1 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="font-semibold text-base">{parada.nome}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {parada.linhasAtendidas.length} linha{parada.linhasAtendidas.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Nenhuma parada encontrada para este itinerário.</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-internoRotas-cinza-grafite rounded-lg p-4 text-sm text-center">
        <p className="text-gray-300">
          Clique em uma parada para visualizá-la no mapa
        </p>
      </div>
    </Modal>
  );
}
