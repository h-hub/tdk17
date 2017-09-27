import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {WindowRef} from '../WindowRef';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [WindowRef],
  bootstrap: [AppComponent]
})
export class AppModule { }
