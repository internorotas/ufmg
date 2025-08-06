// Tipos auxiliares para os dados completos
export interface DadosLinhas {
  diasUteis: Linha[];
  sabado: Linha[];
  feriasRecessos: Linha[];
}

export interface DadosRotas {
  rotas: Rota[];
}
// Tipos para os dados das linhas, usados no Menu Lateral
export interface Linha {
  idRota?: number;
  linha?: number;
  nome: string;
  tipo: string;
  sublinha: string | null;
  categoriaDia?: string;
  idCor?: string;
  corHex?: string;
  horarios: string[];
  itinerario: (string | number)[];
}

// Tipos para os dados das rotas, usados para desenhar no Mapa
export interface Rota {
  linha: number;
  sublinha: string | null;
  cor: string;
  coordinates: number[][];
}

// Tipos para os dados das paradas, usados para os marcadores no Mapa
export interface Parada {
  idParada?: number;
  nome: string;
  linhaAtendidas: string[];
  coordinates: [number, number];
}

// --- TIPOS CORRIGIDOS PARA O GEOJSON (SEM 'ANY') ---

// Tipos para as geometrias específicas que usamos
interface PointGeometry {
  type: "Point";
  coordinates: [number, number]; // Um par de [longitude, latitude]
}

interface LineStringGeometry {
  type: "LineString";
  coordinates: [number, number][]; // Uma lista de pares [longitude, latitude]
}

// Tipos para as propriedades específicas de cada GeoJSON
interface RotaProperties {
  id_rota: number;
  nome_display: string;
  variante_nome: string | null;
  categoria: string;
  identificador_cor_tema: string;
  cor_hex_leaflet: string;
  horarios: string[];
  itinerario_paradas_ids: (string | number)[];
}

interface ParadaProperties {
  id_parada: number;
  nome: string;
  linhasAtendidasNomes: string[];
}

// Tipos específicos para as features de Rotas e Paradas, com a geometria correta
export interface RotaFeature {
  type: "Feature";
  properties: RotaProperties;
  geometry: LineStringGeometry; // Usa a geometria de Linha
}

export interface ParadaFeature {
  type: "Feature";
  properties: ParadaProperties;
  geometry: PointGeometry; // Usa a geometria de Ponto
}

export interface FeatureCollection<T> {
  type: "FeatureCollection";
  features: T[];
}