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

const latlngs = [data.rotas[0].coordinates];

const options = {
  use: L.polyline,
  delay: 400,
  dashArray: [10, 20],
  weight: 5,
  color: "#0000FF",
  pulseColor: "#FFFFFF",
};

// Using the constructor...
let antPolyline = new L.Polyline.AntPath(latlngs, options);

// ... or use the factory
antPolyline = L.polyline.antPath(latlngs, options);

antPolyline.addTo(map);
