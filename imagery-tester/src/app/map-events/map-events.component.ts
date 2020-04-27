import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommunicatorEntity, ImageryCommunicatorService } from '@ansyn/imagery';
import { IMouseClick } from '@ansyn/imagery';
import { TestOLPerformanceVisualizer } from '../plugins/ol/test-ol-performance-visualizer';

@Component({
  selector: 'map-events',
  templateUrl: './map-events.component.html',
  styleUrls: ['./map-events.component.less']
})
export class MapEventsComponent implements OnInit, OnDestroy {
  communicator: CommunicatorEntity;

  rightClickSubscription;
  doubleClickSubscription;
  singleclickSubscription;
  testOLPerformanceVisualizer;

  constructor(protected element: ElementRef,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
      this.testOLPerformanceVisualizer = this.communicator.getPlugin(TestOLPerformanceVisualizer);
      this.communicator.mapInstanceChanged.subscribe(() => {
        this.unsubscribeAll();
        this.testOLPerformanceVisualizer = this.communicator.getPlugin(TestOLPerformanceVisualizer);
      });
    });
  }

  onSingleClick(mouseClickArgs: IMouseClick) {
    this.onClicked('single click ', mouseClickArgs);
  }

  onRightClick(mouseClickArgs: IMouseClick) {
    this.onClicked('right click ', mouseClickArgs);
  }

  onDoubleClick(mouseClickArgs: IMouseClick) {
    this.onClicked('double click ', mouseClickArgs);
  }

  onClicked(message: string, mouseClickArgs: IMouseClick) {
    mouseClickArgs.originalEvent.preventDefault();
    alert(message + JSON.stringify(mouseClickArgs.worldLocation));

    const aa = this.testOLPerformanceVisualizer.entityAtPixel(mouseClickArgs.screenPixel);
    if (aa) {
      alert('found entity ' + aa.id);
    }
  }

  registerSingleClick() {
    if (!this.singleclickSubscription) {
      this.singleclickSubscription = this.communicator.ActiveMap.mouseSingleClick.subscribe(this.onSingleClick.bind(this));
    } else {
      this.unsubscribeEvent(this.singleclickSubscription);
      this.singleclickSubscription = null;
    }
  }

  registerRighClick() {
    if (!this.rightClickSubscription) {
      this.rightClickSubscription = this.communicator.ActiveMap.mouseRightClick.subscribe(this.onRightClick.bind(this));
    } else {
      this.unsubscribeEvent(this.rightClickSubscription);
      this.rightClickSubscription = null;
    }
  }

  registerDoubleClick() {
    if (!this.doubleClickSubscription) {
      this.doubleClickSubscription = this.communicator.ActiveMap.mouseDoubleClick.subscribe(this.onDoubleClick.bind(this));
    } else {
      this.unsubscribeEvent(this.doubleClickSubscription);
      this.doubleClickSubscription = null;
    }
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  unsubscribeAll() {
    this.unsubscribeEvent(this.rightClickSubscription);
    this.rightClickSubscription = null;

    this.unsubscribeEvent(this.doubleClickSubscription);
    this.doubleClickSubscription = null;

    this.unsubscribeEvent(this.singleclickSubscription);
    this.singleclickSubscription = null;
  }

  unsubscribeEvent(subscription) {
    if (subscription) {
      subscription.unsubscribe();
    }
  }
}
