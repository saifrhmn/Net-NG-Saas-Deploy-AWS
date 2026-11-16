import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }

  fetchAllPermissions(searchObj: SearchRequest = null) {
    return this.http.get(`permissions${this.dataService.getSearchModel(searchObj)}`);
  }

  fetchAllParentPermissions() {
    return this.http.get(`permissions/parents`);
  }

  fetchPermissionDetails(permissionId: string) {
    return this.http.get(`permissions/${permissionId}`);
  }

  createPermission(obj: any) {
    return this.http.post(`permissions`, obj);
  }

  deletePermission(permissionId: string) {
    return this.http.delete(`permissions/${permissionId}`);
  }

  saveRolePermissionAccess(obj: any) {
    return this.http.post(`permissions/access`, obj);
  }

  fetchRolePermissionAccess(roleId: string) {
    return this.http.get(`permissions/access/${roleId}`);
  }

  getUserPermissionAccess(userId: string) {
    return this.http.get(`permissions/access-for-user/${userId}`);
  }

  fetchMaterialIcons() {
    return this.http.get(`icons`);
  }
}
