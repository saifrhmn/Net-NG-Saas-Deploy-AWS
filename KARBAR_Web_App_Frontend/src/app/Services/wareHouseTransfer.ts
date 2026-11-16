import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class wareHouseTransefer {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }

  wareHouseTransfer(obj: any) {
    return this.http.post(`Stock/warehousetransfer`, obj);
  }
}
