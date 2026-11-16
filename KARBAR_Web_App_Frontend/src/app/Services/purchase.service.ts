import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class PurchaseService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  createPurchase(obj: any) {
    return this.http.post(`PurchaseOrder`, obj);
  }
 

  fetchAllPurchase(searchObj: SearchRequest = null) {
       return this.http.get(`PurchaseOrder${this.dataService.getSearchModel(searchObj)}`);
    }
     createPurchaseReturn(obj: any) {
      debugger
    return this.http.post(`PurchaseReturn`, obj);
  }
  fetchAllPurchaseReturn(searchObj: SearchRequest = null) {
       return this.http.get(`PurchaseReturn${this.dataService.getSearchModel(searchObj)}`);
    }

}
