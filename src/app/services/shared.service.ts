import { Injectable } from '@angular/core';
import {User} from './user';

@Injectable()
export class SharedService {
  vidyoConnector: any;
  user: User;
  isConnected: boolean;
  setVidyoConnector(data: any) {
    this.vidyoConnector = data;
  }
  getVidyoConnector() {
    return this.vidyoConnector;
  }
  setConnected(data: boolean) {
    this.isConnected = data;
  }
  getConnected() {
    return this.isConnected;
  }
}
