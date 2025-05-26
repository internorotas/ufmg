// Importando as rotas dos ônibus
import data from "./dadosRotas.js";

console.log(data);

// Abrindo o mapa com centro na UFMG e o zoom
const map = L.map("mapa").setView(
  [-19.870553062661006, -43.96775991703787],
  15,
  {
    maxZoom: 21,
    zoomControl: true,
  }
);

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

let coresLinhas = [
  // "#228B22",
  // "#C00000",
  // "#3b49df",

  "#8A2BE2",
  "#B22222",
  "#B22222",
  "#006400",
  "#006400",
  "#006400",
  "#00008B",
  "#00008B",
  "#00008B",
  "#00008B",
  "#800020",
  "#4B0082",
  "#D2691E",
];

let active_polyline = L.featureGroup().addTo(map);

function exibeLinha(posicao) {
  active_polyline.clearLayers();

  // Pega as coordenadas da linha no JSON
  const latlngs = [data.rotas[posicao].coordinates];

  // Configurações do traçado da rota do ônibus
  const options = {
    use: L.polyline,
    delay: 600,
    dashArray: [20, 100],
    weight: 8,
    color: coresLinhas[posicao],
    pulseColor: coresLinhas[posicao],
  };

  // Cria o traçado no mapa com as configurações definidas e o coloca no mapa
  let polyline = new L.Polyline.AntPath(latlngs, options).addTo(
    active_polyline
  );

  polyline.addTo(map);

  map.fitBounds(polyline.getBounds());
}

// Configurações dos ícones de marcadores das paradas de ônibus
const stationIcon = L.icon({
  iconUrl: "./src/assets/marker.svg",
  iconSize: [30, 30],
  iconAnchor: [20, 20],
  popupAnchor: [-5, -18],
});

for (let i = 0; i < data.paradas.length; i++) {
  // Nome e descrição dos marcadores de paradas dos ônibus
  let nome = `<h4>${data.paradas[i].nome}</h4>`;

  for (let j = 0; j < data.paradas[i].linhaAtendidas.length; j++) {
    nome += `<p>${data.paradas[i].linhaAtendidas[j]}</p>`;
  }

  // Pega as configurações do ícone e coloca ele no mapa, puxando as coordenadas do arquivo de JSON
  const marker = L.marker(data.paradas[i].coordinates, {
    icon: stationIcon,
  }).addTo(map);
  marker.bindPopup(nome);
}

export default exibeLinha;
