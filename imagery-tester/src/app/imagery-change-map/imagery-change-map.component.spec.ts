import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageryChangeMapComponent } from './imagery-change-map.component';
import { ImageryCommunicatorService, MAP_PROVIDERS_CONFIG } from '@ansyn/imagery';
import { MockComponent } from '../../../../test/mock-component';

const SOURCETYPE = 'sourceType';
const MAPID = 'mapId';
describe('ImageryChangeMapComponent', () => {
	let component: ImageryChangeMapComponent;
  let fixture: ComponentFixture<ImageryChangeMapComponent>;
  const mockMeasureRuler = MockComponent({ selector: 'app-measure-ruler', inputs: [] });
  const mockImageryPerformance = MockComponent({ selector: 'app-imagery-performance', inputs: [] });
  const mockMapEvents = MockComponent({ selector: 'app-map-events', inputs: [] });
  const mockImageProcessingControl = MockComponent({ selector: 'app-image-processing-control', inputs: [] });

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ImageryChangeMapComponent, mockMeasureRuler, mockImageryPerformance, mockMapEvents, mockImageProcessingControl],
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
		fixture = TestBed.createComponent(ImageryChangeMapComponent);
		component = fixture.componentInstance;
		component.mapId = MAPID;
		component.currentSourceType = `other${SOURCETYPE}`;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
