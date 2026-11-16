import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class SalesOrderService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  deleteSalesOrder(soId: any) {
    return this.http.delete(`SalesOrder/${soId}`);
  }
  createSalesOrder(obj: any) {
    return this.http.post(`SalesOrder`, obj);
  }

  fetchAllSalesOrder(searchObj: SearchRequest = null) {
    debugger;
       return this.http.get(`SalesOrder${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchAllReturnSalesOrder(searchObj: SearchRequest = null) {
       return this.http.get(`ReturnOrder${this.dataService.getSearchModel(searchObj)}`);
  }
  
  createSalesorderReturn(obj: any) {
    return this.http.post(`ReturnOrder`, obj);
  }

}
