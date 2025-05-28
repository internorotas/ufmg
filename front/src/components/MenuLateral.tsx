import { useState } from "react";
import { LinhaOnibus } from "./LinhaOnibus";
import { DadosLinhas, Linha } from "../types/data.types";
import logo from "../assets/logo-horizontal-transparente.svg";
import arrowIcon from "../assets/arrow-icon.svg";
import closeIcon from "../assets/close-icon.svg";

interface MenuLateralProps {
  linhasData: DadosLinhas;
  onLinhaClick: (index: number, linhaInfo: Linha) => void;
}

export function MenuLateral({ linhasData, onLinhaClick }: MenuLateralProps) {
  const [isMenuVisible, setMenuVisible] = useState(false);

  const handleLinhaClickAndCloseMenu = (index: number, linha: Linha) => {
    onLinhaClick(index, linha);
    setMenuVisible(false); // Fecha o menu no mobile ao selecionar uma linha
  };

  const colorMap: { [key: string]: string } = {
    "um": "bg-violet-600 hover:bg-violet-700",
    "dois": "bg-red-700 hover:bg-red-800",
    "tres": "bg-green-800 hover:bg-green-900",
    "quatro": "bg-blue-800 hover:bg-blue-900",
    "tres-sabado": "bg-red-900 hover:bg-red-950",
    "dois-ferias": "bg-indigo-800 hover:bg-indigo-900",
    "tres-ferias": "bg-orange-700 hover:bg-orange-800",
  };

  return (
    <>
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[1001]">
        <button
          onClick={() => setMenuVisible(true)}
          className="bg-[#1a1819] text-gray-200 py-3 px-6 rounded-lg shadow-lg flex items-center gap-4 font-bold border-2 border-gray-700"
        >
          Ver Rotas e Horários <img src={arrowIcon} alt="->" className="h-4" />
        </button>
      </div>
      {isMenuVisible && (
        <div
          onClick={() => setMenuVisible(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-[1002]"
        ></div>
      )}
      <div
        className={`fixed md:relative top-0 left-0 h-full w-4/5 max-w-sm md:w-96 bg-[#1a1819] text-gray-200 z-[1003] transform transition-transform duration-300 ${
          isMenuVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <header className="bg-[#2c0eeb] p-3 flex justify-center items-center h-14">
          <img src={logo} alt="Logo Interno Rotas" className="h-8" />
        </header>
        <button
          onClick={() => setMenuVisible(false)}
          className="md:hidden absolute top-3 right-3 text-white p-1"
        >
          <img src={closeIcon} alt="Fechar" className="h-6 w-6" />
        </button>
        <main className="p-3 overflow-y-auto h-[calc(100%-56px)]">
          <section className="dia-itinerario flex justify-between font-medium text-lg my-2 px-1">
            <p>Dias Úteis</p>
            <p>
              <strong>UFMG</strong>
            </p>
          </section>
          {linhasData.diasUteis.map((linha, index) => (
            <LinhaOnibus
              key={`uteis-${index}`}
              linha={linha}
              onLinhaClick={() => handleLinhaClickAndCloseMenu(index, linha)}
              bgColor={colorMap[linha.tipo] || "bg-gray-500"}
            />
          ))}
          <section className="dia-itinerario flex justify-between font-medium text-lg mt-4 mb-2 px-1">
            <p>Linha Sábado</p>
          </section>
          {linhasData.sabado.map((linha, index) => (
            <LinhaOnibus
              key={`sabado-${index}`}
              linha={linha}
              onLinhaClick={() =>
                handleLinhaClickAndCloseMenu(
                  linhasData.diasUteis.length + index,
                  linha
                )
              }
              bgColor={colorMap[linha.tipo] || "bg-gray-500"}
            />
          ))}
          <section className="dia-itinerario flex justify-between font-medium text-lg mt-4 mb-2 px-1">
            <p>Férias e Recessos</p>
          </section>
          {linhasData.feriasRecessos.map((linha, index) => (
            <LinhaOnibus
              key={`ferias-${index}`}
              linha={linha}
              onLinhaClick={() =>
                handleLinhaClickAndCloseMenu(
                  linhasData.diasUteis.length +
                    linhasData.sabado.length +
                    index,
                  linha
                )
              }
              bgColor={colorMap[linha.tipo] || "bg-gray-500"}
            />
          ))}
        </main>
      </div>
    </>
  );
}
