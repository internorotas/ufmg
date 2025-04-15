'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-ant-path'
import { useState } from 'react'
import { dadosRotas } from '@/data/dadosRotas'
import { dadosLinhas } from '@/data/dadosLinhas'

const icon = L.icon({
  iconUrl: '/marker.svg',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
})

const coresLinhas = [
  '#8A2BE2', '#B22222', '#006400', '#00008B', '#800020',
  '#4B0082', '#D2691E'
]

function ExibeLinha({ rotaId }: { rotaId: number }) {
  const map = useMap()
  const rota = dadosRotas.find(r => r.id === rotaId)

  if (!rota) return null

  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) {
      map.removeLayer(layer)
    }
  })

  const polyline = new (L as any).polylineAntPath(rota.coordinates, {
    delay: 600,
    dashArray: [20, 100],
    weight: 8,
    color: coresLinhas[rotaId % coresLinhas.length],
    pulseColor: '#FFFFFF',
  })

  polyline.addTo(map)
  map.fitBounds(polyline.getBounds())

  return null
}

export default function Mapa() {
  const [linhaSelecionada, setLinhaSelecionada] = useState<number | null>(null)

  return (
    <div className="w-full h-[600px] relative">
      <MapContainer
        center={[-19.8706, -43.9678]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcadores das paradas */}
        {dadosLinhas.map((linha) =>
          linha.paradas.map((parada, i) => (
            <Marker key={`${linha.id}-${i}`} position={parada.coordinates} icon={icon}>
              <Popup>
                <h4>{parada.nome}</h4>
                <p>{linha.nome}</p>
              </Popup>
            </Marker>
          ))
        )}

        {/* Linha selecionada com AntPath */}
        {linhaSelecionada !== null && (
          <ExibeLinha rotaId={linhaSelecionada} />
        )}
      </MapContainer>

      {/* Botões de seleção de linha */}
      <div className="absolute top-2 left-2 bg-white p-3 rounded shadow">
        <h3 className="font-bold mb-2">Linhas</h3>
        {dadosRotas.map((rota) => (
          <button
            key={rota.id}
            onClick={() => setLinhaSelecionada(rota.id)}
            className="block mb-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            {rota.linha}
          </button>
        ))}
      </div>
    </div>
  )
}
