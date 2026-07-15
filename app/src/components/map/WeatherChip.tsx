/**
 * WeatherChip - Chip flutuante de clima no mapa
 *
 * Usa Open-Meteo (api.open-meteo.com) — API pública gratuita, sem chave.
 * Temperatura é aproximada ao centro do campus (clima é regional, não
 * precisa da localização exata do usuário nem pedir permissão de GPS).
 */

import { useQuery } from '@tanstack/react-query';
import { Cloud, CloudRain, CloudSnow, Sun, Zap } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { COORDENADAS_CAMPUS } from '@/hooks/useLocalizacaoUsuario';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    weather_code: number;
  };
}

interface WeatherData {
  temperaturaC: number;
  codigo: number;
}

/** Códigos WMO (weather_code) — ver open-meteo.com/en/docs#weather_variable_documentation */
function resolveWeatherIcon(codigo: number): IconComponent {
  if (codigo === 0 || codigo === 1) return Sun;
  if (codigo >= 71 && codigo <= 77) return CloudSnow;
  if (codigo >= 95) return Zap;
  if ((codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return CloudRain;
  return Cloud;
}

async function fetchWeather(): Promise<WeatherData> {
  const [lat, lng] = COORDENADAS_CAMPUS;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Falha ao buscar clima');
  }

  const data = (await res.json()) as OpenMeteoResponse;
  if (!data.current) {
    throw new Error('Resposta de clima sem dados atuais');
  }

  return {
    temperaturaC: Math.round(data.current.temperature_2m),
    codigo: data.current.weather_code,
  };
}

export function WeatherChip() {
  const { data, isError } = useQuery({
    queryKey: ['weather', 'campus'],
    queryFn: fetchWeather,
    staleTime: 20 * 60_000,
    gcTime: 60 * 60_000,
    retry: 1,
  });

  if (isError || !data) {
    return null;
  }

  const Icon = resolveWeatherIcon(data.codigo);

  return (
    <div
      role="status"
      aria-label={`Temperatura atual: ${data.temperaturaC} graus`}
      className="pointer-events-none flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold text-text-primary shadow-(--elevation-2) ring-1 ring-card-border backdrop-blur"
    >
      <Icon size={14} aria-hidden="true" className="text-brand-primary dark:text-brand-accent" />
      {data.temperaturaC}°
    </div>
  );
}
