import { Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  CommunicatorEntity,
  ImageryCommunicatorService
} from '@ansyn/imagery';
import { MeasureRulerVisualizer } from '@ansyn/imagery-ol';
import { TestOLVisualizer } from '../plugins/ol/test-ol-visualizer';
import { pipe } from 'rxjs';
import { take } from 'rxjs/operators';
import * as turf from '@turf/turf';
import { bbox, bboxPolygon, circle } from '@turf/turf';

@Component({
  selector: 'app-measure-ruler',
  templateUrl: './measure-ruler.component.html',
  styleUrls: ['./measure-ruler.component.less']
})
export class MeasureRulerComponent implements OnInit, OnDestroy {
  mapId: string;
  show: boolean;
  communicator: CommunicatorEntity;
  measureRulerVisualizerPlugin: MeasureRulerVisualizer;
  testOLVisualizer: TestOLVisualizer;
  needToDrawTestOLVisualizer = false;

  constructor(protected element: ElementRef,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
      this.measureRulerVisualizerPlugin = this.communicator.getPlugin(MeasureRulerVisualizer);
      this.testOLVisualizer = this.communicator.getPlugin(TestOLVisualizer);
      this.communicator.mapInstanceChanged.subscribe(() => {
        this.measureRulerVisualizerPlugin = this.communicator.getPlugin(MeasureRulerVisualizer);
        this.testOLVisualizer = this.communicator.getPlugin(TestOLVisualizer);
      });
    });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  toggleRuler() {
    if (this.measureRulerVisualizerPlugin) {
      const newState = !this.measureRulerVisualizerPlugin.isRulerEnabled;
      if (newState) {
        this.measureRulerVisualizerPlugin.startDeleteSingleEntity(false);
      }
      this.measureRulerVisualizerPlugin.enableRuler(newState);
    }
  }

  clearRulerEntities() {
    if (!!this.measureRulerVisualizerPlugin) {
      this.measureRulerVisualizerPlugin.clearRulerEntities();
    }
  }

  deleteEntity() {
    if (this.measureRulerVisualizerPlugin) {
      const newState = !this.measureRulerVisualizerPlugin.isRulerRemoveEntitiesEnabled;
      if (newState) {
        this.measureRulerVisualizerPlugin.enableRuler(false);
      }
      this.measureRulerVisualizerPlugin.startDeleteSingleEntity(newState);
    }
  }

  get isRulerEnabled() {
    return this.measureRulerVisualizerPlugin && this.measureRulerVisualizerPlugin.isRulerEnabled;
  }

  get isRulerRemoveEntitiesEnabled() {
    return this.measureRulerVisualizerPlugin && this.measureRulerVisualizerPlugin.isRulerRemoveEntitiesEnabled;
  }

  get isMeasureRulerExists(): boolean {
    return Boolean(this.measureRulerVisualizerPlugin);
  }

  get isTestOLVisualizerExists(): boolean {
    return Boolean(this.testOLVisualizer);
  }

  drawTestOLPoint(radius) {
    if (!!this.testOLVisualizer) {
      this.testOLVisualizer.removeSingleClickEvent();
    }
    this.needToDrawTestOLVisualizer = !this.needToDrawTestOLVisualizer;

    let position;
    if (!radius) {
      position = turf.point([-118.02, 33.69]);
    } else {
      const tPoint = turf.point([-118.02, 33.69]);
      position = bboxPolygon(bbox(circle(tPoint, radius)));
    }
    return this.testOLVisualizer &&
      this.testOLVisualizer.drawGotoIconOnMap([true, position]).pipe(take(1)).subscribe();
  }

  createTestOLPoint() {
    if (!!this.testOLVisualizer) {
      this.testOLVisualizer.createSingleClickEvent();
    }
  }
}
