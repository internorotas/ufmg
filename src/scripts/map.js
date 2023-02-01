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

// create a red polyline from an array of LatLng points
var latlngs = [
  [-19.861972752318465, -43.96237735732535],
  [-19.861757997542952, -43.96208508525271],
  [-19.862393670835246, -43.96150510785915],
  [-19.862994981634856, -43.9609822148347],
  [-19.863931829108367, -43.96019545612381],
  [-19.864110073148993, -43.960056170214045],
  [-19.864153023490644, -43.96006530371679],
  [-19.864893915047688, -43.96107227234103],
  [-19.865988501849344, -43.9625081632837],
  [-19.86743948221212, -43.96441548189799],
  [-19.866803829146605, -43.964958925283355],
  [-19.866206813670814, -43.965486650100274],
  [-19.866163863885447, -43.96554830124052],
  [-19.866037161951965, -43.9655597181181],
  [-19.865974884693273, -43.965541451113296],
  [-19.865453043252202, -43.96484273819027],
  [-19.865277323507343, -43.964600832158965],
  [-19.865223635959424, -43.96434737747077],
  [-19.86521504595025, -43.964237775444076],
  [-19.865144178355735, -43.96417840767933],
  [-19.865041098161015, -43.964198958058944]
];

var polyline = L.polyline(latlngs, {
  color: "#f6a91e",
  weight: "10",
  opacity: "0.8",
}).addTo(map);

// zoom the map to the polyline
map.fitBounds(polyline.getBounds());
