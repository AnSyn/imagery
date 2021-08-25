import { ComponentFixture, inject, TestBed, waitForAsync } from '@angular/core/testing';
import { ImageryCommunicatorService, MAP_PROVIDERS_CONFIG } from '@ansyn/imagery';
import { MeasureRulerComponent } from './measure-ruler.component';

const SOURCETYPE = 'sourceType';
const MAPID = 'mapId';
describe('MeasureRulerComponent', () => {
	let component: MeasureRulerComponent;
	let fixture: ComponentFixture<MeasureRulerComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			declarations: [MeasureRulerComponent],
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
		fixture = TestBed.createComponent(MeasureRulerComponent);
		component = fixture.componentInstance;
		component.mapId = MAPID;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
 	});
});
