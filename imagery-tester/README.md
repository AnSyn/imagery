# Imagery Implementation
  This repo show you how to use `@ansyn/imagery` `@ansyn/ol` packages to
  create a fast map web app of your own.
  
## Installation
  Inside your angular project run
  ``` bash
    npm install @ansyn/imagery @ansyn/ol @angular/material @angular/cdk @types/geojson @ngx-translate/core@~10.0.2 
  ```
  or
  ```bash
   yarn add @ansyn/imagery @ansyn/ol @angular/material @angular/cdk @types/geojson @ngx-translate/core@~10.0.2
  ```
  
  [see more information about the Imagery module](https://github.com/AnSyn/ansyn/wiki/Imagery-Package)
## Basic Usage
### Show OpenLayers map with Bing provider
#### Step-1
Open `app.module.ts` file and change it content to:
  ```typescript
import { NgModule } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageryModule, MAP_PROVIDERS_CONFIG, MAP_SOURCE_PROVIDERS_CONFIG} from '@ansyn/imagery';
import { OL_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap } from '@ansyn/ol';
import {AppComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    ImageryModule.provide({
      maps: [OpenLayersMap],
      plugins: [],
      mapSourceProviders: [OpenLayerBingSourceProvider]
    }),
  ],
  providers: [
    {
      provide: OL_CONFIG,
      useValue: {}
    },
    {
      provide: MAP_PROVIDERS_CONFIG,
      useValue: {
        openLayersMap: {
          defaultMapSource: 'BING'
        }
      }
    },
    {
      provide: MAP_SOURCE_PROVIDERS_CONFIG,
      useValue: {
        'BING': {
          key: '<YOUR-KEYS>',
          styles: ['AerialWithLabels']
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```
This will tell our app to use OpenLayers map with our Imagery component. <br>
for more information about `ImageryModule` metadata [click here](https://github.com/AnSyn/ansyn/wiki/Imagery-Lets-Go-Deeper) <br>
for more information about `providers` [click here](https://github.com/AnSyn/ansyn/wiki/Providers)
#### Step-2
Create a sample setting file `IMAGERRY_SETTING.ts` inside your root file
```typescript
import { OpenlayersMapName } from '@ansyn/ol';
import { IMapSettings } from '@ansyn/imagery';

const IMAGERY_SETTINGS: IMapSettings = {
  id: 'id',
  worldView: {
    mapType: OpenlayersMapName,
    sourceType: 'BING'
  },
  flags: {},
  data: {
    position: {
      'extentPolygon': {
        'type': 'Polygon',
        'coordinates': [
          [
            [
              -180,
              90
            ],
            [
              180,
              90
            ],
            [
              180,
              -90
            ],
            [
              -180,
              -90
            ],
            [
              -180,
              90
            ]
          ]
        ]
      }
    }
  }
};

export default IMAGERY_SETTINGS;
```
and import it in your `app.component.ts`<br>
for more information about the settings object [click here](https://github.com/AnSyn/ansyn/wiki/Setting)
```typescript
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
```
#### Step-3
open `app.component.html` file and change it content to:
```html
<div class="app">
  <div class="imagery">
      <div>
        <ansyn-imagery-view [settings]="settings"></ansyn-imagery-view>
      </div>
  </div>
</div>
```
#### Step-4
The `Imagery` component must have a height
give it a style inside `app.component.less`
```less
div.app {
  display: flex;
  position: relative;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  
.imagery {
  display: flex;
  flex: 1;
  box-sizing: border-box;
  padding: 50px 0;
}

/deep/ .ol-scale-line-inner {
    margin-top: 16px;
    min-width: 144px;
  }

  /deep/ .ol-mouse-position {
    bottom: 5px;
    top: auto;
    right: auto;
    padding-left: 13px;
    padding-bottom: 18px;
    color: #cccccc;
  }
}
```
you may also give him specific `height`

#### Step 5
add ol and material style to our global `style.less`
```less
@import "~@angular/material/prebuilt-themes/indigo-pink.css";
@import "~ol/ol.css";
@import url("https://fonts.googleapis.com/icon?family=Material+Icons");

body {
  margin: 0;
}
```

### Draw annotations on the map
#### Step-1
##### Import necessary modules
Open `app.module.ts` and change it content to:

```diff
import { NgModule } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageryModule, MAP_PROVIDERS_CONFIG, MAP_SOURCE_PROVIDERS_CONFIG} from '@ansyn/imagery';
-import { OL_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap } from '@ansyn/ol';
+import { OL_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap, OL_PLUGINS_CONFIG, AnnotationsVisualizer } from '@ansyn/ol';
import {AppComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    ImageryModule.provide({
      maps: [OpenLayersMap],
-      plugins: [],
+      plugins: [AnnotationsVisualizer],
      mapSourceProviders: [OpenLayerBingSourceProvider]
    })
  ],
  providers: [
+    {
+      provide: OL_PLUGINS_CONFIG,
+      useValue: {
+        Annotations: {}
+      }
+    },
    {
      provide: OL_CONFIG,
      useValue: {}
    },
    {
      provide: MAP_PROVIDERS_CONFIG,
      useValue: {
        openLayersMap: {
          defaultMapSource: 'BING'
        }
      }
    },
    {
      provide: MAP_SOURCE_PROVIDERS_CONFIG,
      useValue: {
        'BING': {
          key: '<YOUR-KEYS>',
          styles: ['AerialWithLabels']
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```
>this will be able you to do the following in `app.component.ts'
>```typescript
>import {AfterViewInit, Component} from '@angular/core';
>import {ImageryCommunicatorService, IMapSettings} from '@ansyn/imagery';
>import {AnnotationsVisualizer} from '@ansyn/ol';
>import {filter, take, tap} from 'rxjs/operators';
>import IMAGERY_SETTINGS from './IMAGERY_SETTINGS';
>
>@Component({
>  selector: 'app-root',
>  templateUrl: './app.component.html',
>  styleUrls: ['./app.component.less']
>})
>export class AppComponent implements AfterViewInit {
>  public settings: IMapSettings = IMAGERY_SETTINGS;
>  annotations: AnnotationsVisualizer;
>
>  constructor(protected communicators: ImageryCommunicatorService) {
>  }
>
>  onInitMap() {
>    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
>    this.annotations = communicator.getPlugin(AnnotationsVisualizer);
>    this.annotations.setMode('Polygon');
>  }
>
>  ngAfterViewInit() {
>    this.communicators.instanceCreated.pipe(
>      filter(({id}) => id === IMAGERY_SETTINGS.id),
>      tap(this.onInitMap.bind(this)),
>      take(1)
>    ).subscribe();
>  }
>}
>```
>which give you the ability to draw one annotation of type polygon when the map load
>but we want to draw more than one annotation and be able to chose the type of the annotation.
#### Step-2
##### Create an Annotation control
create a component named annotations-control
```bash
  ng g c annotaions-control
```
install material-community-components for a color picker
```bash
  npm install material-community-components
```
open `app.module.ts` and change it content to: 
```diff
import { NgModule } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageryModule, MAP_PROVIDERS_CONFIG, MAP_SOURCE_PROVIDERS_CONFIG} from '@ansyn/imagery';
import { OL_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap, OL_PLUGINS_CONFIG, AnnotationsVisualizer } from '@ansyn/ol';
import {AppComponent} from './app.component';
import {AnnotationsControlComponent} from './annotations-control/annotations-control.component';
+import {MccColorPickerModule} from 'material-community-components';
+import {MatButtonModule, MatIconModule} from '@angular/material';
+import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    AnnotationsControlComponent
  ],
  imports: [
    BrowserModule,
+    BrowserAnimationsModule,
+    MatButtonModule,
+    MatIconModule,
+    MccColorPickerModule.forRoot({
+      used_colors: ['#000000', '#123456', '#777666']
+    }),
    ImageryModule.provide({
      maps: [OpenLayersMap],
      plugins: [AnnotationsVisualizer],
      mapSourceProviders: [OpenLayerBingSourceProvider]
    })
  ],
  providers: [
    {
      provide: OL_PLUGINS_CONFIG,
      useValue: {
        Annotations: {}
      }
    },
    {
      provide: OL_CONFIG,
      useValue: {}
    },
    {
      provide: MAP_PROVIDERS_CONFIG,
      useValue: {
        openLayersMap: {
          defaultMapSource: 'BING'
        }
      }
    },
    {
      provide: MAP_SOURCE_PROVIDERS_CONFIG,
      useValue: {
        'BING': {
          key: '<YOUR-KEYS>',
          styles: ['AerialWithLabels']
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```

open `annotations-control.components.html` amd change it content to:
```html
<div class="list">
  <button
    *ngFor="let mode of ANNOTATION_MODE_LIST"
    mat-button
    [disabled]="!annotations"
    color="primary"
    [class.mat-accent]="annotations?.mode === mode"
    (click)="draw(mode)">
    {{ mode }}
  </button>

  <button mat-icon-button (click)="clear()">
    <mat-icon aria-label="Example icon-button with a heart icon">delete</mat-icon>
  </button>

  <button mat-button>
    FILL
    <mcc-color-picker [selectedColor]="'#ffffff'"
                      (selected)="changeFill($event)"></mcc-color-picker>
  </button>

  <button mat-button>
    STROKE
    <mcc-color-picker [selectedColor]="'#ffffff'"
                      (selected)="changeStroke($event)"></mcc-color-picker>
  </button>

  <button mat-button>
    <input type="file" (change)="loadJSON($event.target.files)" />
  </button>
</div>
```

Open `annotations-control.components.ts` and change it content to: 
```typescript
import { Component, OnInit } from '@angular/core';
import IMAGERY_SETTINGS from '../IMAGERY_SETTINGS';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { ANNOTATION_MODE_LIST, AnnotationsVisualizer } from '@ansyn/ol';
import { fromEvent } from 'rxjs';
import { mergeMap, filter, take, tap } from 'rxjs/operators';

@Component({
  selector: 'app-annotations-control',
  templateUrl: './annotations-control.component.html',
  styleUrls: ['./annotations-control.component.less']
})
export class AnnotationsControlComponent implements OnInit {
  ANNOTATION_MODE_LIST = ANNOTATION_MODE_LIST;
  annotations: AnnotationsVisualizer;
  reader = new FileReader();

  onFileLoad$ = fromEvent(this.reader, 'load').pipe(
    mergeMap(() => {
      const readerResult: string = <string>this.reader.result;
      const geoJSON = JSON.parse(readerResult);
      const entities = this.annotations.annotationsLayerToEntities(geoJSON);
      return this.annotations.addOrUpdateEntities(entities);
    })
  );

  constructor(protected communicators: ImageryCommunicatorService) {
  }

  onInitMap() {
    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
    this.annotations = communicator.getPlugin(AnnotationsVisualizer);
  }

  ngOnInit() {
    this.communicators.instanceCreated.pipe(
      filter(({ id }) => id === IMAGERY_SETTINGS.id),
      tap(this.onInitMap.bind(this)),
      take(1)
    ).subscribe();

    this.onFileLoad$.subscribe();
  }

  draw(mode) {
    this.annotations.setMode(this.annotations.mode === mode ? null : mode);
  }

  clear() {
    this.annotations.clearEntities();
  }

  changeFill(color) {
    this.annotations.updateStyle({ initial: { fill: color } });
  }

  changeStroke(color) {
    this.annotations.updateStyle({ initial: { stroke: color } });
  }

  loadJSON(files: FileList) {
    const file = files.item(0);
    if (file) {
      this.reader.readAsText(file, 'UTF-8');
    }
  }
}
```

Open `annotations-control.component.less` and change it content to:
```less
:host {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.list button {

  margin: 0 10px;
}
```

### Step-3
##### Add our Annotation Control to our app
Open `app.component.html` and change it content to:
```diff
<div class="app">
  <div class="imagery">
    <div>
      <ansyn-imagery-view [settings]="settings"></ansyn-imagery-view>
    </div>
  </div>

+  <app-annotations-control></app-annotations-control>
</div>
```
you can read how to create your own plugin [here](https://github.com/AnSyn/ansyn/wiki/Create-new-plugins)

## Draw icon at annotation center
The annotation plugin can draw an icon on the center of the annotation
#### Step-1
copy your icon inside the assets directory.
#### Step-2
in the `app.module.ts` add the path for the icon
```diff
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { BrowserModule } from '@angular/platform-browser';
import { ImageryModule, MAP_PROVIDERS_CONFIG, MAP_SOURCE_PROVIDERS_CONFIG } from '@ansyn/imagery';
import { AnnotationsVisualizer, OL_CONFIG, OL_PLUGINS_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap, AnnotationsContextMenuModule } from '@ansyn/ol';
import { NavbarModule } from './navbar/navbar.module';
import { AnnotationsControlComponent } from './annotations-control/annotations-control.component';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MccColorPickerModule } from 'material-community-components';

@NgModule({
  declarations: [
    AppComponent,
    AnnotationsControlComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NavbarModule,
    MatButtonModule,
    MatIconModule,
    MccColorPickerModule.forRoot({
      used_colors: ['#000000', '#123456', '#777666']
    }),
    ImageryModule.provide({
      maps: [OpenLayersMap],
      plugins: [AnnotationsVisualizer],
      mapSourceProviders: [OpenLayerBingSourceProvider]
    }),
    AnnotationsContextMenuModule
  ],
  providers: [
    {
      provide: OL_PLUGINS_CONFIG,
      useValue: {
-        Annotation: {}
+        Annotations: {
+          icon: {
+            src: 'assets/center-icon.svg'
+          }
+        }
      }
    },
    {
      provide: OL_CONFIG,
      useValue: {}
    },
    {
      provide: MAP_PROVIDERS_CONFIG,
      useValue: {
        openLayersMap: {
          defaultMapSource: 'BING'
        }
      }
    },
    {
      provide: MAP_SOURCE_PROVIDERS_CONFIG,
      useValue: {
        'BING': {
          key: '<YOUR-KEY>',
          styles: ['AerialWithLabels']
        }
      }
    }],
  bootstrap: [AppComponent]
})
export class AppModule {
}

```
#### Step-3
in `annotation-control.component.html` add a checkbox for hide/show icon
```diff
<div class="list">

+  <label>
+    show center icon
+      <input type="checkbox"
+         checked="showCenterIcon"
+        (change)="setCenterIcon()">
+  </label>
  <button
    *ngFor="let mode of ANNOTATION_MODE_LIST"
    mat-button
    [disabled]="!annotations"
    color="primary"
    [class.mat-accent]="annotations?.mode === mode"
    (click)="draw(mode)">
    {{ mode }}
  </button>

  <button mat-icon-button (click)="clear()">
    <mat-icon aria-label="Example icon-button with a heart icon">delete</mat-icon>
  </button>

  <button mat-button>
    FILL
    <mcc-color-picker [selectedColor]="'#ffffff'"
                      (selected)="changeFill($event)"></mcc-color-picker>
  </button>

  <button mat-button>
    STROKE
    <mcc-color-picker [selectedColor]="'#ffffff'"
                      (selected)="changeStroke($event)"></mcc-color-picker>
  </button>

  <button mat-button>
    <input type="file" (change)="loadJSON($event.target.files)" />
  </button>


</div>

```
#### Step-4
in `annotation-control.component.ts` add the follow: 
```diff
import {Component, OnInit} from '@angular/core';
import {ImageryCommunicatorService} from '@ansyn/imagery';
import {ANNOTATION_MODE_LIST, AnnotationsVisualizer} from '@ansyn/ol';
import {fromEvent} from 'rxjs';
import {filter, mergeMap, take, tap} from 'rxjs/operators';
import IMAGERY_SETTINGS from '../IMAGERY_SETTINGS';

@Component({
  selector: 'app-annotations-control',
  templateUrl: './annotations-control.component.html',
  styleUrls: ['./annotations-control.component.less']
})
export class AnnotationsControlComponent implements OnInit {
  ANNOTATION_MODE_LIST = ANNOTATION_MODE_LIST;
  annotations: AnnotationsVisualizer;
  reader = new FileReader();

  onFileLoad$ = fromEvent(this.reader, 'load').pipe(
    mergeMap(() => {
      const readerResult: string = <string>this.reader.result;
      const geoJSON = JSON.parse(readerResult);
      const entities = this.annotations.annotationsLayerToEntities(geoJSON);
      return this.annotations.addOrUpdateEntities(entities);
    })
  );
+  showCenterIcon: boolean;

  constructor(protected communicators: ImageryCommunicatorService) {
  }

  onInitMap() {
    const communicator = this.communicators.provide(IMAGERY_SETTINGS.id);
    this.annotations = communicator.getPlugin(AnnotationsVisualizer);
+    this.showCenterIcon = this.annotations.isShowAnnotationCenter();
  }

  ngOnInit() {
    this.communicators.instanceCreated.pipe(
      filter(({id}) => id === IMAGERY_SETTINGS.id),
      tap(this.onInitMap.bind(this)),
      take(1)
    ).subscribe();

    this.onFileLoad$.subscribe();
  }

  draw(mode) {
    this.annotations.setMode(this.annotations.mode === mode ? null : mode);
  }

  clear() {
    this.annotations.clearEntities();
  }

  changeFill(color) {
    this.annotations.updateStyle({initial: {fill: color}});
  }

  changeStroke(color) {
    this.annotations.updateStyle({initial: {stroke: color}});
  }

  loadJSON(files: FileList) {
    const file = files.item(0);
    if (file) {
      this.reader.readAsText(file, 'UTF-8');
    }
  }

+  setCenterIcon() {
+    this.showCenterIcon = !this.showCenterIcon;
+    this.annotations.toggleAnnotaionCenerIndication(this.showCenterIcon);
+  }
}
``` 
## Add Annotations edit menu
you may want to edit an annotation it been draw
#### Step-1
Open `app.module.ts` and change it content to:
```diff
import { NgModule } from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {ImageryModule, MAP_PROVIDERS_CONFIG, MAP_SOURCE_PROVIDERS_CONFIG} from '@ansyn/imagery';
-import { OL_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap, OL_PLUGINS_CONFIG, AnnotationsVisualizer } from '@ansyn/ol';
+import { OL_CONFIG, OpenLayerBingSourceProvider, OpenLayersMap, OL_PLUGINS_CONFIG, AnnotationsVisualizer, AnnotationsContextMenuModule } from '@ansyn/ol';
import {AppComponent} from './app.component';
import {AnnotationsControlComponent} from './annotations-control/annotations-control.component';
import {MccColorPickerModule} from 'material-community-components';
import {MatButtonModule, MatIconModule} from '@angular/material';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    AnnotationsControlComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MccColorPickerModule.forRoot({
      used_colors: ['#000000', '#123456', '#777666']
    }),
    ImageryModule.provide({
      maps: [OpenLayersMap],
      plugins: [AnnotationsVisualizer],
      mapSourceProviders: [OpenLayerBingSourceProvider]
-    })
+    }),
+    AnnotationsContextMenuModule
  ],
  providers: [
    {
      provide: OL_PLUGINS_CONFIG,
      useValue: {
        Annotations: {}
      }
    },
    {
      provide: OL_CONFIG,
      useValue: {}
    },
    {
      provide: MAP_PROVIDERS_CONFIG,
      useValue: {
        openLayersMap: {
          defaultMapSource: 'BING'
        }
      }
    },
    {
      provide: MAP_SOURCE_PROVIDERS_CONFIG,
      useValue: {
        'BING': {
          key: '<YOUR-KEYS>',
          styles: ['AerialWithLabels']
        }
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```
Open `app.component.html` and change it content to: 
```diff
<div class="app">
  <div class="imagery">
    <div>
      <ansyn-imagery-view [settings]="settings"></ansyn-imagery-view>
+     <ansyn-annotations-context-menu [mapState]="settings"></ansyn-annotations-context-menu>
    </div>
  </div>
  <app-annotations-control></app-annotations-control>
</div>
```
now when you click on annotation you will be able<br> to change it color or stroke, and give it a label.

