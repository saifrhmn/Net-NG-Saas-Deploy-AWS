// import { Injectable } from '@angular/core';
// import {
//   HttpRequest,
//   HttpHandler,
//   HttpEvent,
//   HttpInterceptor,
//   HttpResponse,
//   HttpErrorResponse,
//   HttpHeaders
// } from '@angular/common/http';
// import { catchError, finalize, map, Observable, throwError } from 'rxjs';
// import { Router } from '@angular/router';
// import { LocalstoreService } from '../Service/localstore.service';
// import { MessageHelperService } from '../Helper/message-helper.service';
// // import { BsModalService } from 'ngx-bootstrap/modal';
// import { DataService } from '../Service/data.service';
// import { environment } from '../../../environments/environment.prod';

// @Injectable({ providedIn: 'root' })
// export class HttpClientInterceptor implements HttpInterceptor {

//   httpHeader: HttpHeaders | undefined;
//   constructor(
//     private router: Router,
//     private notifier: MessageHelperService,
//     private localStoreService: LocalstoreService,
//     private dataService: DataService,
//     // private modalService: BsModalService,
//   ) { }

//   showHttpErrorOnTrayMessage(message: string) {
//     this.notifier.showMessage(404, '');
//   }

//   intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//
//     let authToken = this.localStoreService.getToken();
//     if (authToken != null && authToken != "") {
//       authToken = `Bearer ${authToken}`;
//     }

//     let url = request.url;
//     if (!(url.startsWith("https://") || url.startsWith("http://") || url.endsWith(".json"))) {
//       url = environment.BASE_URL + request.url;
//       this.httpHeader = request.headers.set('Authorization', `${authToken}`);
//     } else {
//       this.httpHeader = request.headers.delete("Authorization");
//     }

//     const reqClone = request.clone({ url, headers: this.httpHeader });

//     return next.handle(reqClone).pipe(map((event) => {
//       if (event instanceof HttpResponse) {
//         const responseData = event.body;
//         if (!responseData || !responseData.isSuccess) {
//           // const message = responseData.message;
//           // if (request.url.indexOf("csv") < 0) {
//           //   this.showHttpErrorOnTrayMessage(message);
//           // }
//         }
//       }
//       return event;
//     }),
//       catchError((err: HttpErrorResponse) => {
//
//         if (err.status === 401 && err.url?.includes(environment.BASE_URL)) {
//           this.showHttpErrorOnTrayMessage(err.error.message);
//           this.localStoreService.removeToken();
//           // var modalCount = this.modalService.getModalsCount();
//           // if (modalCount > 0) {
//           // 	for (let i = 1; i <= modalCount; i++) {
//           // 		this.modalService.hide(i);
//           // 	}
//           // }
//           this.router.navigate(["/auth/login"]);
//           window.location.reload();
//         } else {
//           this.showHttpErrorOnTrayMessage(err.error);
//         }

//         return throwError(() => err);
//       }),
//       finalize(() => {
//         this.dataService.destroyForm.next(null);
//       }));
//   }
// }
// http-client.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { Observable, catchError, finalize, map, throwError } from 'rxjs';
import { AuthenticationService } from '../../Services/auth.service';
import { Router } from '@angular/router';
import { LocalstoreService } from '../Service/localstore.service';
import { MessageHelperService } from '../Helper/message-helper.service';
import { DataService } from '../Service/data.service';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../Model/VM/apiResponse';

export const HttpClientInterceptor: HttpInterceptorFn = (
  request: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const injector = inject(Injector);
  const notifier = inject(MessageHelperService);
  const localStoreService = inject(LocalstoreService);
  const dataService = inject(DataService);

  const showHttpErrorOnTrayMessage = (statusCode: number, message: string) => {
    notifier.showMessage(statusCode, message);
  };

  let authToken = localStoreService.getToken();
  if (authToken) {
    authToken = `Bearer ${authToken}`;
  }

  let url = request.url;
  let headers = request.headers;

  // Check if this is an API request to our server
  const isApiRequest = url.includes(environment.BASE_URL) || 
                       !(url.startsWith('https://') || url.startsWith('http://') || url.endsWith('.json'));

  if (isApiRequest) {
    // Add BASE_URL only if it's a relative path (httpHelper already adds it, but for safety)
    if (!(url.startsWith('https://') || url.startsWith('http://'))) {
      url = environment.BASE_URL + url;
    }
    // Add auth header for API requests
    if (authToken) {
      headers = headers.set('Authorization', authToken);
    }
  } else {
    // External request - remove auth header
    headers = headers.delete('Authorization');
  }

  const reqClone = request.clone({ url, headers });

  return next(reqClone).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {


        const responseData = event.body as ApiResponse;
        if (!responseData || !responseData.isSuccess) {
          // Uncomment if you want to show error:
          // showHttpErrorOnTrayMessage(responseData.message);
        }
      }
      return event;
    }),
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && err.url?.includes(environment.BASE_URL)) {
        const requestUrl = (reqClone.url || '').toLowerCase();
        const isLoginRequest = requestUrl.includes('/auth/login');

        // Do not force logout/reload on invalid login credentials.
        if (!isLoginRequest) {
          // Resolved lazily: AuthenticationService -> HttpHelper -> HttpClient -> this interceptor.
          injector.get(AuthenticationService).handleSessionExpired();
        }
      } else {
        // showHttpErrorOnTrayMessage(err.status, err.error!.errorMessage);
      }
      return throwError(() => err);
    }),
    finalize(() => {
      dataService.destroyForm.next(null);
    })
  );
};
