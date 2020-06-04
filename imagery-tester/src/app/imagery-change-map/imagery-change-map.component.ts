import { Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  CommunicatorEntity, ImageryCommunicatorService,
  IMapProviderConfig,
  IMapSource,
  MAP_PROVIDERS_CONFIG
} from '@ansyn/imagery';
import { GridLinesVisualizer, MeasureRulerVisualizer } from '@ansyn/imagery-ol';
import {CesiumGridLinesVisualizer} from '@ansyn/imagery-cesium';

@Component({
  selector: 'app-imagery-change-map',
  templateUrl: './imagery-change-map.component.html',
  styleUrls: ['./imagery-change-map.component.less']
})
export class ImageryChangeMapComponent implements OnInit, OnDestroy {
  mapId: string;
  show: boolean;
  currentSourceType: string;
  mapSources: IMapSource[];
  currentMapType: string;
  mapTypes: string[];
  communicator: CommunicatorEntity;

  constructor(protected element: ElementRef,
              @Inject(MAP_PROVIDERS_CONFIG) protected mapProvidersConfig: IMapProviderConfig,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
      this.currentSourceType = this.communicator.mapSettings.worldView.sourceType;
      this.mapSources = this.mapProvidersConfig[this.communicator.ActiveMap.mapType].sources;
      this.mapTypes = [];
      for (const i of Object.keys(this.mapProvidersConfig)) {
        this.mapTypes.push(i);
      }
      this.currentMapType = this.communicator.ActiveMap.mapType;
    });
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
  }

  changeMap(type: string) {
    if (this.currentSourceType !== type) {
      this.communicator.replaceMapMainLayer(type).then(() => {
        this.currentSourceType = type;
      });
    }
  }

  changeMapType(type: string) {
    this.communicator.getPosition().subscribe((position) => {
      this.communicator.setActiveMap(type, position).then(() => {
        this.currentMapType = type;
        this.currentSourceType = this.communicator.mapSettings.worldView.sourceType;
        this.mapSources = this.mapProvidersConfig[this.communicator.ActiveMap.mapType].sources;
      });
    });
  }

  toggleRuler() {
    const plugin = this.communicator.getPlugin(MeasureRulerVisualizer);
    const newState = !plugin.isRulerEnabled;
    if (newState) {
      plugin.startDeleteSingleEntity(false);
    }
    plugin.enableRuler(newState);
  }

  clearRulerEntities() {
    const plugin = this.communicator.getPlugin(MeasureRulerVisualizer);
    plugin.clearRulerEntities();
  }

  deleteEntity() {
    const plugin = this.communicator.getPlugin(MeasureRulerVisualizer);
    const newState = !plugin.isRulerRemoveEntitiesEnabled;
    if (newState) {
      plugin.enableRuler(false);
    }
    plugin.startDeleteSingleEntity(newState);
  }

  get isRulerEnabled() {
    const plugin = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    return plugin && plugin.isRulerEnabled;
  }

  get isRulerRemoveEntitiesEnabled() {
    const plugin = this.communicator && this.communicator.getPlugin(MeasureRulerVisualizer);
    return plugin && plugin.isRulerRemoveEntitiesEnabled;
  }

  showGrid() {
    let plugin;
    if (!!this.communicator) {
      plugin = this.communicator.getPlugin(GridLinesVisualizer) || this.communicator.getPlugin(CesiumGridLinesVisualizer);
    }
    if (plugin && plugin.isEnabled) {
      plugin.isEnabled = false;
    } else {
      plugin.isEnabled = true;
    }
  }

  get isGridVisualizerExists() {
    let plugin;
    if (!!this.communicator) {
      plugin = this.communicator.getPlugin(GridLinesVisualizer) || this.communicator.getPlugin(CesiumGridLinesVisualizer);
    }
    return Boolean(plugin);
  }
}
