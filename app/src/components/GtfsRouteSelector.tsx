import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchGtfsRoutes, type GtfsRoute } from '@/services/api/gtfsApi';

interface GtfsRouteSelectorProps {
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string | null) => void;
}

export function GtfsRouteSelector({ selectedRouteId, onSelectRoute }: GtfsRouteSelectorProps) {
  const [routes, setRoutes] = useState<GtfsRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const data = await fetchGtfsRoutes();
        setRoutes(data);
      } catch (_err) {}
    };

    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter(
    (route) =>
      route.short_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.long_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedRoute = routes.find((r) => r.route_id === selectedRouteId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-md hover:bg-gray-50"
      >
        <Search size={16} />
        <span className="text-sm">
          {selectedRoute
            ? `${selectedRoute.short_name || ''} - ${selectedRoute.long_name}`
            : 'Selecionar rota GTFS'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-lg bg-white shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar rotas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {selectedRouteId && (
              <button
                type="button"
                onClick={() => {
                  onSelectRoute(null);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Limpar seleção
              </button>
            )}

            {filteredRoutes.map((route) => (
              <button
                key={route.route_id}
                type="button"
                onClick={() => {
                  onSelectRoute(route.route_id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                  route.route_id === selectedRouteId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {route.route_color && (
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: `#${route.route_color}` }}
                    />
                  )}
                  <span>
                    {route.short_name || route.route_id} - {route.long_name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
