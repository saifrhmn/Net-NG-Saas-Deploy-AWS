import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { SearchRequest } from '../Model/DTO/searchRequest';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  createCustomer(obj: any) {
    return this.http.post(`Customer`, obj);
  }

  fetchAllCustomers(model:any) {
      return this.http.get(`Customer${this.dataService.getSearchModel(model)}`);
    }
    
  deleteCustomer(id: number) {
      return this.http.delete(`Customer/${id}`);
    }

}
