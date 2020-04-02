import { ImageryPlugin, IMousePointerMove, IVisualizerEntity } from '@ansyn/imagery';
import { Observable, of } from 'rxjs';
import { AutoSubscription } from 'auto-subscriptions';
import { BaseEntitiesVisualizer, CesiumMap } from '@ansyn/imagery-cesium';
import { point } from '@turf/turf';

@ImageryPlugin({
  supported: [CesiumMap],
  deps: []
})
export class MouseMarkerPlugin extends BaseEntitiesVisualizer {

  private _isEnabled: boolean;

  public set isEnabled(value: boolean) {
    if (this._isEnabled !== value) {
      this._isEnabled = value;

      if (!this.isEnabled) {
        this.removeEntity('visEntity');
      }
    }
  }

  public get isEnabled(): boolean {
    return this._isEnabled;
  }

  @AutoSubscription
  mousePositionChanged$ = () => this.communicator.ActiveMap.mousePointerMoved.subscribe((position: IMousePointerMove) => {
    if (this.isEnabled && !isNaN(position.lat) && !isNaN(position.long)) {
      this.tryDraw(position);
    }
  });

  constructor() {
    super();
    this._isEnabled = true;
  }

  onResetView(): Observable<boolean> {
    return of(true);
  }

  public dispose() {
    super.dispose();
  }

  private tryDraw(position: IMousePointerMove) {
    if (!this._isEnabled) {
      return;
    }

    const entity: IVisualizerEntity = {
      id: 'visEntity',
      icon: 'assets//logo.svg',
      featureJson: point([position.long, position.lat, position.height])
    };

    const polygon : IVisualizerEntity = {
      id: 'Polygon',
      featureJson: {
        type: "Feature",
        geometry: {
          "type":"Polygon",
          "coordinates":[
            [
              [
                -79.9441543655779,
                6.128701260566601
              ],
              [
                -13.612496074120623,
                47.529128645116856
              ],
              [
                74.60638151695977,
                -18.541194853701725
              ],
              [
                -79.9441543655779,
                6.128701260566601
              ]
            ]
          ]
        },
        properties:{}
      },
      style:{
        initial:{
          "fill":"white",
          "stroke":"#27b2cfe6",
          "stroke-width":1,
          "stroke-dasharray":0,
          "fill-opacity":0.4,
          "stroke-opacity":1,
        }
      }
    }

    const polyline : IVisualizerEntity = {
      id: 'Polyline',
      featureJson: {
        type: "Feature",
        geometry: {
          type : "LineString",
          coordinates: [
            [
              37.08545167242462,
              29.723747917711435
            ],
            [
              34.40537649183417,
              35.36759607584702
            ],
            [
              31.05530091865578,
              31.834237068921382
            ]
          ]
        },
        properties:{}
      },
      style:{
        initial:{
          stroke:"#27b2cfe6",
          "stroke-width":1,
          "stroke-dasharray":0,
        }
      }
    };

    const billboardEntity : IVisualizerEntity = {
      id: 'billboard',
      icon: 'assets//logo.svg',
      featureJson: {
        type: "Feature",
        geometry: {
          type : "Point",
          coordinates: [
            -6.018961997487438,
            31.26325432597315
          ]
        },
        properties:{}
      },
      style:{
        initial:{
          "marker-color":"#ffffff",
        }
      }
    };

    const pointEntity : IVisualizerEntity = {
      id: 'Point',
      featureJson: {
        type: "Feature",
        geometry: {
          type : "Point",
          coordinates: [
            -6.018961997487438,
            31.26325432597315
          ]
        },
        properties:{}
      },
      style:{
        initial:{
          "marker-color":"#ffffff",
        }
      }
    };

    this.setEntities([pointEntity]);
  }
}
