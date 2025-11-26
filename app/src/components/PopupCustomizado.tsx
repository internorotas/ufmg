import { Popup } from "react-leaflet";
import { Parada } from "../types/data.types";
import { IoBusOutline, IoLocationSharp } from "react-icons/io5";

interface PopupCustomizadoProps {
  parada: Parada;
}

/**
 * Renderiza um popup customizado para um marcador de parada de ônibus no mapa.
 *
 * @param {object} props - As propriedades do componente.
 * @param {Parada} props.parada - Um objeto contendo os dados da parada de ônibus.
 * @returns {JSX.Element} O componente de popup customizado renderizado.
 */
export function PopupCustomizado({ parada }: PopupCustomizadoProps) {
  return (
    <Popup className="popup-customizado" minWidth={220}>
      <div className="min-w-[220px]">
        {/* Cabeçalho */}
        <div className="flex items-start gap-2 mb-3">
          <IoLocationSharp
            className="text-internoRotas-laranja-ambar mt-1 flex-shrink-0"
            size={22}
          />
          <div>
            <h3 className="font-bold text-base leading-tight text-text-primary">
              {parada.nome}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {parada.categoria}
            </p>
          </div>
        </div>

        {/* Linhas Atendidas */}
        {parada.linhasAtendidas && parada.linhasAtendidas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-card-border">
            <div className="flex items-center gap-2 mb-2">
              <IoBusOutline
                className="text-internoRotas-azul-eletrico"
                size={16}
              />
              <p className="text-xs font-semibold text-text-primary">
                {parada.linhasAtendidas.length} linha
                {parada.linhasAtendidas.length !== 1 ? "s" : ""} atende
                {parada.linhasAtendidas.length === 1 ? "" : "m"} aqui:
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parada.linhasAtendidas.map((nomeLinha, index) => (
                <span
                  key={index}
                  className="text-xs bg-internoRotas-azul-eletrico text-white px-2 py-1 rounded font-medium"
                >
                  {nomeLinha}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descrição */}
        {parada.descricao && parada.descricao !== parada.nome && (
          <div className="mt-3 pt-3 border-t border-card-border">
            <p className="text-xs text-text-secondary italic">
              {parada.descricao}
            </p>
          </div>
        )}
      </div>
    </Popup>
  );
}
