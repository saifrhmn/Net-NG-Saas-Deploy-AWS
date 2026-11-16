import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class StockService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }

  fetchAllStocks(model: any) {
    return this.http.get(`Stock${this.dataService.getSearchModel(model)}`);
  }

  createStock(obj: any) {
    return this.http.post(`Stock/create`, obj);
  }
}
