import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {WindowRef} from '../WindowRef';

import { AppComponent } from './app.component';
import { VideoRendererComponent } from 'app/videoRenderer/videorenderer.component';
import { SharedService } from './services/shared.service';

@NgModule({
  declarations: [
    AppComponent,
    VideoRendererComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [WindowRef, SharedService],
  bootstrap: [AppComponent]
})
export class AppModule { }
