import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";

import "leaflet/dist/leaflet.css";

export default function Mapa() {
  const center: LatLngExpression = [-19.870553062661006, -43.96775991703787];

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}



// "use client";

// import React, { useRef } from "react";
// import { MapContainer, TileLayer } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// import L from "leaflet";
// import { useMap } from "react-leaflet";

// import "leaflet/dist/leaflet.css";
// import "leaflet-ant-path";

// // const coresLinhas = [
// //   "#8A2BE2",
// //   "#B22222",
// //   "#006400",
// //   "#00008B",
// //   "#800020",
// //   "#4B0082",
// //   "#D2691E",
// // ];

// function CustomZoomControl() {
//   const map = useMap();
//   const zoomControlRef = useRef<L.Control.Zoom | null>(null);

//   React.useEffect(() => {
//     // Remove any existing zoom control to avoid duplicates
//     if (zoomControlRef.current) {
//       map.removeControl(zoomControlRef.current);
//     }

//     // Create and add the zoom control
//     const zoomControl = L.control.zoom({ position: "topright" });
//     zoomControl.addTo(map);
//     zoomControlRef.current = zoomControl;

//     // Cleanup on unmount
//     return () => {
//       if (zoomControlRef.current) {
//         map.removeControl(zoomControlRef.current);
//       }
//     };
//   }, [map]);

//   return null;
// }

// export default function Mapa() {
//   return (
//     <MapContainer
//       center={[-19.8706, -43.9678]}
//       zoom={15}
//       scrollWheelZoom={true}
//       style={{ height: "100vh", width: "100vw" }}
//       zoomControl={false} // Desativa o controle de zoom padrão
//     >
//       <TileLayer
//         attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />
//       <CustomZoomControl />
//     </MapContainer>
//   );
// }