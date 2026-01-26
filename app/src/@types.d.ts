import {
  FeatureCollection,
  RotaFeature,
  ParadaFeature,
} from "./types/data.types";

declare module "*.geojson" {
  const value: FeatureCollection<RotaFeature | ParadaFeature>;
  export default value;
}

declare module "*.json" {
  const value: FeatureCollection<RotaFeature | ParadaFeature>;
  export default value;
}
