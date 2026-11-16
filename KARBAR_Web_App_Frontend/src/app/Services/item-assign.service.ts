import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root',
})
export class ItemAssignService {
  constructor(
    private http: HttpHelper,
    private dataService: DataService,
  ) {}

  fetchAssignedItems(model: any) {
    return this.http.get(`Item/assign-materials${this.dataService.getSearchModel(model)}`);
  }

  // A dealer's own item list (same API as the Item page), filtered by TenantId
  fetchDealerItems(model: any) {
    return this.http.get(`Item${this.dataService.getSearchModel(model)}`);
  }

  // [{ materialGroup: 'BB01', materialGroupDescription: 'Back Coat', totalCount: 226 }, ...]
  fetchMaterialGroups(model: any) {
    return this.http.get(`Item/material-groups${this.dataService.getSearchModel(model)}`);
  }

  // Item list filtered by several material group codes and warehouses
  fetchItems(model: any, materialGroups: string[], warehouseIds: number[]) {
    let query = this.dataService.getSearchModel(model);
    materialGroups.forEach(code => (query += `${query ? '&' : '?'}MaterialGroups=${encodeURIComponent(code)}`));
    warehouseIds.forEach(id => (query += `${query ? '&' : '?'}WarehouseIds=${id}`));
    return this.http.get(`Item/materials${query}`);
  }

  // Assign items and set Active/Inactive (same API):
  // { tenantIds: number[], items: [{ itemId, itemName, brandName, categoryName, status }] }
  assignItems(obj: any) {
    return this.http.post(`Item/assign-materials`, obj);
  }

  bulkUpload(fileData: FormData) {
    return this.http.post(`Item/assign-materials/bulk-upload`, fileData);
  }
}
