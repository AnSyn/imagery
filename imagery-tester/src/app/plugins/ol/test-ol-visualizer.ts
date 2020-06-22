
import { EntitiesVisualizer, OpenLayersMap, OpenLayersProjectionService } from '@ansyn/imagery-ol';
import Feature from 'ol/Feature';
import olPoint from 'ol/geom/Point';
import { Point } from 'geojson';
import * as turf from '@turf/turf';
import { take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import OLGeoJSON from 'ol/format/GeoJSON';
import { getPointByGeometry, ImageryVisualizer } from '@ansyn/imagery';

@ImageryVisualizer({
  supported: [OpenLayersMap],
  deps: [OpenLayersProjectionService]
})
export class TestOLVisualizer extends EntitiesVisualizer {

  geoJsonFormat: OLGeoJSON;

  // @AutoSubscription
  // goToPinAvailable$ = combineLatest(this.pinLocation$, this.isActiveMap$).pipe(
  //   tap(([pinLocation, isActiveMap]: [boolean, boolean]) => {
  //     if (isActiveMap && pinLocation) {
  //       this.createSingleClickEvent();
  //     } else {
  //       this.removeSingleClickEvent();
  //     }
  //   })
  // );

  private getGeometry(originalFeature) {
    const featureId = originalFeature.getId();
    const entityMap = this.idToEntity.get(featureId);

    const featureGeoJson = <any>this.geoJsonFormat.writeFeatureObject(entityMap.feature);
    const centroid = getPointByGeometry(featureGeoJson.geometry);
    const point = new olPoint(<[number, number]>centroid.coordinates);
    return point;
  }

  public singleClickListener = (e) => {
    this.projectionService
      .projectAccurately({ type: 'Point', coordinates: e.coordinate }, this.iMap.mapObject)
      .pipe(take(1))
      .subscribe((point: Point) => {
        this.drawGotoIconOnMap([true, turf.point(point.coordinates)]).pipe(take(1)).subscribe();
      });
  }

  constructor(protected projectionService: OpenLayersProjectionService) {
    super();
    this.updateStyle({
      initial: {
        stroke: '#3DCC33',
        fill: '#3DCC33',
        'fill-opacity': 0,
        icon: {
          scale: 1,
          src: 'assets/icons/go-to-map-marker.svg',
          anchor: [0.5, 1]
        },
        geometry: this.getGeometry.bind(this),
        label: {
          fontSize: 12,
          fill: '#fff',
          stroke: '#000',
          'stroke-width': 3
        }
      }
    });
    this.geoJsonFormat = new OLGeoJSON();
  }

  public createSingleClickEvent() {
    return this.iMap && this.iMap.mapObject.on('singleclick', this.singleClickListener, this);
  }

  public removeSingleClickEvent(): void {
    return this.iMap && this.iMap.mapObject.un('singleclick', this.singleClickListener, this);
  }

  drawGotoIconOnMap([draw, featureJson = null]: [boolean, Feature<any>]): Observable<boolean> {
    if (draw) {
      return this.setEntities([{ id: 'goto', featureJson }]);
    }
    this.clearEntities();
    return of(true);
  }

  onDispose() {
    this.removeSingleClickEvent();
    super.onDispose();
  }
}
