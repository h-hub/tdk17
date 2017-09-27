/**
 * Created by bjayamanna on 9/27/2017.
 */
import {Injectable} from '@angular/core';

function _window(): any {
  // return the native window obj
  return window;
}

@Injectable()
export class WindowRef {

  get nativeWindow(): any {
    return _window();
  }

}
