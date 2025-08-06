export interface Linha {
  linha: number;
  nome: string;
  tipo: string;
  sublinha: string | null;
  horarios: string[];
  itinerario: string[];
}

export interface DadosLinhas {
  diasUteis: Linha[];
  sabado: Linha[];
  feriasRecessos: Linha[];
}

export interface Parada {
  nome: string;
  linhaAtendidas: string[];
  coordinates: [number, number];
}

export interface Rota {
  linha: number;
  sublinha: string | null;
  coordinates: [number, number][];
}

export interface DadosRotas {
  rotas: Rota[];
  paradas: Parada[];
}