import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { SearchRequest } from '../Model/DTO/searchRequest';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  createSupplier(obj: any) {
    return this.http.post(`Supplier`, obj);
  }
  
  fetchAllSuppliers(model:any) {
      return this.http.get(`Supplier${this.dataService.getSearchModel(model)}`);
    }
    
  deleteSupplier(id: number) {
      return this.http.delete(`Supplier/${id}`);
    }

}
