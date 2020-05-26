import {
	BaseImageryVisualizer,
	MarkerSize,
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
	BillboardGraphics,
	PointGraphics,
	PolylineGraphics,
	PolygonGraphics
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
	isReady = false;

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
				this.updateLabel(newEntities[0], visEntity);
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

	getEntityById(featureId: string): IVisualizerEntity {
		const entity = this.idToEntity.get(featureId);
		return entity && entity.originalEntity;
	}

	getCesiumEntities(featureId: string): Entity[] {
		const entity = this.idToEntity.get(featureId);
		return entity && entity.entities;
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
		const pixelSize = this.getPixelSize(s["marker-size"]);

		entity.position = geoToCesium.coordinatesToCartesian(coordinates);
		entity.point = new PointGraphics({
			color: ptColor,
			pixelSize : pixelSize
		});
	}

	private updateLineString(entity: Entity, coordinates: Position[], stylesState?: Partial<IVisualizerStateStyle>): void {
		// TODO: Support all polyline styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const material = this.getLineMaterial(s);

		const lineWidth = s['stroke-width'];

		entity.polyline = new PolylineGraphics({
			positions: geoToCesium.multiLineToCartesian(coordinates),
			width: lineWidth,
			material: material
		});

		// Calculate the label position
		entity.position = Cesium.BoundingSphere.fromPoints((<Cesium.ConstantProperty> entity.polyline.positions).getValue()).center;
	}

	private updatePolygon(entity: Entity, coordinates: Position[][], stylesState?: Partial<IVisualizerStateStyle>): void {
		// TODO: Support all polygon styles
		const styles = merge({}, stylesState);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const showOutline = s["stroke-opacity"] !== 0;
		const lineColor = this.getColor(s["stroke"], s["stroke-opacity"]);
		const showFill = s["fill-opacity"] !== 0;
		const fillColor = this.getColor(s["fill"], s["fill-opacity"]);

		const lineWidth = s['stroke-width'];

		const poly = new Cesium.PolygonHierarchy(geoToCesium.polygonCoordinatesToCartesian(coordinates[0]));


		// Adding holes
		for (let i = 1; i < coordinates.length; i++) {
			poly.holes.push(geoToCesium.polygonCoordinatesToCartesian(coordinates[i]));
		}

		entity.polygon = new PolygonGraphics({
			fill:  new Cesium.ConstantProperty(showFill),
			hierarchy: poly,
			material: new Cesium.ColorMaterialProperty(fillColor),
			outline: new Cesium.ConstantProperty(showOutline),
			height: 0,
			outlineColor: lineColor,
			outlineWidth: lineWidth
		});

		// Calculate the label position
		entity.position = Cesium.BoundingSphere.fromPoints((<Cesium.ConstantProperty> entity.polygon.hierarchy).getValue().positions).center;
	}

	private updateLabel(entity: Cesium.Entity, visEntity: IVisualizerEntity) {

		const styles = merge({}, visEntity.style);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const fillColor = s.label && s.label.fill ? this.getColor(s.label.fill) : undefined;
		const outlineColor = s.label && s.label.stroke ? this.getColor(s.label.stroke) : undefined;

		entity.label = new Cesium.LabelGraphics({
				text: visEntity.label.text,
				font: new Cesium.ConstantProperty(visEntity.labelSize ? `${visEntity.labelSize}px Calibri,sans-serif` : undefined),
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.TOP,
				fillColor : fillColor,
				outlineColor: outlineColor,
				outlineWidth: 2,
				style: Cesium.LabelStyle.FILL_AND_OUTLINE,
			}
		);
	}

	private getColor(color: string = "RED", opacity?: number): Color {
		// Cesium Color Can't handle rrggbbaa so ...
		const rrggbbaaMatcher = /^#([0-9a-f]{8})$/i;

		const matches = rrggbbaaMatcher.exec(color);
		if (matches !== null) {
			const c = Cesium.Color.fromCssColorString(color.substring(0, 7));
			c.alpha = parseInt(color.substring(7), 16) / 255;
			return c;
		} else {
			const c = Cesium.Color.fromCssColorString(color);

			if (opacity !== undefined) {
				c.alpha = opacity;
			}
			return c;
		}
	}

	private getLineMaterial(s) {
		const color = this.getColor(s["stroke"], s["stroke-opacity"]);
		let material;
		if (s["stroke-dasharray"] > 0) {
			material = new Cesium.PolylineDashMaterialProperty({
				color: color,
				dashLength: s["stroke-dasharray"]
			});
		} else {
			material = new Cesium.ColorMaterialProperty(color);
		}
		return material;
	}

	private getPixelSize(markerSize: MarkerSize) {
		let pixelSize = 1;

		switch (markerSize) {
			case MarkerSize.small: {
				pixelSize = 8;
				break;
			}
			case MarkerSize.medium : {
				pixelSize = 12;
				break;
			}
			case MarkerSize.large: {
				pixelSize = 20;
				break;
			}
		}
		return pixelSize;
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
