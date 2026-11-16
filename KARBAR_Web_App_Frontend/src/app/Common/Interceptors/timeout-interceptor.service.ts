// import { Inject, Injectable, InjectionToken } from '@angular/core';
// import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { timeout } from 'rxjs/operators';

// export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');

// @Injectable({ providedIn: 'root' })
// export class TimeoutInterceptor implements HttpInterceptor {
//   constructor(@Inject(DEFAULT_TIMEOUT) protected defaultTimeout: number) {
//   }

//   intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     let defaultvalue=req.headers.get('timeout');
//     let defaultTimeoutvalue=0;
//     if(defaultvalue==null){
//        defaultTimeoutvalue= Number(60000);
//     }
//     const timeoutValue = defaultTimeoutvalue || this.defaultTimeout;
//     const timeoutValueNumeric = Number(timeoutValue);
//     return next.handle(req).pipe(timeout(timeoutValueNumeric));
//   }
// }
// timeout.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent
} from '@angular/common/http';
import { inject, InjectionToken } from '@angular/core';
import { Observable, timeout } from 'rxjs';

export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');

export const TimeoutInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const defaultTimeout = inject(DEFAULT_TIMEOUT);

  const timeoutHeader = req.headers.get('timeout');
  const timeoutValue = timeoutHeader ? Number(timeoutHeader) : defaultTimeout || 60000;

  return next(req).pipe(timeout(timeoutValue));
};
