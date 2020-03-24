import { BaseMapSourceProvider, IBaseImageryMapConstructor, ImageryMapSource, IMapSettings } from '@ansyn/imagery';
import { CesiumMap } from '../maps/cesium-map/cesium-map';
import { CesiumLayer } from '../models/cesium-layer';

declare const Cesium: any;

export const CesiumGeeSourceProviderSourceType = 'CESIUM_GEE';

@ImageryMapSource({
	supported: [CesiumMap],
	sourceType: CesiumGeeSourceProviderSourceType
})
export class CesiumGEESourceProvider extends BaseMapSourceProvider {
	readonly supported: IBaseImageryMapConstructor[];

	protected create(metaData: IMapSettings): Promise<any> {
		const config = {...this.config, ...metaData.data.config};

		const geeMetadata = new Cesium.GoogleEarthEnterpriseMetadata(config.url);
		// noinspection TypeScriptValidateJSTypes
		const cesiumGeeLayer = new Cesium.GoogleEarthEnterpriseImageryProvider({
			metadata: geeMetadata
		});

		// noinspection TypeScriptValidateJSTypes
		const terrainProvider = new Cesium.GoogleEarthEnterpriseTerrainProvider({
			metadata : geeMetadata
		});

		const layer = new CesiumLayer(cesiumGeeLayer, null, terrainProvider);
		return Promise.resolve(layer);
	}
}
