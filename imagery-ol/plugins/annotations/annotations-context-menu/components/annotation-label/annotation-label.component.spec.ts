import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnnotationLabelComponent } from './annotation-label.component';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

describe('AnnotationLabelComponent', () => {
	let component: AnnotationLabelComponent;
	let fixture: ComponentFixture<AnnotationLabelComponent>;

	beforeEach(waitForAsync(() => {
		TestBed.configureTestingModule({
			declarations: [AnnotationLabelComponent],
			imports: [BrowserAnimationsModule, FormsModule, MatInputModule, MatSelectModule, TranslateModule.forRoot()]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AnnotationLabelComponent);
		component = fixture.componentInstance;
		component.label = {text: 'label'};
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
