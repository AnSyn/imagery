import {
  AnnotationsVisualizer,
  EntitiesVisualizer,
  OpenLayersMap,
  OpenLayersProjectionService
} from '@ansyn/imagery-ol';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
// import Feature from 'ol/Feature';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import olPoint from 'ol/geom/Point';
import { fromLonLat, transformExtent } from 'ol/proj';
import olPolygon, { fromCircle } from 'ol/geom/Polygon';
import * as turf from '@turf/turf';
import { take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import OLGeoJSON from 'ol/format/GeoJSON';
import { getPointByGeometry, ImageryVisualizer, IVisualizerEntity, MarkerSize } from '@ansyn/imagery';
import { FeatureCollection } from 'geojson';

export enum NumberOfEntities {
  Entities_10 = '10',
  Entities_100 = '100',
  Entities_1000 = '1000',
  Entities_10000 = '10000'
}

@ImageryVisualizer({
  supported: [OpenLayersMap],
  deps: [OpenLayersProjectionService]
})
export class TestOLPerformanceVisualizer extends EntitiesVisualizer {

  lngMin = -21;
  lngMax = 40;
  latMin = 35;
  latMax = 59;

  constructor(protected projectionService: OpenLayersProjectionService) {
    super(null, {
      initial: {
        stroke: '#27b2cfe6',
        'stroke-width': 1,
        fill: `white`,
        'fill-opacity': AnnotationsVisualizer.fillAlpha,
        'stroke-opacity': 1,
        'marker-size': MarkerSize.medium,
        'marker-color': `#ffffff`
      }
    });
  }

  setTestEntities(numberOfEntities: NumberOfEntities) {
    switch (numberOfEntities) {
      case NumberOfEntities.Entities_10: {
        this.fillMapWithData(1, 1);
        break;
      }
      case NumberOfEntities.Entities_100: {
        this.fillMapWithData(5, 2);
        break;
      }
      case NumberOfEntities.Entities_1000: {
        this.fillMapWithData(10, 10);
        break;
      }
      case NumberOfEntities.Entities_10000: {
        this.fillMapWithData(40, 25);
        break;
      }

    }
  }

  fillMapWithData(rows, columns) {
    const data = this.generateItems(rows, columns);

    this.addPoints(data);
  }

  addPoints(data) {
    const entities: IVisualizerEntity[] = [];
    const dataPoints = data.points;
    for (let i = 0, ii = dataPoints.length; i < ii; ++i) {
      const point = dataPoints[i];

      const feature = turf.point([point.lng, point.lat]);
      const style = {
        initial: {
          stroke: point.color,
          fill: point.color
        },
      };
      entities.push({ id: i.toString(), featureJson: feature, style, label: {text: i.toString(), geometry: null} })
    }
    this.setEntities(entities).pipe(take(1)).subscribe((result) => {
      console.log(result);
    });
  }

  generateItems(rows, columns) {
    let data = {
      points: [],
      lines: [],
      polygons: []
    };

    for (let i = 0; i < rows; i++) {
      const cellLngMin = this.lerp(this.lngMin, this.lngMax, i / rows);
      const cellLngMax = this.lerp(this.lngMin, this.lngMax, (i + 1) / rows);

      for (let j = 0; j < columns; j++) {
        const cellLatMin = this.lerp(this.latMin, this.latMax, j / columns);
        const cellLatMax = this.lerp(this.latMin, this.latMax, (j + 1) / columns);

        const points = Array.from({ length: 8 }, () => ({
          lat: this.getRandom(cellLatMin, cellLatMax),
          lng: this.getRandom(cellLngMin, cellLngMax),
          color: this.randomColor()
        }));

        const lines = {
          segments: points.slice(3),
          color: this.randomColor()
        };

        const polygon = {
          segments: points.slice(0, 3),
          color: this.randomColor()
        };

        data.points.push(...points);
        data.lines.push(lines);
        data.polygons.push(polygon);
      }
    }
    return data;
  }

  lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t;
  }

  getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  randomColor() {
    return (
      '#' +
      ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(-6)
    );
  }

  onDispose() {
    super.onDispose();
  }
}
