
import * as L from 'leaflet';

declare module 'leaflet' {
    namespace Polyline {
        class AntPath extends L.Polyline {
            constructor(
                latlngs: L.LatLngExpression[] | L.LatLngExpression[][],
                options?: L.PathOptions & {
                    use?: boolean | string;
                    delay?: number;
                    dashArray?: number[] | string;
                    pulseColor?: string
                }
            );
        }
    }
}