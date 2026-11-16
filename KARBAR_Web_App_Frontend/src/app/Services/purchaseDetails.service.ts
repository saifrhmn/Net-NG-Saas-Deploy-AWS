import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class PurchaseDetailsService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }


  fetchAllPurchaseDetails(searchObj: SearchRequest = null) {
    return this.http.get(`SalesOrder/InvoiceDetailsFromSAPData${this.dataService.getSearchModel(searchObj)}`);
  }

  fetchAllPendingPurchaseDetails(searchObj: SearchRequest = null) {
    return this.http.get(`PurchaseOrderRecieved${this.dataService.getSearchModel(searchObj)}`);
  }

  createPendingPurchase(obj: any) {
    return this.http.post(`PurchaseOrderRecieved`, obj);
  }

}
