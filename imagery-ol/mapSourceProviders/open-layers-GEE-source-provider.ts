import TileLayer from 'ol/layer/Tile';
import TileImage from 'ol/source/TileImage';
import {
	CacheService,
	EPSG_3857,
	ImageryCommunicatorService,
	ImageryMapSource,
	IMapSettings, IMapSourceProvidersConfig,
	MAP_SOURCE_PROVIDERS_CONFIG
} from '@ansyn/imagery';
import { OpenLayersMapSourceProvider } from './open-layers.map-source-provider';
import { OpenLayersMap } from '../maps/open-layers-map/openlayers-map/openlayers-map';
import { OpenLayersDisabledMap } from '../maps/openlayers-disabled-map/openlayers-disabled-map';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';

​
export const OpenLayerGEESourceProviderSourceType = 'GEE';
​
@ImageryMapSource({
	sourceType: OpenLayerGEESourceProviderSourceType,
	supported: [OpenLayersMap, OpenLayersDisabledMap]
})
export class OpenLayerGEESourceProvider extends OpenLayersMapSourceProvider {

	constructor(protected httpClient: HttpClient,
				protected cacheService: CacheService,
				protected imageryCommunicatorService: ImageryCommunicatorService,
				@Inject(MAP_SOURCE_PROVIDERS_CONFIG) protected mapSourceProvidersConfig: IMapSourceProvidersConfig) {
		super(cacheService, imageryCommunicatorService, mapSourceProvidersConfig);
	}

	create(metaData: IMapSettings): Promise<any> {
		let layerPromise;
		const config = { ...this.config, ...metaData.data.config };
​
		return this.getLayersData(config.serverUrl)
			.then((data) => {
				const geeDefs = JSON.parse(data.replace(/([\[\{,])\s*(\w+)\s*:/g, '$1 "$2":'));
					const source = new TileImage({
						url: config.serverUrl + `/query?request=` + geeDefs.layers[0].requestType + `&channel=` + geeDefs.layers[0].id + `&version=` + geeDefs.layers[0].version + `&x={x}&y={y}&z={z}`,
						crossOrigin: 'anonymous'
					});
​
					const geeLayer = new TileLayer(<any>{
						source: source,
						visible: true,
						preload: Infinity
					});
​
					return Promise.resolve(geeLayer);
			})
			.catch((excpetion) => {
				console.warn(excpetion);
			});
	}

	getLayersData(serverURL: string): Promise<any> {
		const fileUrl = serverURL + `/query?request=Json&is2d=t`;
		return this.httpClient.get(fileUrl, { responseType: 'text' }).toPromise();
	}
}
