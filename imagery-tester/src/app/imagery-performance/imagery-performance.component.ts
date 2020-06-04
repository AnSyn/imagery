import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommunicatorEntity, ImageryCommunicatorService } from '@ansyn/imagery';
import { NumberOfEntities, TestOLPerformanceVisualizer } from '../plugins/ol/test-ol-performance-visualizer';

@Component({
  selector: 'app-imagery-performance',
  templateUrl: './imagery-performance.component.html',
  styleUrls: ['./imagery-performance.component.less']
})
export class ImageryPerformanceComponent implements OnInit, OnDestroy {
  mapId: string;
  show: boolean;
  communicator: CommunicatorEntity;
  testOLPerformanceVisualizer: TestOLPerformanceVisualizer;
  timerId;
  number;

  constructor(protected element: ElementRef,
              communicatorService: ImageryCommunicatorService) {
    communicatorService.instanceCreated.subscribe((data) => {
      this.communicator = communicatorService.provide(data.id);
      this.testOLPerformanceVisualizer = this.communicator.getPlugin(TestOLPerformanceVisualizer);
      this.communicator.mapInstanceChanged.subscribe(() => {
        this.testOLPerformanceVisualizer = this.communicator.getPlugin(TestOLPerformanceVisualizer);
      });
    });
  }

  get isTestOLPerformanceVisualizerExists(): boolean {
    return Boolean(this.testOLPerformanceVisualizer);
  }

  get hasNumberOfEntities(): boolean {
    return Boolean(this.number);
  }

  toggleUpdateTimeCycle() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    } else {
      this.timerId = window.setInterval(() => {
        this.setTestEntities(this.number);
      }, 1000);
    }
  }

  purgeCache() {
    this.testOLPerformanceVisualizer.purgeCache();
  }

  clearEntities() {
    this.testOLPerformanceVisualizer.setEntities([]).subscribe();
  }

  drawTestOLPoint(number: number) {
      this.setTestEntities(number);
  }

  setTestEntities(number) {
    this.number = number;
    if (number === 10) {
      this.testOLPerformanceVisualizer.setTestEntities(NumberOfEntities.Entities_10);
    } else if (number === 100) {
      this.testOLPerformanceVisualizer.setTestEntities(NumberOfEntities.Entities_100);
    } else if (number === 1000) {
      this.testOLPerformanceVisualizer.setTestEntities(NumberOfEntities.Entities_1000);
    } else if (number === 10000) {
      this.testOLPerformanceVisualizer.setTestEntities(NumberOfEntities.Entities_10000);
    } else {
      alert('only 10, 100, 1000 and 10000 are supported');
    }
  }

  ngOnInit() {
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
