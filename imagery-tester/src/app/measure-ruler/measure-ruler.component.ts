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

  constructor(protected element: ElementRef,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
    });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  toggleRuler() {
    const plugin = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    if (plugin) {
      const newState = !plugin.isRulerEnabled;
      if (newState) {
        plugin.startDeleteSingleEntity(false);
      }
      plugin.enableRuler(newState);
    }
  }

  clearRulerEntities() {
    const plugin: MeasureRulerVisualizer = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    plugin && plugin.clearRulerEntities();
  }

  deleteEntity() {
    const plugin: MeasureRulerVisualizer = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    if (plugin) {
      const newState = !plugin.isRulerRemoveEntitiesEnabled;
      if (newState) {
        plugin.enableRuler(false);
      }
      plugin.startDeleteSingleEntity(newState);
    }
  }

  get isRulerEnabled() {
    const plugin: MeasureRulerVisualizer = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    return plugin && plugin.isRulerEnabled;
  }

  get isRulerRemoveEntitiesEnabled() {
    const plugin: MeasureRulerVisualizer = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    return plugin && plugin.isRulerRemoveEntitiesEnabled;
  }
}
