import {
	BaseImageryVisualizer,
	MarkerSize,
	IVisualizerEntity,
	VisualizerInteractionTypes,
	IVisualizerStyle,
	IVisualizerStateStyle,
	ANNOTATIONS_INITIAL_STYLE
} from '@ansyn/imagery';
import { Observable, of, Subject } from 'rxjs';
import {
	Feature,
	LineString,
	MultiLineString,
	MultiPoint,
	MultiPolygon,
	Point,
	Polygon, Position,
	FeatureCollection
} from 'geojson';
import {
	Color,
	CustomDataSource,
	Entity,
	BillboardGraphics,
	PointGraphics,
	PolylineGraphics,
	PolygonGraphics,
	ConstantProperty
} from 'cesium'
import * as geoToCesium from '../utils/geoToCesium';

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

	// This style is the same as in ol annotations visualizer
	protected visualizerStyle: IVisualizerStateStyle = {
		opacity: 1,
		initial: ANNOTATIONS_INITIAL_STYLE
	};

	onInit() {
		this.getOrCreateDataSource((Cesium as any).createGuid()).then(newDataSource => {
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
	annotationsLayerToEntities(annotationsLayer: FeatureCollection<any>): IVisualizerEntity[] {
		return annotationsLayer.features.map(
			(feature: Feature<any>): IVisualizerEntity => {
				const featureJson: Feature<any> = {
					...feature,
					properties: {
						...feature.properties,
						featureJson: undefined,
					},
				};
				return {
					featureJson,
					id: feature.properties.id,
					style: feature.properties.style || this.visualizerStyle,
					showMeasures: feature.properties.showMeasures || false,
					showArea: feature.properties.showArea || false,
					label: feature.properties.label || {
						text: "",
						geometry: null,
					},
					icon: feature.properties.icon || "",
					undeletable: feature.properties.undeletable || false,
					labelSize: feature.properties.labelSize || 28,
					labelTranslateOn: feature.properties.labelTranslateOn || false,
				};
			}
		);
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
		entity.position = Cesium.BoundingSphere.fromPoints((<ConstantProperty> entity.polyline.positions).getValue()).center as any;
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
			poly.holes.push(geoToCesium.polygonCoordinatesToCartesian(coordinates[i]) as any);
		}

		entity.polygon = new PolygonGraphics({
			fill:  new Cesium.ConstantProperty(showFill),
			hierarchy: poly,
			material: new Cesium.ColorMaterialProperty(fillColor as any),
			outline: new Cesium.ConstantProperty(showOutline),
			height: 0,
			outlineColor: lineColor,
			outlineWidth: lineWidth
		});

		// Calculate the label position
		entity.position = Cesium.BoundingSphere.fromPoints((<ConstantProperty> entity.polygon.hierarchy).getValue().positions).center as any;
	}

	private updateLabel(entity: Entity, visEntity: IVisualizerEntity) {

		const styles = merge({}, visEntity.style);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const fillColor = s.label && s.label.fill ? this.getColor(s.label.fill) : undefined;
		const outlineColor = s.label && s.label.stroke ? this.getColor(s.label.stroke) : undefined;

		entity.label = new Cesium.LabelGraphics({
				text: visEntity.label.text,
				font: (new Cesium.ConstantProperty(visEntity.labelSize ? `${visEntity.labelSize}px Calibri,sans-serif` : undefined)) as any,
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER as any,
				verticalOrigin: Cesium.VerticalOrigin.TOP as any,
				fillColor : fillColor,
				outlineColor: outlineColor,
				outlineWidth: 2,
				style: Cesium.LabelStyle.FILL_AND_OUTLINE as any,
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
				color: color as any,
				dashLength: s["stroke-dasharray"]
			});
		} else {
			material = new Cesium.ColorMaterialProperty(color as any);
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

	private getOrCreateDataSource(dataSourceGuid): Promise<CustomDataSource> {
		return new Promise<CustomDataSource>((resolve) => {
			const ds = this.iMap.mapObject.dataSources.getByName(dataSourceGuid);
			if (ds.length === 0) {
				return this.iMap.mapObject.dataSources.add(new Cesium.CustomDataSource(dataSourceGuid)).then(value => resolve(value));
			} else {
				return resolve(ds[0]);
			}
		});

	}

}
