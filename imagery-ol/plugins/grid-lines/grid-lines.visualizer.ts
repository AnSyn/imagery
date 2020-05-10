import Graticule from 'ol/Graticule';
import Stroke from 'ol/style/Stroke';
import {
	BaseImageryPlugin, ImageryPlugin
} from '@ansyn/imagery';
import { Observable } from 'rxjs';
import { OpenLayersMap } from '../../maps/open-layers-map/openlayers-map/openlayers-map';

@ImageryPlugin({
	supported: [OpenLayersMap],
	deps: []
})
export class GridLinesVisualizer extends BaseImageryPlugin {

	gridColor = 'rgba(0,0,255,0.9)';
	gridLineWidth = 2;
	gridShowLabels = true;
	protected graticule: any;
	protected _isEnabled: boolean;

	constructor() {
		super();
	}

	// override this method to format the angle
	formatAngle(angle) {
		return angle.toFixed(3) + String.fromCharCode(176);
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
		if (this.graticule) {
			this.destroyGridLines();
		}
		this.graticule = new Graticule({
			// the style to use for the lines, optional.
			latLabelFormatter: this.formatAngle.bind(this),
			lonLabelFormatter: this.formatAngle.bind(this),
			strokeStyle: new Stroke({
				color: this.gridColor,
				width: this.gridLineWidth
			}),
			showLabels: this.gridShowLabels
		});

		this.graticule.setMap(this.iMap.mapObject);
	}

	destroyGridLines() {
		if (this.graticule) {
			this.graticule.setMap(undefined);
			this.graticule = undefined;
		}
	}

	onResetView(): Observable<boolean> {
		return super.onResetView();
	}

	onDispose(): void {
		this.destroyGridLines();
		super.onDispose();
	}
}
