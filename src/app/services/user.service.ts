import { Injectable } from '@angular/core';
import { User } from './user';

@Injectable()
export class UserService {
  constructor(private user: User ) {}

  geUser() {
    return this.user;
  };

  SignedIn() {
    return this.user.isSignedIn;
  };
}
