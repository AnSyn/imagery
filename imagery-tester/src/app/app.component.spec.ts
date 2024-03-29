import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { MockComponent } from '../../../test/mock-component';

describe('AppComponent', () => {
  const imageryChangeMap = MockComponent({ selector: 'app-imagery-change-map', inputs: [] });
  const imageryView = MockComponent({ selector: 'ansyn-imagery-view', inputs: ['settings'] });
  const appNavbar = MockComponent({ selector: 'app-navbar', inputs: [] });
  const annotationsContextMenu = MockComponent({ selector: 'ansyn-annotations-context-menu', inputs: ['mapId'] });
  const appAnnotationControl = MockComponent({ selector: 'app-annotations-control', inputs: [] });


  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        imageryChangeMap,
        imageryView,
        appNavbar,
        annotationsContextMenu,
        appAnnotationControl
      ],
    }).compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});
