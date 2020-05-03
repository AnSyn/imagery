import {
	BaseImageryVisualizer,
	IVisualizerEntity,
	VisualizerInteractionTypes,
	IVisualizerStyle,
	IVisualizerStateStyle
} from '@ansyn/imagery';
import { Observable, of } from 'rxjs';
import {
	Feature,
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon
} from 'geojson';
import {
	Color,
	Entity
} from 'cesium'
import * as geoToCesium from '../utils/geoToCesium'
import { merge } from 'lodash';

declare const Cesium: any;

export abstract class BaseEntitiesVisualizer extends BaseImageryVisualizer {
	protected dataSourceGuid;

	public dataSources: Set<string> = new Set<string>();

	onInit() {
		this.dataSourceGuid = Cesium.createGuid()
	}

	addOrUpdateEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		logicalEntities.forEach((entity: IVisualizerEntity) => {
			const featureJson: Feature<any> = entity.featureJson;

			switch (featureJson.geometry.type) {
				case 'Point': {
					this.getOrCreateDataSource(featureJson.geometry.type).then(dataSource => {
						if (entity.icon) {
							dataSource.entities.add(this.getBillboard(entity.id, featureJson.geometry, entity.icon));
						} else {
							dataSource.entities.add(this.getPoint(entity.id, featureJson.geometry, entity.style));
						}
					});
					break;
				}
				case 'LineString': {
					this.getOrCreateDataSource(featureJson.geometry.type).then(dataSource => {
						dataSource.entities.add(this.getPolyline(entity.id, featureJson.geometry, entity.style));
					});
					break;
				}
				case 'Polygon': {
					this.getOrCreateDataSource(featureJson.geometry.type).then(dataSource => {
						dataSource.entities.add(this.getPolygon(entity.id, featureJson.geometry, entity.style));
					});
					break;
				}
				case 'MultiPoint': {
					// TODO Complete Code
					break;
				}
				case 'MultiLineString': {
					// TODO Complete Code
					break;
				}
				case 'MultiPolygon': {
					// TODO Complete Code
					break;
				}
				default: {
					console.warn(`"${featureJson.geometry.type}" Geometry not support`)
				}

			}
		});
		return of(true);
	}

	clearEntities() {
		this.dataSources.forEach((dataSourceName) => {
			const dataSources = this.iMap.mapObject.dataSources.getByName(dataSourceName);
			if (dataSources.length === 1) {
				dataSources[0].removeAll();
			}
		});
	}

	getEntities(): IVisualizerEntity[] {
		this.dataSources.forEach((dataSourceName) => {
			const dataSources = this.iMap.mapObject.dataSources.getByName(dataSourceName);
			if (dataSources.length === 1) {
				// TODO get all entities

			}

		});
		return null;
	}

	removeEntity(logicalEntityId: string) {
		this.dataSources.forEach((dataSourceName) => {
			const dataSources = this.iMap.mapObject.dataSources.getByName(dataSourceName);
			if (dataSources.length === 1) {
				dataSources[0].removeById(logicalEntityId);
			}
		});
	}

	setEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		this.clearEntities();
		return this.addOrUpdateEntities(logicalEntities);
	}

	setVisibility(isVisible: boolean): void {
		this.dataSources.forEach((dataSourceName) => {
			const dataSources = this.iMap.mapObject.dataSources.getByName(dataSourceName);
			if (dataSources.length === 1) {
				dataSources[0].show = isVisible;
			}
		});
	}

	addInteraction(type: VisualizerInteractionTypes, interactionInstance: any): void {
	}
	removeInteraction(type: VisualizerInteractionTypes, interactionInstance: any): void {
	}

	private getBillboard(id: string, geometry: Point, imgUrl: string): any {
		return {
			id: id,
			position: geoToCesium.coordinatesToCartesian(geometry.coordinates),
			billboard: {
				image: new Cesium.ConstantProperty(imgUrl)
			}
		};
	}

	private getPoint(id: string, geometry: Point, stylesState?: Partial<IVisualizerStateStyle>): any {
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);
		const ptColor = this.getColor(s["marker-color"]);
		return {
			id: id,
			position: geoToCesium.coordinatesToCartesian(geometry.coordinates),
			point: {
				color: ptColor
			}
		}
	}

	private getPolyline(id: string, geometry: LineString, stylesState?: Partial<IVisualizerStateStyle>): any {

		// TODO: Support all polyline styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const lineColor = this.getColor(s["stroke"]);
		const lineWidth = s['stroke-width'];

		return {
			id: id,
			polyline: {
				positions: geoToCesium.multiLineToCartesian(geometry.coordinates),
				width: lineWidth,
				material: lineColor
			}
		};
	}

	private getPolygon(id: string, geometry: Polygon, stylesState?: Partial<IVisualizerStateStyle>): any {

		// TODO: Support all polygon styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const lineColor = this.getColor(s["stroke"]);
		const fillColor = this.getColor(s["fill"]);

		const lineWidth = s['stroke-width'];

		const poly = new Cesium.PolygonHierarchy(geoToCesium.polygonCoordinatesToCartesian(geometry.coordinates[0]));


		// Adding holes
		for (let i = 1; i < geometry.coordinates.length; i++) {
			poly.holes.push(geoToCesium.polygonCoordinatesToCartesian(geometry.coordinates[i]));
		}

		return {
			id: id,
			polygon: {
				hierarchy: poly,
				material: fillColor,
				outline: new Cesium.ConstantProperty(true),
				outlineColor: lineColor,
				outlineWidth: lineWidth,
			}
		};
	}

	private getColor(color: string = "RED"): Color {
		// Cesium Color Can't handle rrggbbaa so ...
		const rrggbbaaMatcher = /^#([0-9a-f]{8})$/i;

		const matches = rrggbbaaMatcher.exec(color);
		if (matches !== null) {
			const c = Cesium.Color.fromCssColorString(color.substring(0, 7));
			c.alpha = parseInt(color.substring(7), 16) / 255;
			return c;
		} else {
			return Cesium.Color.fromCssColorString(color);
		}
	}

	private getOrCreateDataSource(id) {
		const dataSourceName = `${this.dataSourceGuid}_${id}`;
		return new Promise<Cesium.CustomDataSource>((resolve) => {
			const ds = this.iMap.mapObject.dataSources.getByName(dataSourceName);
			if (ds.length === 0) {
				this.dataSources.add(dataSourceName);
				return this.iMap.mapObject.dataSources.add(new Cesium.CustomDataSource(dataSourceName)).then(value => resolve(value));
			} else {
				return resolve(ds[0]);
			}
		});

	}

}
