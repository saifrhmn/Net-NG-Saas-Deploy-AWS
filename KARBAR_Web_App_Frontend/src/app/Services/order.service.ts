import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  createOrder(obj: any) {
    return this.http.post(`RequestOrder`, obj);
  }


  updateStatus(obj: any){
    debugger
     return this.http.post(`RequestOrder/bergerRecievedStatusUpdate`, obj);
  }
  fetchAllOrder(searchObj: SearchRequest = null) {
       return this.http.get(`RequestOrder${this.dataService.getSearchModel(searchObj)}`);
    }

}
