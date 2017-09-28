/**
 * Created by bjayamanna on 9/28/2017.
 */
export class User {
  constructor(
    public token: string,
    public name: string,
    public roomId: string,
    public isSignedIn: boolean
  ) {  }
}
