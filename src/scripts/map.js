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
  iconSize: [50, 32],
  iconAnchor: [25, 16],
});

const marker = L.marker([-19.864066379453362, -43.960112218157626], {
  icon: stationIcon,
}).addTo(map);
marker.bindPopup("Parada de Ônibus");

let latlngs = [data.rotas[0].coordinates];

let polyline = L.polyline(latlngs, {
  color: "#f6a91e",
  weight: "8",
  opacity: "0.8",
}).addTo(map);

// zoom the map to the polyline
map.fitBounds(polyline.getBounds());
