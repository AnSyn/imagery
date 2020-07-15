import { Cartesian3, Ellipsoid, Math, Cartographic, Cartesian2 } from 'cesium';
import { Position, circle as turfCircle, Units, Polygon } from '@turf/turf';

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

/**
 * 
 * @param center - center coordinates
 * @param radius - radius in meters
 * @param steps - number of sides of the generated polygon geometry (defaults to 36)
 */
export function circleToPolygonGeometry(center: Cartesian3, radius: number, steps = 36): Polygon {
  const centerCarto = Ellipsoid.WGS84.cartesianToCartographic(center);
  const circleCenter = [
    Math.toDegrees(centerCarto.longitude),
    Math.toDegrees(centerCarto.latitude)
  ];
  const units: Units = 'meters';
  const options = { steps, units };
  const circle = turfCircle(circleCenter, radius, options);
  return circle.geometry;
}
