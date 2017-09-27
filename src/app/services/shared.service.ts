import { Injectable } from '@angular/core';

@Injectable()
export class SharedService {

	vidyoConnector: any;

	setData(data:any) {
    this.vidyoConnector = data;
  }
}