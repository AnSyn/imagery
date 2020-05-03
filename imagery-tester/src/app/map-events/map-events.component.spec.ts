import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ImageryCommunicatorService, MAP_PROVIDERS_CONFIG } from '@ansyn/imagery';
import { MapEventsComponent } from './map-events.component';

describe('MeasureRulerComponent', () => {
	let component: MapEventsComponent;
	let fixture: ComponentFixture<MapEventsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [MapEventsComponent],
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
		fixture = TestBed.createComponent(MapEventsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
