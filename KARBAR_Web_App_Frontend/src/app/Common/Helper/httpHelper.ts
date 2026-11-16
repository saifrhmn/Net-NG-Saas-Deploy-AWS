import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, map, timeout } from 'rxjs/operators';
import { finalize } from 'rxjs/operators'
import { Observable, throwError } from 'rxjs';
import { MessageHelperService } from './message-helper.service';
import { environment } from '../../../environments/environment';
import { LocalstoreService } from '../Service/localstore.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: "root" })
export class HttpHelper {

  static numberOfRequest = 0;
  private timeOutTime = 10000000;
  private baseUrl = environment.BASE_URL;

  constructor(
    private httpClient: HttpClient,
    private messageHelper: MessageHelperService,
    private localStoreService: LocalstoreService,
    private router: Router
  ) { }

  

  post(url: string, obj: any = {}, headers: any = {}, currentPage: number = 0, pageSize: number = 100): Observable<any> {
    HttpHelper.numberOfRequest++;
    // let payload = {
    // 	RequestObj: this.transformFilterModel(obj),
    // 	PageRecordSize: pageSize,
    // 	PageNumber: currentPage,
    // 	UserId: 0
    // }

    // Check if obj is FormData - if so, don't set Content-Type (let browser handle it)
    const isFormData = obj instanceof FormData;
    let httpHeaders: HttpHeaders;
    
    if (isFormData) {
      // For FormData, don't set Content-Type header - browser will add multipart/form-data automatically
      httpHeaders = new HttpHeaders(headers);
    } else {
      // For JSON data, set Content-Type
      httpHeaders = new HttpHeaders({
        'Content-Type': 'application/json',
        ...headers
      });
    }

    // Don't transform FormData, send as-is
    const payload = isFormData ? obj : this.transformFilterModel(obj);

    return this.httpClient.post(this.baseUrl + url, payload, { headers: httpHeaders })
      .pipe(timeout(this.timeOutTime))
      .pipe(map((value: any) => value,
        (error: HttpErrorResponse) => {
          this.handleError(error);
        })).pipe(catchError(this.handleError.bind(this)))
      .pipe(finalize(() => {
        HttpHelper.numberOfRequest--;
      }));
  }

  put(url: string, obj: any = {}, headers: any = {}): Observable<any> {
    HttpHelper.numberOfRequest++;
    // let payload = {
    // 	RequestObj: this.transformFilterModel(obj),
    // 	PageRecordSize: pageSize,
    // 	PageNumber: currentPage,
    // 	UserId: 0
    // }

    return this.httpClient.put(this.baseUrl + url, this.transformFilterModel(obj), { headers })
      .pipe(timeout(this.timeOutTime))
      .pipe(map((value: any) => value,
        (error: HttpErrorResponse) => {
          this.handleError(error);
        })).pipe(catchError(this.handleError.bind(this)))
      .pipe(finalize(() => {
        HttpHelper.numberOfRequest--;
      }));
  }

  get(url: string, headers: any = {}, currentPage: number = 1, pageSize: number = 100): Observable<any> {
    HttpHelper.numberOfRequest++;

    return this.httpClient.get(this.baseUrl + url, { headers })
      .pipe(timeout(this.timeOutTime))
      .pipe(map((value: any) => {
        return value;
      }, (error: HttpErrorResponse) => {
        this.handleError(error);
      })).pipe(catchError(this.handleError.bind(this)))
      .pipe(finalize(() => {
        HttpHelper.numberOfRequest--;
      }));
  }

  delete(url: string, headers: any = {}): Observable<any> {
    HttpHelper.numberOfRequest++;

    return this.httpClient.delete(this.baseUrl + url, { headers })
      .pipe(timeout(this.timeOutTime))
      .pipe(map((value: any) => {
        return value;
      }, (error: HttpErrorResponse) => {
        this.handleError(error);
      }))
      .pipe(catchError(this.handleError.bind(this)))
      .pipe(finalize(() => {
        HttpHelper.numberOfRequest--;
      }));
  }


  private handleError(error: HttpErrorResponse) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';

    if (errMsg && error.status) {
      // this.messageHelper.showMessage(error.status, errMsg);
    }



    // ................................................................
    // 401 (session expired) is handled centrally in HttpClientInterceptor.
    if (HttpHelper.numberOfRequest == 1) {
      if (error.status == 401) {
        // handled by HttpClientInterceptor
      } else if (error.message == 'Timeout has occurred') {
        // this.messageHelper.showMessage(1000, "response time out");
      } else {
        // this.messageHelper.showMessage(1000, "error connection");
      }
    }
    return throwError(() => {
      // new Error(error.error);
    });
  }

  /**
   *
   * @param body
   * @returns
   */
  private transformFilterModel(body: any): any {
    if (body.filterModel) {
      let filterModels: any[] = [];
      Object.keys(body.filterModel).forEach((key) => {
        const filter = body.filterModel[key];
        let objFilter = { colId: key, filterType: filter.filterType, operator: filter.operator };
        if (filter.filterType === "multi") {
          const models: any[] = [];
          filter.filterModels.map((nextFilter: any) => {
            if (nextFilter) {
              models.push(nextFilter);
            }
          });
          filterModels.push({ ...objFilter, filters: models });
        } else if (filter.filterType === "set") {
          filterModels.push({ ...objFilter, filters: [{ ...filter }] });
        } else {
          const models: any[] = [];
          if (filter.condition1) {
            models.push(filter.condition1);
          }
          if (filter.condition2) {
            models.push(filter.condition2);
          } else {
            models.push(filter);
          }
          filterModels.push({ ...objFilter, filters: models });
        }
      });
      body.filterModel = filterModels;
    }
    return body;
  }
}
