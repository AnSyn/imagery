import { OpenlayersMapName } from '@ansyn/imagery-ol';
import { IMapSettings } from '@ansyn/imagery';
import { CesiumMapName } from '@ansyn/imagery-cesium';

const IMAGERY_SETTINGS: IMapSettings = {
  id: 'id',
  orientation: 'User Perspective',
  worldView: {
    mapType: OpenlayersMapName, // CesiumMapName,
    sourceType: 'OSM', // 'CESIUM_OSM'
  },
  flags: {},
  data: {
    position: {
      'extentPolygon': {
        'type': 'Polygon',
        'coordinates': [
          [
            [
              -180,
              90
            ],
            [
              180,
              90
            ],
            [
              180,
              -90
            ],
            [
              -180,
              -90
            ],
            [
              -180,
              90
            ]
          ]
        ]
      }
    }
  }
};

export default IMAGERY_SETTINGS;

