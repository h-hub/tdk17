import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {WindowRef} from '../WindowRef';

import { AppComponent } from './app.component';
import { VideoRendererComponent } from 'app/videoRenderer/videorenderer.component';
import { VideoMenuComponent } from 'app/videoMenu/videomenu.component';

import { SharedService } from './services/shared.service';
import { EventService } from './services/event.service';

@NgModule({
  declarations: [
    AppComponent,
    VideoRendererComponent,
    VideoMenuComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [WindowRef, SharedService, EventService],
  bootstrap: [AppComponent]
})
export class AppModule { }
