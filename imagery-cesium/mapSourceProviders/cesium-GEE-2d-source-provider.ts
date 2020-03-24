import { BaseMapSourceProvider, IBaseImageryMapConstructor, ImageryMapSource, IMapSettings } from '@ansyn/imagery';
import { CesiumMap } from '../maps/cesium-map/cesium-map';
import { CesiumLayer } from '../models/cesium-layer';

declare const Cesium: any;

export const CesiumGee2DSourceProviderSourceType = 'CESIUM_GEE_2D';

@ImageryMapSource({
	supported: [CesiumMap],
	sourceType: CesiumGee2DSourceProviderSourceType
})
export class CesiumGEE2dSourceProvider extends BaseMapSourceProvider {
	readonly supported: IBaseImageryMapConstructor[];

	protected create(metaData: IMapSettings): Promise<any> {
		const config = {...this.config, ...metaData.data.config};

		/*
		Provides tiled imagery using the Google Earth Imagery API.
		Notes: This imagery provider does not work with the public Google Earth servers.
			It works with the Google Earth Enterprise Server.
			By default the Google Earth Enterprise server does not set the Cross-Origin Resource Sharing headers.
			You can either use a proxy server which adds these headers, or in the /opt/google/gehttpd/conf/gehttpd.conf and add the 'Header set Access-Control-Allow-Origin "*"' option to the '<Directory />' and '<Directory "/opt/google/gehttpd/htdocs">' directives.
			This provider is for use with 2D Maps API as part of Google Earth Enterprise
		 */
		const cesiumGeeLayer = new Cesium.GoogleEarthEnterpriseMapsProvider({
			url: config.url,
			channel: config.channel,
		});
		const layer = new CesiumLayer(cesiumGeeLayer);
		return Promise.resolve(layer);
	}
}
