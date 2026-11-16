import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { SearchRequest } from '../Model/DTO/searchRequest';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }


  createUser(obj: any) {
    return this.http.post(`User`, obj);
  }

  fetchAllUser(searchObj: SearchRequest = null) {
    return this.http.get(`User${this.dataService.getSearchModel(searchObj)}`);
  }

  fetchUserDetails(userId: string) {
    return this.http.get(`User/${userId}`);
  }

  editUser(obj: any) {
    return this.http.put(`User`, obj);
  }

  deleteUser(userId: number) {
    return this.http.delete(`User/${userId}`);
  }

  resetPassword(obj: any) {
    return this.http.put(`User/reset-password`, obj);
  }

  forgetPassword(obj: any) {
    return this.http.put(`User/forget-password`, obj);
  }

}
