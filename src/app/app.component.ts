import { Component, OnInit, AfterViewInit  } from '@angular/core';
import '../assets/js/literallycanvas-0.4.14/js/literallycanvas.min.js'
import { WindowRef } from '../WindowRef';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'app';

  constructor(private winRef: WindowRef) {

    console.log('Native window obj', winRef.nativeWindow);
  }

  ngOnInit() {

  }

  ngAfterViewInit() {

    console.log('LC  obj', this.winRef.nativeWindow.LC);
    console.log(document);
    this.winRef.nativeWindow.LC.init(
      document.getElementsByClassName('my-drawing1')[0],
      {imageURLPrefix: '/assets/js/literallycanvas-0.4.14/img'}
    );
  }

}
