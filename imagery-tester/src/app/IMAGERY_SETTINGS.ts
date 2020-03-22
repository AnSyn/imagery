import { OpenlayersMapName } from '@ansyn/ol';
import { IMapSettings } from '@ansyn/imagery';

const IMAGERY_SETTINGS: IMapSettings = {
  id: 'id',
  worldView: {
    mapType: OpenlayersMapName,
    sourceType: 'OSM'
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

