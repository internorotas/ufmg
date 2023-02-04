// Importando as rotas dos ônibus
import data from "./dadosRotas.json" assert { type: "json" };

console.log(data);

// Abrindo o mapa com centro na UFMG e o zoom
const map = L.map("mapa").setView([-19.868035, -43.965033], 15, {
  maxZoom: 21,
  zoomControl: true,
});

// Atribuição requerida pelo OPSM para usar o seu mapa, é obrigatório pela licença
const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(
  tileUrl,
  {
    maxZoom: 21,
    maxNativeZoom: 19,
  },
  { attribution }
);
tiles.addTo(map);

// Configurações dos ícones de marcadores das paradas de ônibus
const stationIcon = L.icon({
  iconUrl: "./src/assets/marker.svg",
  iconSize: [20, 20],
  iconAnchor: [0, 0],
});

// Nome e descrição dos marcadores de paradas dos ônibus
let nome =
  `<h4>${data.paradas[0].nome}</h4>` +
  `<span>${data.paradas[0].linhaAtendidas}</span>`;

// Pega as configurações do ícone e coloca ele no mapa, puxando as coordenadas do arquivo de JSON
const marker = L.marker(data.paradas[0].coordinates[0], {
  icon: stationIcon,
}).addTo(map);
marker.bindPopup(nome);

// Pega as coordenadas da linha no JSON
const latlngs = [data.rotas[0].coordinates];

// Configurações do traçado da rota do ônibus
const options = {
  use: L.polyline,
  delay: 600,
  dashArray: [40, 100],
  weight: 10,
  color: "#f6a91e",
  pulseColor: "#f6a91e",
};
// Cria o traçado no mapa com as configurações definidas e o coloca no mapa
let polyline = new L.Polyline.AntPath(latlngs, options);
polyline.addTo(map);

// Pega as coordenadas da linha no JSON
const latlngsLinhaDois = [data.rotas[1].coordinates];

// Configurações do traçado da rota do ônibus
const optionsLinhaDois = {
  use: L.polyline,
  delay: 600,
  dashArray: [40, 100],
  weight: 10,
  color: "#f6451e",
  pulseColor: "#f6451e",
};

// Cria o traçado no mapa com as configurações definidas e o coloca no mapa
let polylineLinhaDois = new L.Polyline.AntPath(
  latlngsLinhaDois,
  optionsLinhaDois
);
polylineLinhaDois.addTo(map);

// Pega as coordenadas da linha no JSON
const latlngsLinhaTres = [data.rotas[2].coordinates];

// Configurações do traçado da rota do ônibus
const optionsLinhaTres = {
  use: L.polyline,
  delay: 600,
  dashArray: [40, 100],
  weight: 10,
  color: "#2a8500",
  pulseColor: "#2a8500",
};

// Cria o traçado no mapa com as configurações definidas e o coloca no mapa
let polylineLinhaTres = new L.Polyline.AntPath(
  latlngsLinhaTres,
  optionsLinhaTres
);
polylineLinhaTres.addTo(map);

// Pega as coordenadas da linha no JSON
const latlngsLinhaQuatro = [data.rotas[3].coordinates];

// Configurações do traçado da rota do ônibus
const optionsLinhaQuatro = {
  use: L.polyline,
  delay: 800,
  dashArray: [40, 100],
  weight: 10,
  color: "#293291",
  pulseColor: "#293291",
};

// Cria o traçado no mapa com as configurações definidas e o coloca no mapa
let polylineLinhaQuatro = new L.Polyline.AntPath(
  latlngsLinhaQuatro,
  optionsLinhaQuatro
);
polylineLinhaQuatro.addTo(map);
