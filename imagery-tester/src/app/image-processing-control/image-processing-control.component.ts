import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { filter, map, take, tap } from 'rxjs/operators';
import {
  getDefaultImageProcParams,
  IImageProcParam,
  IImageManualProcessArgs
} from '@ansyn/imagery-ol';
import IMAGERY_SETTINGS from '../IMAGERY_SETTINGS';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { ImageProcessingPlugin } from '@ansyn/imagery-ol';

@Component({
  selector: 'app-image-processing-control',
  templateUrl: './image-processing-control.component.html',
  styleUrls: ['./image-processing-control.component.less']
})
export class ImageProcessingControlComponent implements OnInit, OnDestroy {

  localParams: any;
  imageManualProcessArgs: IImageManualProcessArgs;
  imageProcessPluggin: ImageProcessingPlugin;

  get params(): Array<IImageProcParam> {
    return this.localParams;
  }

  getDefaultImageManualProcessArgs(): IImageManualProcessArgs {
    return this.localParams.reduce((initialObject: any, imageProcParam) => {
      return { ...initialObject, [imageProcParam.name]: imageProcParam.defaultValue };
    }, {});
  }

  constructor(protected communicators: ImageryCommunicatorService) {
    this.localParams = getDefaultImageProcParams();
    this.imageManualProcessArgs = this.getDefaultImageManualProcessArgs();
  }

  resetOne(paramToReset) {
    this.updateParam(this.getDefaultImageManualProcessArgs()[paramToReset.name], paramToReset.name);
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
      this.imageProcessPluggin.startImageProcessing(false, { ...this.getDefaultImageManualProcessArgs() });
    }
    this.imageManualProcessArgs = this.getDefaultImageManualProcessArgs();
  }

  ngOnInit() {
    this.communicators.instanceCreated.pipe(
      filter(({ id }) => id === IMAGERY_SETTINGS.id),
      tap(this.onInitMap.bind(this)),
      take(1)
    ).subscribe();
  }

  onInitMap() {
    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
    this.imageProcessPluggin = communicator.getPlugin(ImageProcessingPlugin);
    communicator.mapInstanceChanged.subscribe(() => {
      this.imageProcessPluggin = communicator.getPlugin(ImageProcessingPlugin);
      this.imageManualProcessArgs = this.getDefaultImageManualProcessArgs();
    });
  }

  ngOnDestroy(): void {

  }
}
