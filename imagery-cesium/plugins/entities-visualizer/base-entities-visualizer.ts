import { BaseImageryVisualizer, IVisualizerEntity, VisualizerInteractionTypes } from '@ansyn/imagery';
import { Observable, of } from 'rxjs';
import { Feature, GeometryObject, LineString, Point, Polygon } from 'geojson';
import * as geoToCesium from '../utils/geoToCesium'
import { IVisualizerStateStyle, IVisualizerStyle } from "../../../imagery/public_api";
import { cloneDeep, merge } from 'lodash';

declare const Cesium: any;

export abstract class BaseEntitiesVisualizer extends BaseImageryVisualizer {

	billboardCollection;

	public idToEntity: Map<string, any> = new Map<string, { feature: null, originalEntity: null }>();

	onInit() {
		// this.billboardCollection = this.iMap.mapObject.scene.primitives.add(new Cesium.BillboardCollection());

	}

	getIds(entity: IVisualizerEntity): string {
		if (entity.icon) {
			return `billboard_${entity.id}`;
		}
		return entity.id;
	}

	addInteraction(type: VisualizerInteractionTypes, interactionInstance: any): void {
	}

	addOrUpdateEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		logicalEntities.forEach((entity: IVisualizerEntity) => {
			const featureJson: Feature<any> = entity.featureJson;

			switch (featureJson.geometry.type) {
				case 'Point': {
					this.getOrCreateDataSource("Point").then(ds => {
						if (entity.icon) {
							ds.entities.add(this.getBillbord(entity.id, featureJson.geometry, entity.icon));
						} else {
							ds.entities.add(this.getPoint(entity.id, featureJson.geometry, entity.style));
						}
					});
					break;
				}
				case 'LineString': {
					this.getOrCreateDataSource("LineString").then(ds => {
						ds.entities.add(this.getPolyline(entity.id, featureJson.geometry, entity.style));
					});
					break;
				}
				case 'Polygon': {
					this.getOrCreateDataSource("Polygon").then(ds => {
						ds.entities.add(this.getPolygon(entity.id, featureJson.geometry, entity.style));
					});
					break;
				}
			}
		});
		return of(true);
	}


	private getBillbord(id: string, geometry: Point, imgUrl: string): any {
		return {
			id: id,
			position: geoToCesium.coordinatesToCartesian(geometry.coordinates),
			billboard: {
				image: imgUrl
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
				outline: true,
				outlineColor: lineColor,
				outlineWidth: lineWidth,
			}
		};
	}

	private getColor(color: string = "RED"): Cesium.Color {
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

	/*
	protected createStyle(feature: Feature, isStyle, ...styles: Array<Partial<IVisualizerStyle>>) {
			const styleSettings: IVisualizerStyle = merge({}, ...styles);
			this.fixStyleValues(feature, styleSettings);

			let firstStyle: any = {};
			let secondaryStyle: any = {};
			let textStyle: any = {};

			if (styleSettings.shadow) {
				secondaryStyle.stroke = new Stroke({
					color: styleSettings.shadow.stroke,
					width: styleSettings.shadow['stroke-width']
				});
			}

			if (styleSettings.stroke) {
				const color = this.colorWithAlpha(styleSettings.stroke, styleSettings['stroke-opacity']);
				const dash = styleSettings['stroke-dasharray'];
				const lineDash = dash > 0 ? [dash, 10] : undefined;
				const width = styleSettings['stroke-width'];
				const lineCap = dash > 0 ? 'square' : undefined;

				firstStyle.stroke = new Stroke({ color, lineDash, width, lineCap, lineDashOffset: 5 });
			}

			if (styleSettings.fill) {
				const color = this.colorWithAlpha(styleSettings.fill, styleSettings['fill-opacity']);
				firstStyle.fill = new Fill({ color });
			}

			if (styleSettings.icon) {
				firstStyle.image = new Icon(styleSettings.icon);
			}

			if (styleSettings.circle) {
				const radius = styleSettings.circle;
				firstStyle.image = new Circle({
					radius,
					fill: firstStyle.fill,
					stroke: firstStyle.stroke
				});
			}

			if (styleSettings.geometry) {
				secondaryStyle.image = firstStyle.image;
				secondaryStyle.geometry = styleSettings.geometry
			}

			if ((styleSettings.label && styleSettings.label.text) && !feature.getProperties().labelTranslateOn) {
				const fill = new Fill({ color: styleSettings.label.fill });
				const stroke = new Stroke({
					color: styleSettings.label.stroke ? styleSettings.label.stroke : '#fff',
					width: styleSettings.label.stroke ? 4 : 0
				});
				const { label } = styleSettings;

				textStyle.text = new Text({
					overflow: label.overflow,
					font: `${ styleSettings.label.fontSize }px Calibri,sans-serif`,
					offsetY: <any>styleSettings.label.offsetY,
					text: <any>label.text,
					fill,
					stroke
				});
				textStyle.geometry = (feature) => {
					const { label } = feature.getProperties();
					if (label.geometry) {
						const oldCoordinates = label.geometry.getCoordinates();
						const newCoordinates = [this.offset[0] + oldCoordinates[0], this.offset[1] + oldCoordinates[1]];
						return new Point(newCoordinates);
					}
					return new Point(this.getCenterOfFeature(feature).coordinates)
				};

				firstStyle.geometry = (feature) => feature.getGeometry();
			}

			if (styleSettings['marker-color'] || styleSettings['marker-size']) {
				const color = styleSettings['marker-color'];
				const radius = MarkerSizeDic[styleSettings['marker-size']];
				firstStyle.image = new Circle({ fill: new Fill({ color }), stroke: null, radius });
			}


			return [firstStyle, textStyle, secondaryStyle].map(style => isStyle ? new Style(style) : style);
		}
	 */

	clearEntities() {
		this.billboardCollection.removeAll();
	}

	getEntities(): IVisualizerEntity[] {
		const entities: IVisualizerEntity[] = [];
		this.idToEntity.forEach((val, key) => entities.push(val.originalEntity));
		return entities;
	}

	removeEntity(logicalEntityId: string) {
		const entity = this.getEntities().find((entity: IVisualizerEntity) => {
			const cesiumEntityId = this.getIds(entity);
			return cesiumEntityId === logicalEntityId
		});
		if (entity) {
			const cesiumEntityId = this.getIds(entity);
			const visEntity = this.idToEntity.get(cesiumEntityId);
			this.billboardCollection.remove(visEntity.feature);
			visEntity.feature = undefined;
			this.idToEntity.delete(cesiumEntityId);
		}
	}

	removeInteraction(type: VisualizerInteractionTypes, interactionInstance: any): void {
	}

	setEntities(logicalEntities: IVisualizerEntity[]): Observable<boolean> {
		const removedEntities = [];
		this.idToEntity.forEach(((value, key: string) => {
			const item = logicalEntities.find((entity) => entity.id === key);
			if (!item) {
				removedEntities.push(key);
			}
		}));

		removedEntities.forEach((id) => {
			this.removeEntity(id);
		});

		return this.addOrUpdateEntities(logicalEntities);
	}

	setVisibility(isVisible: boolean): void {
	}

	getOrCreateDataSource(id) {
		return new Promise<Cesium.CustomDataSource>((resolve, reject) => {
			const ds = this.iMap.mapObject.dataSources.getByName(id);
			if (ds.length === 0) {
				return this.iMap.mapObject.dataSources.add(new Cesium.CustomDataSource(id)).then(value => resolve(value));
			} else {
				return resolve(ds[0]);
			}
		});

	}

}
