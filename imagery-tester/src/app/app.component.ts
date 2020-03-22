import { Component } from '@angular/core';
import { IMapSettings, ImageryCommunicatorService } from '@ansyn/imagery';
import IMAGERY_SETTINGS from './IMAGERY_SETTINGS';
import { AnnotationsVisualizer } from '@ansyn/ol';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  public settings: IMapSettings = IMAGERY_SETTINGS;
}
