import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LocalstoreService } from '../Service/localstore.service';


export interface AuthenticatedUser {
  nameid: string,
  name: string,
  phoneNumber: string,
  role: string,
  sapCustomerCode: string,
  nbf: string,
  exp: string,
  iat: string,
  iss: string,
  aud: string,
  permissions: any[]
}


@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {
  private loggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private router: Router,
    private localStoreService: LocalstoreService,
  ) {

  }
  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }
  setLoggedIn() {
    this.loggedIn.next(true);
  }

  logout() {
    this.loggedIn.next(false);
    this.localStoreService.removeAll();
    this.router.navigate(['login']);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem("Token");
  }
}
