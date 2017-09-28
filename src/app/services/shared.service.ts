import { Injectable } from '@angular/core';
import {User} from './user';

@Injectable()
export class SharedService {
  vidyoConnector: any;
  user: User;
  isConnecte: boolean
  setData(data: any) {
    this.vidyoConnector = data;
  }
}
