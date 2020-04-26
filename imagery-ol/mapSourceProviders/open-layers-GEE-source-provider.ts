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
import { HttpClient } from "@angular/common/http";
import { Inject } from "@angular/core";

export const OpenLayerGEESourceProviderSourceType = 'GEE';

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
		const config = {...this.config, ...metaData.data.config};

		const getLayersDataPromise = this.getLayersData(config.serverUrl)
			.then((data) => {
				//const query = '/query?request=ImageryMaps&channel=' + config.channel + '&version=2&x={x}&y={y}&z={z}';
				data.layers.forEach(layer => {
					const source = new TileImage({
						url: config.serverUrl + `/query?request=` + layer.requestType + `&channel=` + layer.id + `&version=` + layer.version + `&x={x}&y={y}&z={z}`,
						crossOrigin: 'anonymous'
					});

					const geeLayer = new TileLayer(<any>{
						source: source,
						visible: true,
						preload: Infinity
					});

					return Promise.resolve(geeLayer);
				});

			})
			.catch((excpetion) => {
			});


		return getLayersDataPromise;
	}

	getLayersData(serverURL: string): Promise<any> {
		const fileUrl = serverURL + `/query?request=Json`;
		return this.httpClient.get(fileUrl).toPromise();
	}
}
