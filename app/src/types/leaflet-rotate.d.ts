/**
 * Tipos TypeScript para leaflet-rotate.
 *
 * O plugin estende o L.Map com setBearing/getBearing/getRotation.
 * Estes tipos são necessários pois o pacote não inclui declarações TS.
 */
// biome-ignore lint/correctness/noUnusedImports: import needed for module augmentation
// biome-ignore lint/suspicious/noShadowRestrictedNames: import needed for module augmentation
import type { Map } from 'leaflet';

declare module 'leaflet' {
  interface Map {
    setBearing(bearing: number): void;
    getBearing(): number;
    getRotation(): number;
  }
}
