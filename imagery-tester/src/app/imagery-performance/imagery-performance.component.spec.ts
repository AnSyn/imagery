import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ImageryCommunicatorService, MAP_PROVIDERS_CONFIG } from '@ansyn/imagery';
import { ImageryPerformanceComponent } from './imagery-performance.component';

const SOURCETYPE = 'sourceType';
const MAPID = 'mapId';
describe('MeasureRulerComponent', () => {
	let component: ImageryPerformanceComponent;
	let fixture: ComponentFixture<ImageryPerformanceComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			declarations: [ImageryPerformanceComponent],
			providers: [
        ImageryCommunicatorService,
				{
					provide: MAP_PROVIDERS_CONFIG,
					useValue: {}
				}
			]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ImageryPerformanceComponent);
		component = fixture.componentInstance;
		component.mapId = MAPID;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
