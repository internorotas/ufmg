import * as L from "leaflet";

declare module "leaflet" {
  namespace Polyline {
    class AntPath extends L.Polyline {
      constructor(
        latlngs: L.LatLngExpression[] | L.LatLngExpression[][],
        options?: L.PolylineOptions & {
          delay?: number;
          dashArray?: number[];
          weight?: number;
          color?: string;
          pulseColor?: string;
          paused?: boolean;
          reverse?: boolean;
          hardwareAccelerated?: boolean;
        },
      );
    }
  }

  function antPath(
    latlngs: L.LatLngExpression[] | L.LatLngExpression[][],
    options?: L.PolylineOptions & {
      delay?: number;
      dashArray?: number[];
      weight?: number;
      color?: string;
      pulseColor?: string;
      paused?: boolean;
      reverse?: boolean;
      hardwareAccelerated?: boolean;
    },
  ): Polyline.AntPath;
}

declare module "leaflet-ant-path" {
  export = L;
}
