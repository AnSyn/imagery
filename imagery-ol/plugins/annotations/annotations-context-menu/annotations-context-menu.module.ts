import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnnotationContextMenuComponent } from './components/annotation-context-menu/annotation-context-menu.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';

import { AnnotationsWeightComponent } from './components/annotations-weight/annotations-weight.component';
import { AnnotationsColorComponent } from './components/annotations-color/annotations-color.component';
import { ColorPickerComponent } from './components/color-picker/color-picker.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { TranslateModule } from '@ngx-translate/core';
import { AnnotationLabelComponent } from './components/annotation-label/annotation-label.component';
import { AnnotationsContextMenuButtonsComponent } from './components/annotations-context-menu-buttons/annotations-context-menu-buttons.component';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DynamicMetadataFormComponent } from './components/dynamic-metadata-form/dynamic-metadata-form.component';
import { DynamicAttributeControlComponent } from './components/dynamic-attribute-control/dynamic-attribute-control.component';
import { MultiChoiceAttributeComponent } from './components/multi-choice-attribute/multi-choice-attribute.component';

@NgModule({
	declarations: [
		AnnotationContextMenuComponent,
		AnnotationsWeightComponent,
		AnnotationsColorComponent,
		ColorPickerComponent,
		AnnotationLabelComponent,
		AnnotationsContextMenuButtonsComponent,
		DynamicMetadataFormComponent,
		DynamicAttributeControlComponent,
		MultiChoiceAttributeComponent
	],
	entryComponents: [AnnotationContextMenuComponent],
	exports: [
		AnnotationContextMenuComponent,
		AnnotationsWeightComponent,
		AnnotationsColorComponent,
		ColorPickerComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ColorPickerModule,
		MatInputModule,
		MatSelectModule,
		TranslateModule,
		ReactiveFormsModule,
		MatChipsModule,
		MatIconModule,
		MatFormFieldModule,
		MatMenuModule
	]
})
export class AnnotationsContextMenuModule {
}
