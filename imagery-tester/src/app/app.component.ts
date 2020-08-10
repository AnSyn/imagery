import { Component } from '@angular/core';
import { IMapSettings } from '@ansyn/imagery';
import IMAGERY_SETTINGS from './IMAGERY_SETTINGS';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  public settings: IMapSettings = IMAGERY_SETTINGS;
}
