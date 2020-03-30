import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationsControlComponent } from './annotations-control.component';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { NavbarModule } from '../navbar/navbar.module';
import { MatButtonModule, MatButtonToggleModule, MatIconModule } from '@angular/material';
import { MccColorPickerModule } from 'material-community-components';

describe('AnnotationsControlComponent', () => {
  let component: AnnotationsControlComponent;
  let fixture: ComponentFixture<AnnotationsControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnnotationsControlComponent],
      providers: [ImageryCommunicatorService],
      imports: [
        NavbarModule,
        MatButtonToggleModule,
        MatButtonModule,
        MatIconModule,
        MccColorPickerModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnnotationsControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
