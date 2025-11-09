import React, { useState, useMemo } from "react";
import { Linha, Parada } from "../types/data.types";
import { HorariosModal } from "./HorariosModal";
import { ItinerarioModal } from "./ItinerarioModal";
import { IoTimeOutline, IoMapOutline } from "react-icons/io5";
import { calculateNextAndPreviousSchedule } from "../../lib/utils";

interface LinhaOnibusProps {
  linha: Linha;
  onLinhaClick: () => void;
  bgColor: string;
  paradas: Parada[];
  onParadaClick: (parada: Parada) => void;
}

/**
 * Renderiza um componente que exibe informações sobre uma linha de ônibus e fornece acesso ao seu itinerário e horários.
 *
 * @param {object} props - As propriedades do componente.
 * @param {Linha} props.linha - Um objeto contendo os dados da linha de ônibus.
 * @param {() => void} props.onLinhaClick - Uma função para lidar com cliques na linha.
 * @param {string} props.bgColor - A cor de fundo para o cabeçalho da linha.
 * @param {Parada[]} props.paradas - Um array com todas as paradas de ônibus disponíveis.
 * @param {(parada: Parada) => void} props.onParadaClick - Uma função para lidar com cliques em uma parada de ônibus.
 * @returns {JSX.Element} O componente de linha de ônibus renderizado.
 */
export function LinhaOnibus({
  linha,
  onLinhaClick,
  bgColor,
  paradas,
  onParadaClick,
}: LinhaOnibusProps) {
  const [isItinerarioVisible, setItinerarioVisible] = useState(false);
  const [isHorariosVisible, setHorariosVisible] = useState(false);

  // Calcular horários anterior e próximo
  const { nextSchedule, previousSchedule } = useMemo(() => 
    calculateNextAndPreviousSchedule(linha.horarios), 
    [linha.horarios]
  );

  const sublinha = linha.sublinha
    ? `<p class="text-xs font-normal">${linha.sublinha}</p>`
    : "";

  const handleItinerarioToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setItinerarioVisible(true);
  };

  const handleHorariosToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setHorariosVisible(true);
  };

  return (
    <>
      <div className="mb-2">
        <button
          onClick={onLinhaClick}
          className={`w-full p-3 rounded-t-lg text-white font-bold flex justify-between items-center transition-colors shadow-md ${bgColor}`}
        >
          <div
            className="text-left"
            dangerouslySetInnerHTML={{
              __html: `<h1 class="text-base">${linha.nome}</h1>${sublinha}`,
            }}
          />
        </button>

        <div className="py-2 px-1 bg-internoRotas-cinza-grafite rounded-b-lg">
          <div className="p-4 bg-internoRotas-cinza-grafite text-white">
            {/* Horários Anterior e Próximo */}
            <div className="flex justify-between text-center mb-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Último Partiu</p>
                <p className="text-xl font-bold">{previousSchedule}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Próximo</p>
                <p className="text-xl font-bold text-green-400">{nextSchedule}</p>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <button
                onClick={handleItinerarioToggle}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-internoRotas-azul-eletrico hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                <IoMapOutline size={18} />
                Itinerário
              </button>
              <button
                onClick={handleHorariosToggle}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-internoRotas-laranja-ambar hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
              >
                <IoTimeOutline size={18} />
                Mais Horários
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <HorariosModal
        isOpen={isHorariosVisible}
        onClose={() => setHorariosVisible(false)}
        linha={linha}
      />
      <ItinerarioModal
        isOpen={isItinerarioVisible}
        onClose={() => setItinerarioVisible(false)}
        linha={linha}
        paradas={paradas}
        onParadaClick={onParadaClick}
      />
    </>
  );
}
