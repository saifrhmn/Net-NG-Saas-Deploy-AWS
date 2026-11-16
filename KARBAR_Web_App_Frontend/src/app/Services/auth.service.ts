import { HttpHeaders } from '@angular/common/http';
import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Router, UrlSegment } from '@angular/router';
import { SignalsSimpleStoreService } from '../Common/Utils/state';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { AppLog } from '../Common/Utils/utils';
import { LocalstoreService } from '../Common/Service/localstore.service';
import { ApiResponse } from '../Model/VM/apiResponse';

export interface AuthenticatedUser {
  nameid: string,
  name: string,
  unique_name: string,
  phoneNumber: string,
  phone: string,
  designation: string,
  email: string,
  address: string,
  role: string,
  tenantId: number,
  roleId: number,
  isAdmin: string,
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
export class AuthenticationService extends SignalsSimpleStoreService<AuthenticatedUser> {

  public static initializationEvent = 'initialization:success';
  public static authenticationSuccessEvent = 'authentication:success';
  public static logoutSuccessEvent = 'logout:success';
  private eventBus = signal<string>(AuthenticationService.initializationEvent);

  public static authenticationToken: string;
  public static authenticatedUser: AuthenticatedUser;
  public static issuer: string;

  private http: HttpHelper = inject(HttpHelper);
  private localStorage = window.localStorage;
  // private localStorage: LocalstoreService = inject(LocalstoreService);
  private router = inject(Router);
  private expiryTimer: any;

  constructor() {
    super();
    const token = window.localStorage.getItem('accessToken');
    if (token) {
      try {
        if (AuthenticationService.isTokenExpired(token)) {
          // Stale token from a previous session - start fresh.
          this.clearSession();
          return;
        }
        AuthenticationService.authenticationToken = token;
        AuthenticationService.authenticatedUser = JSON.parse(this.decodeUserFromToken(token));
        AuthenticationService.authenticatedUser.permissions = AuthenticationService.savedPermissions();
        this.scheduleExpiryLogout(token);
      } catch (e) {
        console.error("Failed to decode user from token", e);
        this.clearSession();
      }
    }
  }

  private decodeUserFromToken(token: string): string {
    return atob(token.split('.')[1]);  // JWT payload
  }

  /** True when the JWT's `exp` claim is in the past (or the token can't be read). */
  public static isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return !!payload.exp && payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  /** Log out automatically the moment the access token expires. */
  private scheduleExpiryLogout(token: string): void {
    clearTimeout(this.expiryTimer);
    try {
      const exp = JSON.parse(atob(token.split('.')[1])).exp;
      if (!exp) return;
      const ms = exp * 1000 - Date.now();
      // setTimeout overflows above ~24.8 days; such a token is re-checked on next page load.
      if (ms > 2147483647) return;
      this.expiryTimer = setTimeout(() => this.handleSessionExpired(), Math.max(ms, 0));
    } catch { }
  }

  /** Session is over (token expired / server returned 401): drop the token and go to login. */
  public handleSessionExpired(): void {
    if (!AuthenticationService.getAccessToken()) {
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }
    this.removeAuths();
  }


  public login(requestBody: any): Observable<any> {
    // debugger
    return this.http.post('Auth/login', requestBody);
  }

  public authenticateUser(accessToken: string): void {
    if (accessToken !== this.localStorage.getItem('accessToken')) {
      // New login - discard anything left over from the previous session.
      this.clearSession();
    }
    AuthenticationService.authenticationToken = accessToken;
    AuthenticationService.authenticatedUser = JSON.parse(this.decodeUser());
    this.localStorage.setItem('accessToken', accessToken);
    this.scheduleExpiryLogout(accessToken);
    this.readEvents().set(AuthenticationService.authenticationSuccessEvent);
  }

  public saveUserPermissions(permissions: any[]): void {
    AuthenticationService.authenticatedUser.permissions = permissions;
    this.readEvents().set(AuthenticationService.authenticationSuccessEvent);
    this.localStorage.setItem("permissions", JSON.stringify(permissions));
  }

  public static savedPermissions(): any[] {
    return JSON.parse(window.localStorage.getItem('permissions') || "[]");
  }

  public readEvents(): WritableSignal<string> {
    return this.eventBus;
  }

  static isCurrentUserAuthenticated(): boolean | string {
    return AuthenticationService.authenticationToken && AuthenticationService.authenticationToken?.length > 0;
  }

  public decodeUser() {
    return atob(AuthenticationService.getAccessToken().split('.')[1]);
  }

  public static getAccessToken(): any {
    return AuthenticationService.authenticationToken || window.localStorage.getItem('accessToken');
  }

  public static getIssuer(): any {
    return AuthenticationService.authenticatedUser.nameid;
  }

  public static getRole(): any {
    return AuthenticationService.authenticatedUser.role;
  }

  public static getIsAdmin(): boolean {
    return AuthenticationService.authenticatedUser.isAdmin == 'True' ? true : false;
  }

  // The token's isAdmin claim arrives as 'true' or 'True' depending on the login source.
  public static isAdminUser(): boolean {
    return String(AuthenticationService.authenticatedUser?.isAdmin).toLowerCase() === 'true';
  }

  public static getPermissions(): any {
    return AuthenticationService.authenticatedUser.permissions || AuthenticationService.savedPermissions();
  }

  // public logout() {
  //   debugger
  //   if (this.localStorage.getItem('accessToken')) {
  //     this.http.post('Auth/logout').subscribe((res: ApiResponse) => {
  //       if (res.isSuccess) {
  //         this.removeAuths();
  //       }

  //     });
  //   } else {
  //     this.removeAuths();
  //   }

  // }

  // removeAuths() {
  //   AuthenticationService.authenticationToken = '';
  //   this.localStorage.removeItem('accessToken');
  //   this.localStorage.removeItem('keepSigned');
  //   this.localStorage.removeItem('permissions')
  //   this.localStorage.clear();
  //   this.router.navigateByUrl('/login', { replaceUrl: true });
  //   this.readEvents().set(AuthenticationService.logoutSuccessEvent);
  //   AppLog(AuthenticationService.logoutSuccessEvent);
  // }
// ...existing code...

public async logout() {
  // Clear cache, service workers, and IndexedDB first
  await this.clearAllBrowserData();

  const token = this.localStorage.getItem('accessToken');
  if (token && !AuthenticationService.isTokenExpired(token)) {
    this.http.post('Auth/logout').subscribe({
      next: (res: ApiResponse) => {
        this.removeAuths();
      },
      error: (err) => {
        // Even if API fails, clear local data
        console.error('Logout API failed:', err);
        this.removeAuths();
      }
    });
  } else {
    this.removeAuths();
  }
}

private async clearAllBrowserData(): Promise<void> {
  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Clear browser cache using Cache API
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    } catch (e) {
      console.error('Failed to clear caches:', e);
    }
  }

  // Unregister service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    } catch (e) {
      console.error('Failed to unregister service workers:', e);
    }
  }

  // Clear IndexedDB
  if ('indexedDB' in window) {
    try {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    } catch (e) {
      console.error('Failed to clear IndexedDB:', e);
    }
  }
}

/** Remove the token and all session data without navigating. */
private clearSession() {
  clearTimeout(this.expiryTimer);

  // Clear static properties
  AuthenticationService.authenticationToken = '';

  // Clear all localStorage
  this.localStorage.removeItem('accessToken');
  this.localStorage.removeItem('keepSigned');
  this.localStorage.removeItem('permissions');
  this.localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();
}

removeAuths() {
  this.clearSession();

  // Emit logout event
  this.readEvents().set(AuthenticationService.logoutSuccessEvent);
  AppLog(AuthenticationService.logoutSuccessEvent);
  
  // Force full page reload to clear in-memory state
  // window.location.href = '/login';
  this.router.navigateByUrl('/login', { replaceUrl: true })
}

// ...existing code...
  /**
   * Verify whether a role or an array of roles is authorized or not.
   * @param {string|Array} aauthorizedRoles Roles for authorizing.
   * @returns {boolean} True means authorized, otherwise is false.
   */
  public isRoleWiseAuthorized(route: string, authorizedPages: string | Array<any>, role?: string): boolean {

    console.log('Current route', route);
    if (!role) {
      return false;
    }
    if (!Array.isArray(authorizedPages)) {
      if (authorizedPages == undefined) {
        authorizedPages = AuthenticationService.getPermissions();
      }
      else {
        authorizedPages = [authorizedPages];
      }
    }
    for (let i = 0; i < authorizedPages.length; i++) {

      //if (authorizedPages[i]?.route != "" && (authorizedPages[i]?.route.includes(route) || route.includes(authorizedPages[i]?.route)))

      if (authorizedPages[i]?.route != "" && (authorizedPages[i]?.route == route || route.match(authorizedPages[i]?.route + "/*"))) {
        console.log('Item Route', authorizedPages[i].route);
        console.log('Found current route in authorized routes', role, route);
        return true;
      }
    }
    console.log('Not found current role');
    return false;
  }


}
