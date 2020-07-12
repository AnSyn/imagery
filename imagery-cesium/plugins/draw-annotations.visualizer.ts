import { BaseImageryPlugin, IVisualizerEntity, ImageryPlugin, IVisualizerStateStyle, ANNOTATIONS_INITIAL_STYLE } from '@ansyn/imagery';
import { Viewer, Cartesian3, Entity, Property, CallbackProperty, PolygonHierarchy, defined, ColorMaterialProperty, HeightReference, Color, Cartesian2, PolylineGeometry, Rectangle, Ellipsoid } from 'cesium';
import { CesiumMap } from '../maps/cesium-map/cesium-map';
import { Observable, Subscription, Subject } from 'rxjs';
import { FeatureCollection, GeometryObject, Feature } from 'geojson';
import { take, tap } from 'rxjs/operators';
import { cartesianToCoordinates, cartographicToPosition } from './utils/cesiumToGeo';
import { feature as turfFeature, featureCollection as turfFeatureCollection, Geometry, Position } from '@turf/turf';
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

	private activeShapePoints: Cartesian3[];

	/* all added entites which enable drawing visualization 
	but eventually they should be removed from map */
	private temporaryShapes: Entity[];

	/* floating point is the point that sticks to the cursor when drawing!
	on every mouse move event it's value is updated to the last mouse position */
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

	// if the user draws a rectangle, we need to keep track of it in order to build
	// the Array<Position> passed to the Geometry object at the end of the drawing
	private rectangle = new Rectangle();
	private get rectangleCornersPositions(): Position[] {
		return [
			cartographicToPosition(Rectangle.northwest(this.rectangle)),
			cartographicToPosition(Rectangle.northeast(this.rectangle)),
			cartographicToPosition(Rectangle.southeast(this.rectangle)),
			cartographicToPosition(Rectangle.southwest(this.rectangle))
		];
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

	startDrawing(mode: AnnotationMode): boolean {
		if (!this.isDrawingModeSupported(mode)) {
			return false;
		}

		this.drawingMode = mode;
		this.reset();

		const mouseMoveEventSubscription = this.mouseMoveEvent$.subscribe((event) => {
			this.onMouseMoveEvent(event.endPosition);
		});
		this.mapEventsSubscription.add(mouseMoveEventSubscription)

		let leftClickEventSubscription: Subscription;
		if (this.drawingMode === AnnotationMode.Point) {
			leftClickEventSubscription = this.leftClickEvent$.pipe(take(1), tap((screenPixels: IPixelPosition) => {
				const earthPosition = this.cesiumMap.getEarthPositionFromScreenPixels(screenPixels.position);

				if (defined(earthPosition)) {
					this.activeShapePoints = [earthPosition];				
					this.events.onDrawEnd.next(this.onDrawEnd());
				}
			})).subscribe();
			this.mapEventsSubscription.add(leftClickEventSubscription);

			return true;
		}

		leftClickEventSubscription = this.leftClickEvent$.subscribe((screenPixels: IPixelPosition) => {
			const earthPosition = this.cesiumMap.getEarthPositionFromScreenPixels(screenPixels.position);
			if (defined(earthPosition)) {
				if (!this.activeShapePoints) {
					this.activeShapePoints = [];

					this.activeShapePoints.push(earthPosition);
					const dynamicPositions = new CallbackProperty(() => {
						if (this.drawingMode === AnnotationMode.Polygon) {
							return new PolygonHierarchy(this.activeShapePoints);
						}
						if (this.drawingMode === AnnotationMode.Rectangle) {
							return Rectangle.fromCartesianArray(this.activeShapePoints, Ellipsoid.WGS84, this.rectangle);
						}
						return this.activeShapePoints;
					}, false);
					this.addAnnotation(this.drawingMode as unknown as AnnotationType, dynamicPositions);
				}
				this.activeShapePoints.push(earthPosition);
			}
		})

		const leftDoubleClickEventSubscription = this.leftDoubleClickEvent$.pipe(take(1), tap(() => this.events.onDrawEnd.next(this.onDrawEnd()))).subscribe();

		this.mapEventsSubscription.add(leftDoubleClickEventSubscription);
		this.mapEventsSubscription.add(leftClickEventSubscription);
		return true;
	}

	private onMouseMoveEvent(pixelPoint: Cartesian2) {
		const newEarthPosition = this.cesiumMap.getEarthPositionFromScreenPixels(pixelPoint);

		if (!defined(this.floatingPoint)) {
			this.floatingPoint = defined(newEarthPosition) ? this.addAnnotation(AnnotationType.Point, newEarthPosition) : undefined;

			return;
		}
	
		if (!!this.floatingPoint.position) {
			(this.floatingPoint.position as any).setValue(newEarthPosition);
		}

		if (!!this.activeShapePoints && this.activeShapePoints.length > 1) {
			this.activeShapePoints.pop();
			this.activeShapePoints.push(newEarthPosition);
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
				const tempPloyline = this.viewer.entities.add({
					polyline: {
						positions: new CallbackProperty(() => {
							return this.activeShapePoints;
						}, false),
						clampToGround: true,
						width: 3,
					},
				});

				this.temporaryShapes.push(tempPloyline);
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
			case AnnotationType.Rectangle: {
				shape = this.viewer.entities.add({
					rectangle: {						
						coordinates: positionData as Property,
						material: new ColorMaterialProperty(Color.WHITE.withAlpha(0.7)), // todo: material color should come from drawing config / argument
					},
				});
			}
		}
		this.temporaryShapes.push(shape);
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
		if (!!this.temporaryShapes) {
			this.temporaryShapes.forEach(shape => {
				this.viewer.entities.remove(shape);
			});
		}
		this.floatingPoint = undefined;
		this.activeShapePoints = undefined;
		this.temporaryShapes = [];
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
			case AnnotationMode.Rectangle: {
				geometry = {
					type: AnnotationMode.Polygon,
					coordinates: [this.rectangleCornersPositions]
				}
				break;
			}
		} 

		const feature = turfFeature(geometry);
		const featureCollection = turfFeatureCollection([feature]) as FeatureCollection<GeometryObject>;
		return featureCollection;
	}

	private isDrawingModeSupported(mode: AnnotationMode) {
		const supportedModes = Object.values(AnnotationMode);
		return supportedModes.includes(mode);
	}

	onDispose() {
		this.reset();
		super.onDispose();
	}
}
