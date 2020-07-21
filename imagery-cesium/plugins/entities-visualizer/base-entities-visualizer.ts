import {
	BaseImageryVisualizer,
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
	CustomDataSource,
	Entity,
	BillboardGraphics,
	PointGraphics,
	PolylineGraphics,
	PolygonGraphics,
	ConstantProperty,
	BoundingSphere,
	PolygonHierarchy,
	ColorMaterialProperty,
	LabelGraphics,
	HorizontalOrigin,
	VerticalOrigin,
	LabelStyle
} from 'cesium'
import * as geoToCesium from '../utils/geoToCesium';

import { merge } from 'lodash';
import { AnnotationMode } from '../../models/annotation-mode.enum';
import {
	getMarkerColor,
	getMarkerSize,
	getLineMaterial,
	getStrokeWidth,
	getShowOutline,
	getStrokeColor,
	getShowFill,
	getFillColor,
	getColor
} from '../helpers/visualizer-style-helper';

// TODO => remove using of declare const Cesium after having solved the issue
// of new Cesium.CustomDataSource(dataSourceGuid) in getOrCreateDataSource mehod
declare const Cesium: any;

export interface IEntityIdentifier {
	originalEntity: IVisualizerEntity;
	entities: Entity[];
}

// TODO - support width stroke style
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
					const mode: AnnotationMode = featureJson?.properties?.mode;

					this.updateLineString(entity, (<LineString>featureJson.geometry).coordinates, style, mode);
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
			image: new ConstantProperty(imgUrl)
		});
	}

	private updatePoint(entity: Entity, coordinates: Position, stylesState?: Partial<IVisualizerStateStyle>): void {
		const color = getMarkerColor(stylesState);
		const pixelSize = getMarkerSize(stylesState);

		entity.position = geoToCesium.coordinatesToCartesian(coordinates);
		entity.point = new PointGraphics({ color, pixelSize });
	}

	private updateLineString(entity: Entity, coordinates: Position[], stylesState?: Partial<IVisualizerStateStyle>, mode?: AnnotationMode): void {
		// TODO: Support all polyline styles
		const styles = merge({}, stylesState);

		const material = getLineMaterial(styles, mode);
		let width = getStrokeWidth(styles);

		if (mode === AnnotationMode.Arrow && width < 10) {
			width = 10;
		}

		entity.polyline = new PolylineGraphics({
			positions: geoToCesium.multiLineToCartesian(coordinates),
			width,
			material
		});

		// Calculate the label position
		entity.position = BoundingSphere.fromPoints((<ConstantProperty> entity.polyline.positions).getValue()).center as any;
	}

	private updatePolygon(entity: Entity, coordinates: Position[][], stylesState?: Partial<IVisualizerStateStyle>): void {
		// TODO: Support all polygon styles
		const styles = merge({}, stylesState);

		const outline = getShowOutline(styles);
		const outlineColor = getStrokeColor(styles);
		const fill = getShowFill(styles);
		const fillColor = getFillColor(styles);
		const outlineWidth = getStrokeWidth(styles);

		const hierarchy = new PolygonHierarchy(geoToCesium.polygonCoordinatesToCartesian(coordinates[0]));

		// Adding holes
		for (let i = 1; i < coordinates.length; i++) {
			hierarchy.holes.push(geoToCesium.polygonCoordinatesToCartesian(coordinates[i]) as any);
		}

		entity.polygon = new PolygonGraphics({
			fill,
			hierarchy,
			material: new ColorMaterialProperty(fillColor as any),
			outline,
			height: 0,
			outlineColor,
			outlineWidth
		});

		// Calculate the label position
		entity.position = BoundingSphere.fromPoints((<ConstantProperty> entity.polygon.hierarchy).getValue().positions).center as any;
	}

	private updateLabel(entity: Entity, visEntity: IVisualizerEntity) {
		const styles = merge({}, visEntity.style);
		const s: IVisualizerStyle = merge({}, styles.initial);

		const fillColor = s?.label.fill ? getColor(s.label.fill) : undefined;
		const outlineColor = s?.label.stroke ? getColor(s.label.stroke) : undefined;

		entity.label = new LabelGraphics({
			text: visEntity.label.text,
			font: (new ConstantProperty(visEntity.labelSize ? `${visEntity.labelSize}px Calibri,sans-serif` : undefined)) as any,
			horizontalOrigin: HorizontalOrigin.CENTER as any,
			verticalOrigin: VerticalOrigin.TOP as any,
			fillColor,
			outlineColor,
			outlineWidth: 2,
			style: LabelStyle.FILL_AND_OUTLINE as any,
		});
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
