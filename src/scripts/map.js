import data from "./dadosRotas.json" assert { type: "json" };

console.log(data);

const map = L.map("mapa").setView([-19.87, -43.967], 16);

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

const stationIcon = L.icon({
  iconUrl: "./src/assets/marker.svg",
  iconSize: [20, 20],
  iconAnchor: [0, 0],
});

const marker = L.marker(data.paradas[0].coordinates[0], {
  icon: stationIcon,
}).addTo(map);
marker.bindPopup("Parada de Ônibus");

const latlngs = [data.rotas[0].coordinates];

const options = {
  use: L.polyline,
  delay: 600,
  dashArray: [40, 20],
  weight: 4,
  color: "#f6451e",
  pulseColor: "#f6451e",
};

let polyline = new L.Polyline.AntPath(latlngs, options);
polyline.addTo(map);
