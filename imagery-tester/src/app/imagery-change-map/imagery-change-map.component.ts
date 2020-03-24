import { Component, ElementRef, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  CommunicatorEntity, ImageryCommunicatorService,
  IMapProviderConfig,
  IMapSource,
  MAP_PROVIDERS_CONFIG
} from '@ansyn/imagery';

@Component({
  selector: 'imagery-change-map',
  templateUrl: './imagery-change-map.component.html',
  styleUrls: ['./imagery-change-map.component.less']
})
export class ImageryChangeMapComponent implements OnInit, OnDestroy {
  mapId: string;
  show: boolean;
  currentSourceType: string;
  mapSources: IMapSource[];
  communicator: CommunicatorEntity;

  constructor(protected element: ElementRef,
              @Inject(MAP_PROVIDERS_CONFIG) protected mapProvidersConfig: IMapProviderConfig,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
      this.currentSourceType = this.communicator.mapSettings.worldView.sourceType;
      this.mapSources = this.mapProvidersConfig[this.communicator.ActiveMap.mapType].sources;
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
}
