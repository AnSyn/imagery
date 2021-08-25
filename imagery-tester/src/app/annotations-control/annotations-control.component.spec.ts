import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnnotationsControlComponent } from './annotations-control.component';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { NavbarModule } from '../navbar/navbar.module';
import { MccColorPickerModule } from 'material-community-components';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

describe('AnnotationsControlComponent', () => {
  let component: AnnotationsControlComponent;
  let fixture: ComponentFixture<AnnotationsControlComponent>;

  beforeEach(waitForAsync(() => {
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
