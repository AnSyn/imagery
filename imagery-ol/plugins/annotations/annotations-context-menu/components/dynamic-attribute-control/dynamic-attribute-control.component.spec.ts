import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicAttributeInputComponent } from './dynamic-attribute-control.component';

describe('DynamicAttributeInputComponent', () => {
  let component: DynamicAttributeInputComponent;
  let fixture: ComponentFixture<DynamicAttributeInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicAttributeInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicAttributeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
