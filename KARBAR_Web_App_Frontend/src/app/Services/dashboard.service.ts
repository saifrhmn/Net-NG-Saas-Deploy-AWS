import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }

  fetchAllDashboardData(searchObj: SearchRequest = null) {
    return this.http.get(`Dashboard${this.dataService.getSearchModel(searchObj)}`);
  }


}
