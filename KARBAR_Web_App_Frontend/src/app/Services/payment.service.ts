import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }


  // updateCustomerDueAmount(obj: any){
  //     return this.http.post(`CustomerPayment`, obj);
  // }
  updateCustomerDueAmount(obj: any){
      return this.http.post(`Payment`, obj);
  }

  createOrder(obj: any) {
    return this.http.post(`RequestOrder`, obj);
  }


  updateStatus(obj: any){
    
     return this.http.post(`RequestOrder/bergerRecievedStatusUpdate`, obj);
  }
  fetchAllOrder(searchObj: SearchRequest = null) {
       return this.http.get(`Payment${this.dataService.getSearchModel(searchObj)}`);
  }

}
