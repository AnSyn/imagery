import { Cartesian3, Ellipsoid, Math } from "cesium";
import { Position } from "@turf/turf";

export function cartesianToCoordinates(cartesianPositions: Cartesian3[]): Position[] {
    const coordinates = cartesianPositions.map(position => {
        const carto  = Ellipsoid.WGS84.cartesianToCartographic(position);
        const lon = Math.toDegrees(carto.longitude);
        const lat = Math.toDegrees(carto.latitude);
        const alt = carto.height;
        return [lon, lat, alt];
      });

      return coordinates;
}
