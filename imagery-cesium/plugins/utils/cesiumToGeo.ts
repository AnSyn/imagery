import { Cartesian3, Ellipsoid, Math, Cartographic } from 'cesium';
import { Position } from '@turf/turf';

export function cartographicToPosition(carto: Cartographic): Position {
  const lon = Math.toDegrees(carto.longitude);
  const lat = Math.toDegrees(carto.latitude);
  const alt = carto.height;
  return [lon, lat, alt];
}

export function cartesianToCoordinates(cartesianPositions: Cartesian3[]): Position[] {
    const coordinates = cartesianPositions.map(position => {
        // TODO - use projection
        const carto  = Ellipsoid.WGS84.cartesianToCartographic(position);
        return cartographicToPosition(carto);
      });

      return coordinates;
}
