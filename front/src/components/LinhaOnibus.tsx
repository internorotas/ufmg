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

  const sublinha = linha.sublinha
    ? `<p class="text-xs font-normal">${linha.sublinha}</p>`
    : "";

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setItinerarioVisible(!isItinerarioVisible);
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
        <button
          onClick={handleToggleClick}
          className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1 rounded-md"
        >
          {isItinerarioVisible ? "Esconder" : "Ver"} Itinerário
        </button>
      </div>

      {isItinerarioVisible && (
        <ul className="bg-gray-800 p-4 rounded-md text-sm list-disc list-inside space-y-1">
          {linha.itinerario.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
