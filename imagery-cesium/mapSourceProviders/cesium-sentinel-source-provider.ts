import { ImageryMapSource, BaseMapSourceProvider, IMapSettings } from "@ansyn/imagery";
import { CesiumMap } from '../maps/cesium-map/cesium-map';
import { CesiumLayer } from '../models/cesium-layer';
import * as wellknown from 'wellknown';
import { BBox2d } from '@turf/helpers/lib/geojson';
import * as turf from '@turf/turf';

declare const Cesium: any;
export const CesiumSentinelSourceProviderSourceType = 'SENTINEL';

@ImageryMapSource({
	supported: [CesiumMap],
	sourceType: CesiumSentinelSourceProviderSourceType
})
export class CesiumSentinelSourceProvider extends BaseMapSourceProvider {
	protected create(metaData: IMapSettings): Promise<any> {
		const baseUrl = 'http://ansyn.webiks.com:89/api/wms';

		const overlay = metaData.data.overlay;
		// Deep copy
		const footprint = JSON.parse(JSON.stringify(overlay.footprint));

		const TIME = this.createDateString(overlay.date);
		const MAXCC = 100;
		const GEOMETRY = wellknown.stringify(footprint);
		const extent = (<BBox2d>turf.bbox(turf.feature(footprint)));

		const sentinelLayer = new Cesium.WebMapServiceImageryProvider({
			url: baseUrl,
			parameters: {
				GEOMETRY,
				MAXCC,
				TIME,
				transparent: true,
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
