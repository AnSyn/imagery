import { BaseImageryPlugin, IVisualizerEntity, ImageryPlugin, IVisualizerStateStyle, ANNOTATIONS_INITIAL_STYLE } from '@ansyn/imagery';
import { Viewer, Cartesian3, Entity, Property, CallbackProperty, PolygonHierarchy, defined, ColorMaterialProperty, HeightReference, Color, Cartesian2 } from 'cesium';
import { CesiumMap } from '../maps/cesium-map/cesium-map';
import { Observable, Subscription, Subject } from 'rxjs';
import { FeatureCollection, GeometryObject, Feature } from 'geojson';
import { take, tap } from 'rxjs/operators';
import { cartesianToCoordinates } from './utils/cesiumToGeo';
import { feature as turfFeature, featureCollection as turfFeatureCollection, Geometry } from '@turf/turf';
import { AnnotationMode } from '../models/annotation-mode.enum';
import { IPixelPositionMovement, IPixelPosition } from '../models/map-events';
import { AnnotationType } from '../models/annotation-type.enum';

@ImageryPlugin({
	supported: [CesiumMap],
	deps: [],
})
export class CesiumDrawAnnotationsVisualizer extends BaseImageryPlugin {
	private viewer: Viewer;
	private cesiumMap: CesiumMap;

	private activeShapePoints: Cartesian3[] = [];
	private activeShape: Entity;
	private floatingPoint: Entity;
	private drawingMode = AnnotationMode.LineString;

	private leftClickEvent$: Observable<IPixelPosition>;
	private leftDoubleClickEvent$: Observable<IPixelPosition>;
	private mouseMoveEvent$: Observable<IPixelPositionMovement>;

	private mapEventsSubscription = new Subscription();

	// This style is the same as in ol annotations visualizer
	protected visualizerStyle: IVisualizerStateStyle = {
		opacity: 1,
		initial: ANNOTATIONS_INITIAL_STYLE
	};

	events = {
		onDrawEnd: new Subject<FeatureCollection<GeometryObject>>()
	}

	constructor() {
		super();
	}

	onInit() {
		super.onInit();
		this.cesiumMap = this.iMap as CesiumMap;
		this.viewer = this.cesiumMap.mapObject;
		this.initMapEventsObservables();
	}

	initMapEventsObservables() {
		this.mouseMoveEvent$ = this.cesiumMap.events.mousePointerMovedEvent.asObservable(); 
		this.leftClickEvent$ = this.cesiumMap.events.leftClickEvent.asObservable(); 
		this.leftDoubleClickEvent$ = this.cesiumMap.events.leftDoubleClickEvent.asObservable(); 
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

	startDrawing(mode: AnnotationMode) {
		this.drawingMode = mode;
		this.reset();

		if (this.drawingMode === AnnotationMode.Point) {
			const leftClickEventSubscription = this.leftClickEvent$.pipe(take(1), tap((screenPixels: IPixelPosition) => {
				const earthPosition = this.cesiumMap.getEarthPositionFromScreenPixels(screenPixels.position);
				this.activeShapePoints.push(earthPosition)				
				this.events.onDrawEnd.next(this.onDrawEnd());
			})).subscribe();
			this.mapEventsSubscription.add(leftClickEventSubscription);

			return;
		}

		const leftClickEventSubscription = this.leftClickEvent$.subscribe((screenPixels: IPixelPosition) => {
			const earthPosition = this.cesiumMap.getEarthPositionFromScreenPixels(screenPixels.position);
			if (defined(earthPosition)) {
				if (this.activeShapePoints.length === 0) {
					// floating point is the point that sticks to the cursor when drawing!
					// on every mouse move I update it's value to the last mouse position
					// here I create it for the first time
					this.floatingPoint = this.addAnnotation(AnnotationType.Point, earthPosition);

					this.activeShapePoints.push(earthPosition);
					const dynamicPositions = new CallbackProperty(() => {
						if (this.drawingMode === AnnotationMode.Polygon) {
							return new PolygonHierarchy(this.activeShapePoints);
						}
						return this.activeShapePoints;
					}, false);
					this.activeShape = this.addAnnotation(this.drawingMode as unknown as AnnotationType, dynamicPositions);
				}
				this.activeShapePoints.push(earthPosition);
			}
		})

		
		const mouseMoveEventSubscription = this.mouseMoveEvent$.subscribe((event) => {
			this.updateLastActivePoint(event.endPosition);
		});
		const leftDoubleClickEventSubscription = this.leftDoubleClickEvent$.pipe(take(1), tap(() => this.events.onDrawEnd.next(this.onDrawEnd()))).subscribe();

		this.mapEventsSubscription.add(leftDoubleClickEventSubscription);
		this.mapEventsSubscription.add(leftClickEventSubscription);
		this.mapEventsSubscription.add(mouseMoveEventSubscription);
	}

	private updateLastActivePoint(pixelPoint: Cartesian2) {
		if (defined(this.floatingPoint)) {
			const newPosition = this.cesiumMap.getEarthPositionFromScreenPixels(pixelPoint);
			if (defined(newPosition)) {
				(this.floatingPoint.position as any).setValue(newPosition);
				this.activeShapePoints.pop();
				this.activeShapePoints.push(newPosition);
			}
		}
	}

	private addAnnotation(type: AnnotationType, positionData: Property | Cartesian3): Entity {
		let shape: Entity;
		switch (type) {
			case AnnotationType.LineString: {
				shape = this.viewer.entities.add({
					polyline: {
						positions: positionData as Property,
						clampToGround: true,
						width: 3,
					},
				});
				break;
			}
			case AnnotationType.Polygon: {
				shape = this.viewer.entities.add({
					polygon: {
						hierarchy: positionData as Property,
						material: new ColorMaterialProperty(Color.WHITE.withAlpha(0.7)),
					},
				});
				break;
			}
			case AnnotationType.Point: {
				shape = this.viewer.entities.add({
					position: positionData as Cartesian3,
					point: {
						color: Color.WHITE,
						pixelSize: 5,
						heightReference: HeightReference.CLAMP_TO_GROUND ,
					},
				});
			}
		}
		return shape;
	}

	private onDrawEnd(): FeatureCollection<GeometryObject> {
		const shapePoints = this.activeShapePoints;
		this.reset();

		return this.generateGeometry(this.drawingMode, shapePoints);
	}

	private reset() {
		this.mapEventsSubscription.unsubscribe();
		this.mapEventsSubscription = new Subscription();
		this.viewer.entities.remove(this.floatingPoint);
		this.viewer.entities.remove(this.activeShape);
		this.floatingPoint = undefined;
		this.activeShapePoints = [];
		this.activeShape = undefined;
	}


	private generateGeometry(mode: AnnotationMode, cartesianPoints: Cartesian3[]): FeatureCollection<GeometryObject> {
		const coordinates = cartesianToCoordinates(cartesianPoints);
		let geometry: Geometry;
	
		switch (mode) {
			case AnnotationMode.Point: {
				geometry = {
					type: AnnotationMode.Point,
					coordinates: coordinates[0]
				};
				break;
			}
			case AnnotationMode.Polygon: {
				geometry = {
					type: AnnotationMode.Polygon,
					coordinates: [[...coordinates, coordinates[0]]]
				};
				break;
			}
			case AnnotationMode.LineString: {
				geometry = {
					type: AnnotationMode.LineString,
					coordinates: coordinates
				};
				break;
			}
		} 

		const feature = turfFeature(geometry);
		const featureCollection = turfFeatureCollection([feature]) as FeatureCollection<GeometryObject>;
		return featureCollection;
	}
}
