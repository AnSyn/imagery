import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiChoiceAttributeComponent } from './multi-choice-attribute.component';

describe('MultiChoiceAttributeComponent', () => {
  let component: MultiChoiceAttributeComponent;
  let fixture: ComponentFixture<MultiChoiceAttributeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MultiChoiceAttributeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultiChoiceAttributeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
