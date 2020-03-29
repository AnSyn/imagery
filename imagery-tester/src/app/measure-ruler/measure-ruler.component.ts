import { Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  CommunicatorEntity,
  ImageryCommunicatorService
} from '@ansyn/imagery';
import { MeasureRulerVisualizer } from '@ansyn/imagery-ol';

@Component({
  selector: 'measure-ruler',
  templateUrl: './measure-ruler.component.html',
  styleUrls: ['./measure-ruler.component.less']
})
export class MeasureRulerComponent implements OnInit, OnDestroy {
  mapId: string;
  show: boolean;
  communicator: CommunicatorEntity;
  measureRulerVisualizerPlugin: MeasureRulerVisualizer;

  constructor(protected element: ElementRef,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
      this.measureRulerVisualizerPlugin = this.communicator.getPlugin(MeasureRulerVisualizer);
      this.communicator.mapInstanceChanged.subscribe(() => {
        this.measureRulerVisualizerPlugin = this.communicator.getPlugin(MeasureRulerVisualizer);
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
    this.measureRulerVisualizerPlugin && this.measureRulerVisualizerPlugin.clearRulerEntities();
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
}
