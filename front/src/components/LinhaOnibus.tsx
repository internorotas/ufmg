import React, { useState } from "react";
import { Linha } from "../types/data.types";

interface LinhaOnibusProps {
  linha: Linha;
  onLinhaClick: () => void;
  bgColor: string;
}

export function LinhaOnibus({
  linha,
  onLinhaClick,
  bgColor,
}: LinhaOnibusProps) {
  const [isItinerarioVisible, setItinerarioVisible] = useState(false);
  const [isHorariosVisible, setHorariosVisible] = useState(false);

  const sublinha = linha.sublinha
    ? `<p class="text-xs font-normal">${linha.sublinha}</p>`
    : "";

  const handleItinerarioToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setItinerarioVisible(!isItinerarioVisible);
  };

  const handleHorariosToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setHorariosVisible(!isHorariosVisible);
  };

  return (
    <div className="mb-2">
      <button
        onClick={onLinhaClick}
        className={`w-full p-2 rounded-lg text-white font-bold flex justify-between items-center transition-colors shadow-md ${bgColor}`}
      >
        <div
          className="text-left"
          dangerouslySetInnerHTML={{
            __html: `<h1 class="text-base">${linha.nome}</h1>${sublinha}`,
          }}
        />
      </button>

      <div className="py-2 px-1">
        <div className="flex space-x-2 mb-2">
          <button
        onClick={handleItinerarioToggle}
        className="text-sm bg-gray-700 hover:bg-gray-600 text-internoRotas-bege-areia px-3 py-1 rounded-md transition-colors"
          >
        {isItinerarioVisible ? "Esconder" : "Ver"} Itinerário
          </button>
          <button
        onClick={handleHorariosToggle}
        className="text-sm bg-gray-700 hover:bg-gray-600 text-internoRotas-bege-areia px-3 py-1 rounded-md transition-colors"
          >
        {isHorariosVisible ? "Esconder" : "Ver"} Horários
          </button>
        </div>

        <div
          className={`transition-all duration-700 ease-out overflow-hidden ${
        isItinerarioVisible ? "max-h-screen opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}
        >
          {isItinerarioVisible && (
        <ul className="bg-gray-800 p-4 rounded-md text-sm list-disc list-inside space-y-1">
          {linha.itinerario.map((item, index) => (
        <li key={index}>{item}</li>
          ))}
        </ul>
          )}
        </div>

        <div
          className={`transition-all duration-700 ease-out overflow-hidden ${
        isHorariosVisible ? "max-h-screen opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}
        >
          {isHorariosVisible && (
        <ul className="bg-gray-800 p-4 rounded-md text-sm list-disc list-inside space-y-1">
          {linha.horarios.map((item, index) => (
        <li key={index}>{item}</li>
          ))}
        </ul>
          )}
        </div>
      </div>
    </div>
  );
}
