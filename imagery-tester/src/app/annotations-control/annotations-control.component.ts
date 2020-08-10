import { Component, OnInit } from '@angular/core';
import {
  BaseImageryVisualizer, CommunicatorEntity,
  ImageryCommunicatorService,
  IVisualizerEntity
} from '@ansyn/imagery';
import {
  ANNOTATION_MODE_LIST,
  AnnotationsVisualizer,
  IDrawEndEvent,
  OpenlayersMapName
} from '@ansyn/imagery-ol';
import { fromEvent, of } from 'rxjs';
import { filter, mergeMap, take, tap } from 'rxjs/operators';
import IMAGERY_SETTINGS from '../IMAGERY_SETTINGS';
import { CesiumMapName, CesiumDrawAnnotationsVisualizer } from '@ansyn/imagery-cesium';
import { MouseMarkerPlugin } from '../plugins/cesium/mouse-marker-plugin';
import { GeoJsonObject } from 'geojson';

@Component({
  selector: 'app-annotations-control',
  templateUrl: './annotations-control.component.html',
  styleUrls: ['./annotations-control.component.less']
})
export class AnnotationsControlComponent implements OnInit {
  ANNOTATION_MODE_LIST = ANNOTATION_MODE_LIST;
  annotations: AnnotationsVisualizer;
  cesiumDrawer: CesiumDrawAnnotationsVisualizer;
  reader = new FileReader();
  currentEntities: IVisualizerEntity[];
  communicator: CommunicatorEntity;

  onFileLoad$ = fromEvent(this.reader, 'load').pipe(
    mergeMap(() => {
      const readerResult: string = <string>this.reader.result;
      const geoJSON = <GeoJsonObject> JSON.parse(readerResult);
      /*const entities = this.annotations.annotationsLayerToEntities(geoJSON);
      return this.annotations.addOrUpdateEntities(entities);
*/

      this.communicator.addGeojsonLayer(geoJSON);
      return of(true);
    })
  );

  constructor(protected communicators: ImageryCommunicatorService) {
  }

  onInitMap() {
    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
    this.communicator = communicator;
    this.annotations = communicator.getPlugin(AnnotationsVisualizer);
    this.subscribeToOnDisposePlugin(this.annotations);
    communicator.mapInstanceChanged.subscribe(() => {
      if (communicator.activeMapName === OpenlayersMapName) {
        this.annotations = communicator.getPlugin(AnnotationsVisualizer);
        this.subscribeToOnDisposePlugin(this.annotations);
        if (Array.isArray(this.currentEntities)) {
          this.annotations.setEntities(this.currentEntities).pipe(take(1)).subscribe();
        }
      } else if (communicator.activeMapName === CesiumMapName) {
        const plugin = communicator.getPlugin(MouseMarkerPlugin);
        this.cesiumDrawer = communicator.getPlugin(CesiumDrawAnnotationsVisualizer);

        if (plugin.isReady) {
          plugin.isEnabled = false;
          plugin.setEntities(this.currentEntities).pipe(take(1)).subscribe();
        } else {
          plugin.isReady$.pipe(take(1)).subscribe(() => {
            plugin.isEnabled = false;
            plugin.setEntities(this.currentEntities).pipe(take(1)).subscribe();
          });
        }
      }
    });
  }

  subscribeToOnDisposePlugin(plugin: BaseImageryVisualizer) {
    if (plugin) {
      plugin.onDisposedEvent.pipe(take(1)).subscribe(() => {
        this.currentEntities = plugin.getEntities();
      });
    }
  }

  ngOnInit() {
    this.communicators.instanceCreated.pipe(
      filter(({ id }) => id === IMAGERY_SETTINGS.id),
      tap(this.onInitMap.bind(this)),
      take(1)
    ).subscribe();

    this.onFileLoad$.subscribe();
  }

  draw(mode) {
    if (this.communicator.activeMapName === OpenlayersMapName) {
      this.annotations.setMode(this.annotations.mode === mode ? null : mode, true);
      this.annotations.events.onDrawEnd.pipe(take(1)).subscribe((drawEndEvent: IDrawEndEvent) => {
        const newEntities = this.annotations.annotationsLayerToEntities(drawEndEvent.GeoJSON);
        this.annotations.addOrUpdateEntities(newEntities).subscribe();
      });
    } else if (this.communicator.activeMapName === CesiumMapName) {
      const isDrawingStarted = this.cesiumDrawer.startDrawing(mode);
      if (isDrawingStarted) {
        this.cesiumDrawer.events.onDrawEnd.pipe(take(1)).subscribe(geoJson => {
          const plugin = this.communicator.getPlugin(MouseMarkerPlugin);
          const newEntities = plugin.annotationsLayerToEntities(geoJson);
          plugin.addOrUpdateEntities(newEntities).pipe(take(1)).subscribe();
        });
      }
    }
  }

  /*
  tap(([{ GeoJSON, feature }, activeAnnotationLayer]: [IDrawEndEvent, ILayer]) => {
			const [geoJsonFeature] = GeoJSON.features;
			const data = <FeatureCollection<any>>{ ...activeAnnotationLayer.data };
			data.features.push(geoJsonFeature);
			if (this.overlay) {
				geoJsonFeature.properties = {
					...geoJsonFeature.properties,
					...this.projectionService.getProjectionProperties(this.communicator, data, feature, this.overlay)
				};
			}
			geoJsonFeature.properties = { ...geoJsonFeature.properties };
			this.store$.dispatch(new UpdateLayer(<ILayer>{ ...activeAnnotationLayer, data }));
		})
   */

  clear() {
    this.annotations.clearEntities();
  }

  changeFill(color) {
    this.annotations.updateStyle({ initial: { fill: color } });
  }

  changeStroke(color) {
    this.annotations.updateStyle({ initial: { stroke: color } });
  }

  loadJSON(files: FileList) {
    const file = files.item(0);
    if (file) {
      this.reader.readAsText(file, 'UTF-8');
    }
  }

  drawAnnotationWithIcon({ value }) {
    let iconSrc;
    if (value === 'None') {
      iconSrc = '';
    } else {
      iconSrc = `assets/${ value }.svg`;
    }
    this.annotations.setIconSrc(iconSrc);
  }
}
