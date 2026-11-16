import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { SearchRequest } from '../Model/DTO/searchRequest';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  createRole(obj: any) {
    return this.http.post(`Role`, obj);
  }

  fetchAllRoles(model:any) {
      return this.http.get(`Role${this.dataService.getSearchModel(model)}`);
    }

  deleteRole(id: any) {
      return this.http.delete(`Role/${id}`);
    }

  createUOM(obj: any) {
    return this.http.post(`Uom`, obj);
  }

  fetchAllUOMs(model:any) {
      return this.http.get(`Uom${this.dataService.getSearchModel(model)}`);
    }

  deleteUOM(id: any) {
      return this.http.delete(`Uom/${id}`);
    }

  createBrand(obj: any) {
    return this.http.post(`Brand`, obj);
  }

  fetchAllBrands(model:any) {
      return this.http.get(`Brand${this.dataService.getSearchModel(model)}`);
    }

  deleteBrand(id: any) {
      return this.http.delete(`Brand/${id}`);
    }

  createWarehouse(obj: any) {
    return this.http.post(`Warehouse`, obj);
  }

  fetchAllWarehouses(model:any) {
      return this.http.get(`Warehouse${this.dataService.getSearchModel(model)}`);
    }

  deleteWarehouse(id: any) {
      return this.http.delete(`Warehouse/${id}`);
    }

  deleteCategory(id: any) {
      return this.http.delete(`Category/${id}`);
    }

  createCategory(obj: any) {
    return this.http.post(`Category`, obj);
  }

  fetchAllCategory(model:any) {
      return this.http.get(`Category${this.dataService.getSearchModel(model)}`);
    }

  deleteBank(id: any) {
      return this.http.delete(`BankInformation/${id}`);
    }

  createBank(obj: any) {
    return this.http.post(`BankInformation`, obj);
  }

  fetchAllBank(model:any) {
      return this.http.get(`BankInformation${this.dataService.getSearchModel(model)}`);
    }


}
