import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { SearchRequest } from '../Model/DTO/searchRequest';
import { DataService } from '../Common/Service/data.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }



  createExpense(obj: any) {
    return this.http.post(`ExpenseInformation`, obj);
  }

  fetchAllExpenses(model:any) {
      return this.http.get(`ExpenseInformation${this.dataService.getSearchModel(model)}`);
    }
    
  deleteExpense(id: number) {
      return this.http.delete(`ExpenseInformation/${id}`);
    }


     createNewExpenseCategory(obj: any) {
    return this.http.post(`ExpenseCategory`, obj);
  } 

    fetchAllExpensesCategory(model:any) {
      return this.http.get(`ExpenseCategory${this.dataService.getSearchModel(model)}`);
    }
}
