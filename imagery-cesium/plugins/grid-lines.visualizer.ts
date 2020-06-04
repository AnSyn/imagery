import {
	BaseImageryPlugin, ImageryPlugin
} from '@ansyn/imagery';

import { CesiumMap } from '../maps/cesium-map/cesium-map';
import * as Cesium from "cesium";
import { Observable } from "rxjs";

// declare const Cesium: any;

@ImageryPlugin({
	supported: [CesiumMap],
	deps: []
})
export class CesiumGridLinesVisualizer extends BaseImageryPlugin {

	protected _isEnabled: boolean;

	layer: Cesium.ImageryLayer;

	constructor() {
		super();
	}

	onInit() {
		if (this.isEnabled) {
			this.showGridLines();
		}
	}

	set isEnabled(isEnabled: boolean) {
		this._isEnabled = isEnabled;
		if (isEnabled) {
			this.showGridLines();
		} else {
			this.destroyGridLines();
		}
	}

	get isEnabled(): boolean {
		return this._isEnabled;
	}

	showGridLines() {
		const viewer: Cesium.Viewer = this.iMap.mapObject;
		this.layer = viewer.imageryLayers.addImageryProvider(new Cesium.GridImageryProvider({
			glowWidth: 0,
			backgroundColor: Cesium.Color.TRANSPARENT
		}) as any);

		this.layer.alpha = 0.85;
		this.layer.show = true;
	}

	destroyGridLines() {
		this.iMap.mapObject.imageryLayers.remove(this.layer, true);
	}

	onResetView(): Observable<boolean> {
		return super.onResetView();
	}

	onDispose(): void {
		this.destroyGridLines();
		super.onDispose();
	}
}
