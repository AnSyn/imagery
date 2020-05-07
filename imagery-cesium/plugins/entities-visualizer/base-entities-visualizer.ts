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
	Polygon, Position
} from 'geojson';
import {
	Color, CustomDataSource,
	Entity
} from 'cesium'
import * as geoToCesium from '../utils/geoToCesium'
import { merge } from 'lodash';

declare const Cesium: any;

export interface IEntityIdentifier {
	originalEntity: IVisualizerEntity;
	entities: Entity[];
}

export abstract class BaseEntitiesVisualizer extends BaseImageryVisualizer {
	protected dataSource: CustomDataSource;
	public idToEntity: Map<string, IEntityIdentifier> = new Map<string, { originalEntity: null, entities: null }>();

	onInit() {
		this.getOrCreateDataSource(Cesium.createGuid()).then(newDataSource => {
			this.dataSource = newDataSource;
		});
	}

	addOrUpdateEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		logicalEntities.forEach((entity: IVisualizerEntity) => {
			const featureJson: Feature<any> = entity.featureJson;

			const newEntities: Entity[] = [];

			switch (featureJson.geometry.type) {
				case 'Point': {
					if (entity.icon) {
						newEntities.push(this.getBillboard(entity.id, featureJson.geometry, entity.icon));
					} else {
						newEntities.push(this.getPoint(entity.id, (<Point>featureJson.geometry).coordinates, entity.style));
					}
					break;
				}
				case 'LineString': {
					newEntities.push(this.getLineString(entity.id, (<LineString>featureJson.geometry).coordinates, entity.style));
					break;
				}
				case 'Polygon': {
					newEntities.push(this.getPolygon(entity.id, (<Polygon>featureJson.geometry).coordinates, entity.style));
					break;
				}
				case 'MultiPoint': {
					// Adding each point
					let i = 0;
					(<MultiPoint>featureJson.geometry).coordinates.forEach((ptCoords) => {
						newEntities.push(this.getPoint(`${entity.id}_${i++}`, ptCoords, entity.style));
					})
					break;
				}
				case 'MultiLineString': {
					// Adding each line
					let i = 0;
					(<MultiLineString>featureJson.geometry).coordinates.forEach((lineCoords) => {
						newEntities.push(this.getLineString(`${entity.id}_${i++}`, lineCoords, entity.style));
					})
					break;
				}
				case 'MultiPolygon': {
					// Adding each poly
					let i = 0;
					(<MultiPolygon>featureJson.geometry).coordinates.forEach((polyCoords) => {
						newEntities.push(this.getPolygon(`${entity.id}_${i++}`, polyCoords, entity.style));
					})
					break;
				}
				default: {
					console.warn(`"${featureJson.geometry.type}" Geometry not support`)
				}

			}

			// Add new entities to dataSource == Map
			newEntities.forEach(entity => this.dataSource.entities.add(entity));

			// Save for future use
			this.idToEntity.set(entity.id, {originalEntity: entity, entities: newEntities});
		});
		return of(true);
	}

	clearEntities() {
		this.dataSource.entities.removeAll();
		this.idToEntity.clear();
	}

	getEntities(): IVisualizerEntity[] {
		const entities: IVisualizerEntity[] = [];
		this.idToEntity.forEach((entity) => {
			entities.push(entity.originalEntity);
		});

		return entities;
	}

	removeEntity(logicalEntityId: string) {
		this.dataSource.entities.removeById(logicalEntityId);
		this.idToEntity.delete(logicalEntityId);
	}

	setEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		this.clearEntities();
		return this.addOrUpdateEntities(logicalEntities);
	}

	setVisibility(isVisible: boolean): void {
		this.dataSource.show = isVisible;
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

	private getPoint(id: string, coordinates: Position, stylesState?: Partial<IVisualizerStateStyle>): any {
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);
		const ptColor = this.getColor(s["marker-color"]);
		return {
			id: id,
			position: geoToCesium.coordinatesToCartesian(coordinates),
			point: {
				color: ptColor
			}
		}
	}

	private getLineString(id: string, coordinates: Position[], stylesState?: Partial<IVisualizerStateStyle>): any {

		// TODO: Support all polyline styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const lineColor = this.getColor(s["stroke"]);
		const lineWidth = s['stroke-width'];

		return {
			id: id,
			polyline: {
				positions: geoToCesium.multiLineToCartesian(coordinates),
				width: lineWidth,
				material: lineColor
			}
		};
	}

	private getPolygon(id: string, coordinates: Position[][], stylesState?: Partial<IVisualizerStateStyle>): any {

		// TODO: Support all polygon styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const lineColor = this.getColor(s["stroke"]);
		const fillColor = this.getColor(s["fill"]);

		const lineWidth = s['stroke-width'];

		const poly = new Cesium.PolygonHierarchy(geoToCesium.polygonCoordinatesToCartesian(coordinates[0]));


		// Adding holes
		for (let i = 1; i < coordinates.length; i++) {
			poly.holes.push(geoToCesium.polygonCoordinatesToCartesian(coordinates[i]));
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

	private getOrCreateDataSource(dataSourceGuid): Promise<Cesium.CustomDataSource> {
		return new Promise<Cesium.CustomDataSource>((resolve) => {
			const ds = this.iMap.mapObject.dataSources.getByName(dataSourceGuid);
			if (ds.length === 0) {
				return this.iMap.mapObject.dataSources.add(new Cesium.CustomDataSource(dataSourceGuid)).then(value => resolve(value));
			} else {
				return resolve(ds[0]);
			}
		});

	}

}
