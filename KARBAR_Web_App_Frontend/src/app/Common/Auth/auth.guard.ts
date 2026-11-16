import { inject, Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  CanActivateFn
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthGuardService } from './auth.guard.service';
import { LocalstoreService } from '../Service/localstore.service';
import { DataService } from '../Service/data.service';
import { AuthenticationService } from '../../Services/auth.service';

@Injectable({
  providedIn: 'root', // Ensure it's provided at the root level
})
export class AuthGuard implements CanActivate {

  lstPermission: any[] = new Array<any>();

  constructor(
    private authGuardService: AuthGuardService,
    private router: Router,
    private localStoreService: LocalstoreService,
    private dateService: DataService,

  ) { }

  canActivate(
    activeRouter: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {

    return this.authGuardService.isLoggedIn.pipe(map((isLoggedIn: boolean) => {

      if (!this.localStoreService.getData("accessToken")) {
        this.localStoreService.removeToken();
        this.localStoreService.removeAll();

        // Disconnect SignalR ...................
        // this.notificationService.leaveRoom();

        // close all the opened modal
        // var modalCount = this.modalService.getModalsCount();
        // if (modalCount > 0) {
        //     for (let i = 1; i <= modalCount; i++) {
        //         this.modalService.hide(i);
        //     }
        // }
        this.dateService.isUserLoggedIn.next(false);
        this.router.navigate(['login']);

        return false;
      } else {
        this.dateService.isUserLoggedIn.next(true);

        return true;
      }
    }));
  }

}

export const PermissionGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const authService = inject(AuthenticationService);

  if (AuthenticationService.isCurrentUserAuthenticated() && AuthenticationService.authenticatedUser) {
    console.log('AuthGuard authentication');
    console.log('Current role ', AuthenticationService.getRole());
    console.log('Permitted pages: ', AuthenticationService.getPermissions());
    if (authService.isRoleWiseAuthorized(state.url, AuthenticationService.getPermissions(), AuthenticationService.getRole())) {
      return true;
    }
    else {
      router.navigateByUrl('/unauthorized');
      return false;
    }
  }
  router.navigateByUrl('/login');
  return false;
}

export const ActionPermissionCheck = (actionName: string[]): boolean => {
  console.log(AuthenticationService.getPermissions());
  let permission = AuthenticationService.getPermissions()
    .find((permission: any) => {
      if (permission.permissionName.includes(actionName)) {
        return permission;
      }
    })
  return permission ? true : false;
}
