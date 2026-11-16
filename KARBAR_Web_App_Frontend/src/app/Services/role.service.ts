import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }

  fetchAllRole() {
    return this.http.get(`roles`);
  }

  fetchRoleDetails(dealerId: number) {
    return this.http.get(`roles/${dealerId}`);
  }
}
