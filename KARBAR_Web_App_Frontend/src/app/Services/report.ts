import { Injectable } from '@angular/core';
import { HttpHelper } from '../Common/Helper/httpHelper';
import { DataService } from '../Common/Service/data.service';
import { SearchRequest } from '../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(
    private http: HttpHelper,
    private dataService: DataService
  ) { }


  fetchAllProductStockReport(searchObj: SearchRequest = null) {
    return this.http.get(`Report/ItemStock${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchAllSalesReport(searchObj: SearchRequest = null) {
    return this.http.get(`Report/Sales${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchAllPurchaseReport(searchObj: SearchRequest = null) {
    return this.http.get(`Report/Purchase${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchAllRequestOrderReport(searchObj: SearchRequest = null) {
    return this.http.get(`Report/RequestOrder${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchAllDealer(searchObj: SearchRequest = null) {
    return this.http.get(`Tenant${this.dataService.getSearchModel(searchObj)}`);
  }

    fetchAllInventoryStock(searchObj: SearchRequest = null) {
    return this.http.get(`Report/InventoryMovementReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchAllPaymentcollection(searchObj: SearchRequest = null) {
    return this.http.get(`Report/PaymentCollectionReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchAllSupplierStatement(searchObj: SearchRequest = null) {
    return this.http.get(`Report/SupplierStatementReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchAllSupplierPayble(searchObj: SearchRequest = null) {
    return this.http.get(`Report/SupplierPaybleReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchAllSalesReturn(searchObj: SearchRequest = null) {
    return this.http.get(`Report/SalesReturnReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchAllTopItemsSold(searchObj: SearchRequest = null) {
    return this.http.get(`Report/TopSoldItemsReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchAllCustomerReceivable(searchObj: SearchRequest = null) {
    return this.http.get(`Report/CustomerReceivablReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchProfitLoss(searchObj: SearchRequest = null) {
    return this.http.get(`Report/ProfitAndLossReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchStockTransfer(searchObj: SearchRequest = null) {
    return this.http.get(`Report/StockTransferReport${this.dataService.getSearchModel(searchObj)}`);
  }
    fetchCustomerstatement(searchObj: SearchRequest = null) {
    return this.http.get(`Report/CustomerStatementReport${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchSlowmovingReport(searchObj: SearchRequest = null) {
    return this.http.get(`Report/SlowMovingNonMovingDeadStockReport${this.dataService.getSearchModel(searchObj)}`);
  }
  fetchUserLoginReport(searchObj: SearchRequest = null) {
    return this.http.get(`Report/UserLoginAndInvoiceActivityReport${this.dataService.getSearchModel(searchObj)}`);
  }

}
