import {
	BaseImageryVisualizer,
	IVisualizerEntity,
	VisualizerInteractionTypes,
	IVisualizerStyle,
	IVisualizerStateStyle
} from '@ansyn/imagery';
import { Observable, of, Subject } from 'rxjs';
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
	Color,
	CustomDataSource,
	Entity,
	BillboardGraphics, PointGraphics, PolygonGraphics, PolylineGraphics,
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
	isReady$: Subject<boolean> = new Subject();
	isReady: boolean = false;

	onInit() {
		this.getOrCreateDataSource(Cesium.createGuid()).then(newDataSource => {
			this.dataSource = newDataSource;
			this.isReady = true;
			this.isReady$.next(this.isReady);
		});
	}

	addOrUpdateEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		if (!logicalEntities || !Array.isArray(logicalEntities)) {
			return of(true);
		}

		logicalEntities.forEach((visEntity: IVisualizerEntity) => {
			const featureJson: Feature<any> = visEntity.featureJson;

			const newEntities: Entity[] = [];

			let style: Partial<IVisualizerStateStyle> = visEntity.style;
			let oldEntities: Entity[] = [];

			if (this.idToEntity.has(visEntity.id)) {
				style = merge(this.idToEntity.get(visEntity.id).originalEntity.style, visEntity.style);
				oldEntities = this.idToEntity.get(visEntity.id).entities;
			}

			switch (featureJson.geometry.type) {
				case 'Point': {
					const entity: Entity = this.dataSource.entities.getOrCreateEntity(visEntity.id);
					newEntities.push(entity);

					if (visEntity.icon) {
						this.updateBillboard(entity, (<Point>featureJson.geometry).coordinates, visEntity.icon)
					} else {
						this.updatePoint(entity, (<Point>featureJson.geometry).coordinates, style);
					}
					break;
				}
				case 'LineString': {
					const entity: Entity = this.dataSource.entities.getOrCreateEntity(visEntity.id);
					newEntities.push(entity);

					this.updateLineString(entity, (<LineString>featureJson.geometry).coordinates, style);
					break;
				}
				case 'Polygon': {
					const entity: Entity = this.dataSource.entities.getOrCreateEntity(visEntity.id);
					newEntities.push(entity);

					this.updatePolygon(entity, (<Polygon>featureJson.geometry).coordinates, visEntity.style);
					break;
				}
				case 'MultiPoint': {
					// If number of new entities in less then the old one, remove all old entities
					if ((<MultiPoint>featureJson.geometry).coordinates.length < oldEntities.length) {
						oldEntities.forEach(entity => this.dataSource.entities.remove(entity));
					}

					// Adding each point
					let i = 0;
					(<MultiPoint>featureJson.geometry).coordinates.forEach((ptCoords) => {
						const entity: Entity = this.dataSource.entities.getOrCreateEntity(`${visEntity.id}_${i++}`);
						newEntities.push(entity);
						this.updatePoint(entity, ptCoords, style);
					})
					break;
				}
				case 'MultiLineString': {
					// Adding each line
					let i = 0;

					// If number of new entities in less then the old one, remove all old entities
					if ((<MultiLineString>featureJson.geometry).coordinates.length < oldEntities.length) {
						oldEntities.forEach(entity => this.dataSource.entities.remove(entity));
					}

					(<MultiLineString>featureJson.geometry).coordinates.forEach((lineCoords) => {
						const entity: Entity = this.dataSource.entities.getOrCreateEntity(`${visEntity.id}_${i++}`);
						newEntities.push(entity);
						this.updateLineString(entity, lineCoords, style);
					})
					break;
				}
				case 'MultiPolygon': {
					// If number of new entities in less then the old one, remove all old entities
					if ((<MultiPolygon>featureJson.geometry).coordinates.length < oldEntities.length) {
						oldEntities.forEach(entity => this.dataSource.entities.remove(entity));
					}

					// Adding each poly
					let i = 0;
					(<MultiPolygon>featureJson.geometry).coordinates.forEach((polyCoords) => {
						const entity: Entity = this.dataSource.entities.getOrCreateEntity(`${visEntity.id}_${i++}`);
						newEntities.push(entity);
						this.updatePolygon(entity, polyCoords, style);
					})
					break;
				}
				default: {
					console.warn(`"${featureJson.geometry.type}" Geometry not support`)
				}

			}
			// Setting the label
			if (visEntity.label && visEntity.label.text && newEntities.length > 0) {
				newEntities[0].label = new Cesium.LabelGraphics({
						text: visEntity.label.text,
						font: new Cesium.ConstantProperty( visEntity.labelSize ? visEntity.labelSize : undefined),
					}
				);
			}

			// update idToEntity for future use
			this.idToEntity.set(visEntity.id, {originalEntity: visEntity, entities: newEntities});
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
		if (!logicalEntities || !Array.isArray(logicalEntities)) {
			return of(true);
		}

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

	private updateBillboard(entity: Entity, coordinates: Position, imgUrl: string): void {
		entity.position = geoToCesium.coordinatesToCartesian(coordinates);
		entity.billboard = new BillboardGraphics({
			image: new Cesium.ConstantProperty(imgUrl)
		});
	}

	private updatePoint(entity: Entity, coordinates: Position, stylesState?: Partial<IVisualizerStateStyle>): void {
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);
		const ptColor = this.getColor(s["marker-color"]);

		entity.position = geoToCesium.coordinatesToCartesian(coordinates);
		entity.point = new PointGraphics({
			color: ptColor
		});
	}

	private updateLineString(entity: Entity, coordinates: Position[], stylesState?: Partial<IVisualizerStateStyle>): void {

		// TODO: Support all polyline styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const lineColor = this.getColor(s["stroke"]);
		const lineWidth = s['stroke-width'];

		entity.polyline = new PolylineGraphics({
			positions: geoToCesium.multiLineToCartesian(coordinates),
			width: lineWidth,
			material: lineColor
		});
	}

	private updatePolygon(entity: Entity, coordinates: Position[][], stylesState?: Partial<IVisualizerStateStyle>): void {
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

		entity.polygon = new PolygonGraphics({
			hierarchy: poly,
			material: fillColor,
			outline: new Cesium.ConstantProperty(true),
			outlineColor: lineColor,
			outlineWidth: lineWidth
		});
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
