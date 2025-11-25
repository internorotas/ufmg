// Tipos auxiliares para os dados completos
export interface DadosLinhas {
  id: number;
  categoriaDia: string;
  displayName: string;
  exibir?: boolean;
  linhas: Linha[];
}

export interface CategoriaLinhas {
  categoriasDias: DadosLinhas[];
}

export interface DadosRotas {
  rotas: Trajeto[];
}
// Tipos para os dados das linhas, usados no Menu Lateral
export interface Linha {
  idRota: string;
  linha: number;
  nome: string;
  tipo: string;
  sublinha: string | null;
  categoriaDia: string;
  corHex: string;
  descricao: string;
  horarios: string[];
  itinerarioParadasIds: string[];
  // Coordenadas devem ser sempre tuplas de [latitude, longitude]
  coordenadasTrajeto: [number, number][];
}

// Tipos para os dados das rotas, usados para desenhar no Mapa
export interface Trajeto {
  linha: string;
  sublinha: string | null;
  cor: string;
  // Corrigido: Leaflet espera [lat, lng], não number[][] genérico
  coordenadas: [number, number][];
}

// Tipos para os dados das paradas, usados para os marcadores no Mapa
export interface Parada {
  idParada: string;
  nome: string;
  linhasAtendidas: string[];
  categoria: string;
  descricao: string;
  // Corrigido: Tupla explícita
  coordenadas: [number, number];
}
