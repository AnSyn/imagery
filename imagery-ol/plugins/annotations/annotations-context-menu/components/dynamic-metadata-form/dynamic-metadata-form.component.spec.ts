import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { DynamicMetadataFormComponent } from './dynamic-metadata-form.component'

describe('MetadataFormComponent', () => {
	let component: DynamicMetadataFormComponent
	let fixture: ComponentFixture<DynamicMetadataFormComponent>

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [DynamicMetadataFormComponent],
		}).compileComponents()
	}))

	beforeEach(() => {
		fixture = TestBed.createComponent(DynamicMetadataFormComponent)
		component = fixture.componentInstance
		fixture.detectChanges()
	})

	it('should create', () => {
		expect(component).toBeTruthy()
	})
})
