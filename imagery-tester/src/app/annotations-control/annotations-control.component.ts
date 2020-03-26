import {Component, OnInit} from '@angular/core';
import {ImageryCommunicatorService, IVisualizerEntity} from '@ansyn/imagery';
import {ANNOTATION_MODE_LIST, AnnotationsVisualizer, IDrawEndEvent} from '@ansyn/imagery-ol';
import {fromEvent} from 'rxjs';
import {filter, mergeMap, take, tap} from 'rxjs/operators';
import IMAGERY_SETTINGS from '../IMAGERY_SETTINGS';

@Component({
  selector: 'app-annotations-control',
  templateUrl: './annotations-control.component.html',
  styleUrls: ['./annotations-control.component.less']
})
export class AnnotationsControlComponent implements OnInit {
  ANNOTATION_MODE_LIST = ANNOTATION_MODE_LIST;
  annotations: AnnotationsVisualizer;
  reader = new FileReader();

  onFileLoad$ = fromEvent(this.reader, 'load').pipe(
    mergeMap(() => {
      const readerResult: string = <string>this.reader.result;
      const geoJSON = JSON.parse(readerResult);
      const entities = this.annotations.annotationsLayerToEntities(geoJSON);
      return this.annotations.addOrUpdateEntities(entities);
    })
  );

  constructor(protected communicators: ImageryCommunicatorService) {
  }

  onInitMap() {
    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
    this.annotations = communicator.getPlugin(AnnotationsVisualizer);
    communicator.mapInstanceChanged.subscribe(() => {
      this.annotations = communicator.getPlugin(AnnotationsVisualizer);
    });
  }

  ngOnInit() {
    this.communicators.instanceCreated.pipe(
      filter(({id}) => id === IMAGERY_SETTINGS.id),
      tap(this.onInitMap.bind(this)),
      take(1)
    ).subscribe();

    this.onFileLoad$.subscribe();
  }

  draw(mode) {
    this.annotations.setMode(this.annotations.mode === mode ? null : mode, true);
    this.annotations.events.onDrawEnd.pipe(take(1)).subscribe((drawEndEvent: IDrawEndEvent) => {
      const newEntities = this.annotations.annotationsLayerToEntities(drawEndEvent.GeoJSON);
      // const [geoJsonFeature] = drawEndEvent.GeoJSON.features;
      // const newEntity: IVisualizerEntity = {id: <string>geoJsonFeature.id, featureJson: geoJsonFeature};
      this.annotations.addOrUpdateEntities(newEntities).subscribe();
    });
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
    this.annotations.updateStyle({initial: {fill: color}});
  }

  changeStroke(color) {
    this.annotations.updateStyle({initial: {stroke: color}});
  }

  loadJSON(files: FileList) {
    const file = files.item(0);
    if (file) {
      this.reader.readAsText(file, 'UTF-8');
    }
  }

  drawAnnotationWithIcon({value}) {
    let iconSrc;
    if (value === 'None') {
      iconSrc = '';
    } else {
      iconSrc = `assets/${value}.svg`;
    }
    this.annotations.setIconSrc(iconSrc);
  }
}
