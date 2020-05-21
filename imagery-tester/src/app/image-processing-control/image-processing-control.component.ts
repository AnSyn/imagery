import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { filter, map, take, tap } from 'rxjs/operators';
import { IImageProcParam, ImageManualProcessArgs } from '@ansyn/imagery-ol';
import IMAGERY_SETTINGS from '../IMAGERY_SETTINGS';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { ImageProcessingPlugin } from '@ansyn/imagery-ol';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ansyn-image-processing-control',
  templateUrl: './image-processing-control.component.html',
  styleUrls: ['./image-processing-control.component.less']
})
export class ImageProcessingControlComponent implements OnInit, OnDestroy {
  defaultParams = [
    {
      'name': 'Sharpness',
      'defaultValue': 0,
      'min': 0,
      'max': 100
    },
    {
      'name': 'Contrast',
      'defaultValue': 0,
      'min': -100,
      'max': 100
    },
    {
      'name': 'Brightness',
      'defaultValue': 0,
      'min': -100,
      'max': 100
    },
    {
      'name': 'Gamma',
      'defaultValue': 100,
      'min': 1,
      'max': 200
    },
    {
      'name': 'Saturation',
      'defaultValue': 100,
      'min': 1,
      'max': 100
    }
  ];
  localParams;
  imageManualProcessArgs: ImageManualProcessArgs = this.defaultImageManualProcessArgs;

  get params(): Array<IImageProcParam> {
    return this.localParams;
  }

  get defaultImageManualProcessArgs(): ImageManualProcessArgs {
    return this.defaultParams.reduce<ImageManualProcessArgs>((initialObject: any, imageProcParam) => {
      return <any>{ ...initialObject, [imageProcParam.name]: imageProcParam.defaultValue };
    }, {});
  }

  constructor(protected communicators: ImageryCommunicatorService) {
    this.localParams = cloneDeep(this.defaultParams);
  }

  resetOne(paramToReset) {
    this.updateParam(this.defaultImageManualProcessArgs[paramToReset.name], paramToReset.name);
  }

  updateParam(value, key) {
    const imageManualProcessArgs = { ...this.imageManualProcessArgs };
    imageManualProcessArgs[key] = value;
    if (this.imageProcessPluggin) {
      this.imageProcessPluggin.startImageProcessing(false, imageManualProcessArgs);
    }
    this.imageManualProcessArgs = { ...imageManualProcessArgs };
  }

  resetParams() {
    if (this.imageProcessPluggin) {
      this.imageProcessPluggin.startImageProcessing(false, { ...this.defaultImageManualProcessArgs });
    }
    this.imageManualProcessArgs = this.defaultImageManualProcessArgs;
  }

  ngOnInit() {
    this.communicators.instanceCreated.pipe(
      filter(({ id }) => id === IMAGERY_SETTINGS.id),
      tap(this.onInitMap.bind(this)),
      take(1)
    ).subscribe();
  }

  imageProcessPluggin: ImageProcessingPlugin;

  onInitMap() {
    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
    this.imageProcessPluggin = communicator.getPlugin(ImageProcessingPlugin);
    communicator.mapInstanceChanged.subscribe(() => {
      this.imageProcessPluggin = communicator.getPlugin(ImageProcessingPlugin);
    });
  }

  ngOnDestroy(): void {

  }
}
