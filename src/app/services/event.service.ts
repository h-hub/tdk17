import { Injectable } from '@angular/core';
import {Observable, Observer} from 'rxjs/Rx';

@Injectable()
export class EventService {
  observable: Observable<any>;
  observer: Observer<any>;

  constructor() {
    console.log('constructor');
    this.observable = Observable.create((observer: Observer<any>) => {
      this.observer = observer;
    }).share();
  }

  broadcast(event) {
    this.observer.next(event);
  }

  on(eventName, callback) {
    this.observable.filter((event) => {
      return event.name === eventName;
    }).subscribe(callback);
  }
}
