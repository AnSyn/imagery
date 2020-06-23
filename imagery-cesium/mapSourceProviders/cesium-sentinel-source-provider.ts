import { ImageryMapSource, BaseMapSourceProvider, IMapSettings } from "@ansyn/imagery";
import { CesiumMap } from '../maps/cesium-map/cesium-map';
import { CesiumLayer } from '../models/cesium-layer';
import { stringify, GeoJSONGeometry } from 'wellknown';
import { BBox2d } from '@turf/helpers/lib/geojson';
import { bbox, feature } from '@turf/turf';
import { cloneDeep } from 'lodash';

declare const Cesium: any;
export const CesiumSentinelSourceProviderSourceType = 'CESIUM_SENTINEL';

@ImageryMapSource({
	supported: [CesiumMap],
	sourceType: CesiumSentinelSourceProviderSourceType
})
export class CesiumSentinelSourceProvider extends BaseMapSourceProvider {
	protected create(metaData: IMapSettings): Promise<any> {
		const baseUrl = this.config.url;
		const overlay = metaData.data.overlay;
		const footprint: GeoJSONGeometry = cloneDeep(overlay.footprint);

		const TIME = this.createDateString(overlay.date);
		const MAXCC = 100;
		const GEOMETRY = stringify(footprint);
		const extent = bbox(feature(footprint)) as BBox2d;

		const sentinelLayer = new Cesium.WebMapServiceImageryProvider({
			url: baseUrl,
			parameters: {
				GEOMETRY,
				MAXCC,
				TIME,
				transparent: true
			},
			rectangle: Cesium.Rectangle.fromDegrees(...extent),
			layers: 'TRUE_COLOR'
		});
		 const layer = new CesiumLayer(sentinelLayer);
		return Promise.resolve(layer);
	}

	createDateString(date: Date): string {
		const Y = date.getFullYear();
		const m = date.getMonth() + 1;
		const d = date.getDate();
		const str = `${ Y }-${ m >= 10 ? m : `0${ m }` }-${ d >= 10 ? d : `0${ d }` }`;
		return `${ str }`;
	}
}
