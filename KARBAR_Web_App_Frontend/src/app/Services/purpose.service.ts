import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class PurposeService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }

  fetchAllPurpose(searchObj: SearchRequest = null) {
    return this.http.get(`purpose${this.dataService.getSearchModel(searchObj)}`);
  }

  fetchPurposeDetails(purposeId: string) {
    return this.http.get(`purpose/${purposeId}`);
  }

  createPurpose(obj: any) {
    return this.http.post(`purpose`, obj);
  }

  deletePurpose(purposeId: string) {
    return this.http.delete(`purpose?purposeId=${purposeId}`);
  }
}
