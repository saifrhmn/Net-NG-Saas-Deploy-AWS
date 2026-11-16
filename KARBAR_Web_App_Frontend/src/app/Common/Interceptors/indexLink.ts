import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TimeoutInterceptor, DEFAULT_TIMEOUT } from './timeout-interceptor.service';
import { HttpClientInterceptor } from './http-client.interceptor';

export const interceptorsLink = [
  { provide: HTTP_INTERCEPTORS, useClass: HttpClientInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: TimeoutInterceptor, multi: true },
  { provide: DEFAULT_TIMEOUT, useValue: 32000 }
];
