import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { SearchRequest } from '../Model/DTO/searchRequest';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  constructor(
    private http: HttpHelper,
    private dataService: DataService,
  ) {}

  createItem(obj: any) {
    return this.http.post(`Item`, obj);
  }

  fetchAllItems(model: any) {
    return this.http.get(`Item${this.dataService.getSearchModel(model)}`);
  }
  fetchAllItemDetails(id: number) {
    return this.http.get(`Item/${id}`);
  }

  deleteItem(id: number) {
    return this.http.delete(`Item/${id}`);
  }

  // createBulkItem(obj: any) {
  //   return this.http.post(`Item/bulk-insert`, obj);
  // }

  createBulkItem(fileData: FormData) {
  return this.http.post(`Item/bulk-insert`, fileData); 
  // ⚠️ Do NOT set 'Content-Type'. Angular will set it as 'multipart/form-data' automatically
}
  // createBulkItem(obj: any) {
  //   return this.http.post(`Item/bulk-insert`, obj, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });
  }

