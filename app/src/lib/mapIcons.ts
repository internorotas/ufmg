import L from 'leaflet';
import markerIcon from '../assets/marker.svg';

// Flyweight: one instance shared across ALL map markers — never recreated per render
export const stationIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export const highlightedIcon = L.icon({
  iconUrl: markerIcon,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  className: 'marker-highlighted',
});
