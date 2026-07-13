export const transitQueryKeys = {
  all: ['transit'] as const,
  binary: ['transit', 'binary'] as const,
  linhas: ['transit', 'linhas'] as const,
  paradas: ['transit', 'paradas'] as const,
  nearestStops: (lat: number, lng: number) =>
    ['transit', 'nearest-stops', lat.toFixed(4), lng.toFixed(4)] as const,
};
