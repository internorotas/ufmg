import React, { useState, useMemo } from "react";
import { Linha } from "../types/data.types";

interface LinhaOnibusProps {
  linha: Linha;
  onLinhaClick: () => void;
  bgColor: string;
}

// Função para converter horário "HH:MM" em minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Função para converter minutos de volta para "HH:MM"
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Função para calcular próximo e anterior horário
const calculateNextAndPreviousSchedule = (horarios: string[]) => {
  if (!horarios || horarios.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--" };
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const schedulesInMinutes = horarios
    .filter(time => time && time.includes(':')) // Filtrar horários válidos
    .map(timeToMinutes)
    .sort((a, b) => a - b);
  
  if (schedulesInMinutes.length === 0) {
    return { nextSchedule: "--:--", previousSchedule: "--:--" };
  }
  
  let nextSchedule = "--:--";
  let previousSchedule = "--:--";
  
  // Encontrar próximo horário
  const next = schedulesInMinutes.find(schedule => schedule > currentMinutes);
  if (next !== undefined) {
    nextSchedule = minutesToTime(next);
  } else if (schedulesInMinutes.length > 0) {
    // Se não há mais horários hoje, o próximo é o primeiro de amanhã
    nextSchedule = minutesToTime(schedulesInMinutes[0]);
  }
  
  // Encontrar horário anterior
  const previousSchedules = schedulesInMinutes.filter(schedule => schedule < currentMinutes);
  if (previousSchedules.length > 0) {
    previousSchedule = minutesToTime(Math.max(...previousSchedules));
  } else if (schedulesInMinutes.length > 0) {
    // Se não há horários anteriores hoje, o anterior é o último de ontem
    previousSchedule = minutesToTime(schedulesInMinutes[schedulesInMinutes.length - 1]);
  }
  
  return { nextSchedule, previousSchedule };
};

export function LinhaOnibus({
  linha,
  onLinhaClick,
  bgColor,
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
        className={`w-full p-2 rounded-t-lg text-white font-bold flex justify-between items-center transition-colors shadow-md ${bgColor}`}
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
          <div className="flex justify-between text-center mb-4">
            <div>
              <p className="text-sm text-gray-400">Anterior</p>
              <p className="text-2xl font-bold">{previousSchedule}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Próximo</p>
              <p className="text-2xl font-bold">{nextSchedule}</p>
            </div>
          </div>
          <div className="flex justify-between space-x-2">
            <button
              onClick={handleItinerarioToggle}
              className="flex-1 text-sm bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Itinerário
            </button>
            <button
              onClick={handleHorariosToggle}
              className="flex-1 text-sm bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Mais horários
            </button>
          </div>
        </div>

        <div
          className={`transition-all duration-700 ease-out overflow-hidden ${
            isItinerarioVisible
              ? "max-h-screen opacity-100 mt-2"
              : "max-h-0 opacity-0"
          }`}
        >
          {isItinerarioVisible && (
            <ul className="bg-gray-800 p-4 rounded-md text-sm list-disc list-inside space-y-1">
              {linha.itinerarioParadasIds.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div
          className={`transition-all duration-700 ease-out overflow-hidden ${
            isHorariosVisible
              ? "max-h-screen opacity-100 mt-2"
              : "max-h-0 opacity-0"
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
