import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Report } from '../../../Model/report';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MessageHelperService } from '../../../Common/Helper/message-helper.service';
import { ReportService } from '../../../Services/report';
import { BottomSheetComponent } from '../../bottom-sheet/bottom-sheet.component';
import { SearchRequest } from '../../../Model/DTO/searchRequest';
import { SettingsService } from '../../../Services/settings.service';
import { ApiResponse } from '../../../Model/VM/apiResponse';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../../Services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { exportToExcel } from '../../../Common/Utils/utils';
import { Supplier } from '../../../Model/supplier';
import { MatAutocompleteSelectedEvent, MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { TypeableSelectionDropdownComponent } from '../../../Common/Component/typeable-selection-dropdown/typeable-selection-dropdown.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-purchase-report',
  standalone: true,
  imports: [MatProgressSpinnerModule,
    
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatAutocompleteModule,
    TypeableSelectionDropdownComponent,
  ],
  templateUrl: './purchase-report.component.html',
  styleUrl: './purchase-report.component.scss'
})

export class PurchaseReportComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstReport: any[] = [];
  isLoading: boolean = false;
  lstDealers: any[] = [];
  searchText: string = '';
  fromDate: string | null = null;
  toDate: string | null = null;
  isAdmin: boolean = false;
  isDownloading: boolean = false;
  totalItems: number = 0;
  timer: any;
  searchReq: SearchRequest = new SearchRequest();
  authenticatedUser: AuthenticatedUser | null = null;
  selectedBrand: string = 'all';
  selectedCategory: string = 'all';
  selectedWarehouse: string = 'all';
  selectedDealer: string = 'all';
  selectedOption: string = '1';
  materialSearch: string = '';
  lstBrands: any[] = [];
  lstCategories: any[] = [];
  lstWarehouses: any[] = [];
  value: number = 1; // 1 for Request Order, 2 for Purchase Report
  readonly excel = exportToExcel;
    filteredBrands: any[] = [];
  selectedBrandName: string = '';
  selectedCategoryName: string = '';
filteredCategories: any[] = [];

  constructor(
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private report: ReportService,
    private settingsService: SettingsService
  ) { }
  ngOnInit() {
    // initialize paging defaults and load first page
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchReq.pageIndex = this.searchReq.pageIndex || 1;
    this.searchReq.pageSize = 10;
    this.searchReq.roleId = 3;
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;

    if(this.authenticatedUser?.isAdmin === 'true'){
      this.searchReq.tenantId = null;
    }

    this.getAllRequestOrderReport(this.searchReq);
    this.getAllBrand({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.getAllWarehouse({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.getAllCategory({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    // this.getAllCategory(this.searchReq);
    this.getAllDealer({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId, roleId: this.searchReq.roleId});
    // this.get(this.searchReq);
  }

  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    if(this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }

  // lstReport only holds the current page (server-side paging), so the summary totals
  // are computed from the full filtered dataset and only refreshed when filters change.
  totalInvoiceAmount: number = 0;
  totalQty: number = 0;

  loadTotals(totalCount: number) {
    if (!totalCount) {
      this.totalInvoiceAmount = 0;
      this.totalQty = 0;
      return;
    }
    const req = { ...this.searchReq, pageIndex: 1, pageSize: totalCount };
    const source$ = this.value == 1
      ? this.report.fetchAllRequestOrderReport(req)
      : this.report.fetchAllPurchaseReport(req);
    source$.subscribe({
      next: (res: any) => {
        const data = res?.result || [];
        this.totalInvoiceAmount = data.reduce((sum: number, r: any) => sum + (Number(r.totalInvoiceAmount) || 0), 0);
        this.totalQty = data.reduce((sum: number, r: any) => sum + (Number(r.quantity) || 0), 0);
      },
    });
  }

  onBrandChange(brandId: any, brandName?: string) {
  this.searchReq.brandId = brandId;
  this.selectedBrandName = brandName;
      if( this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
}
  
  onCategoryChange(categoryId: any, categoryName?: string) {
    this.searchReq.categoryId = categoryId;
  if (categoryName) {
    this.selectedCategoryName = categoryName;
  }
    if(this.value  == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }
  onBrandSearch(searchValue: any) {
    const query = (searchValue || '').toLowerCase().trim();
    
    if (query === '') {
      this.filteredBrands = this.lstBrands;
    } else {
      this.filteredBrands = this.lstBrands.filter(brand =>
        brand.name.toLowerCase().includes(query)
      );
    }
  }
  
  onBrandOptionSelected(event: any) {
    const selectedBrand = event.fullObject;
    const brandId = selectedBrand?.id;
    const brandName = selectedBrand?.name;
    
    this.selectedBrandName = brandName;
    this.onBrandChange(brandId, brandName);
  }
  


  onWarehouseChange(id: any) {
    this.searchReq.warehouseId = id;
    if(this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }
  onOptionChange(id: any) {
    debugger
    if(id == '1'){
      this.value = 1;
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.value = 2;
      this.getAllPurchaseReport(this.searchReq);
    }

    // this.getAllRequestOrderReport(this.searchReq);
  }

  onCategorySearch(searchValue: any) {
  const query = (searchValue || '').toLowerCase().trim();
  
  if (query === '') {
    this.filteredCategories = this.lstCategories;
  } else {
    this.filteredCategories = this.lstCategories.filter(category =>
      category.name.toLowerCase().includes(query)
    );
  }
}

onCategoryOptionSelected(event: any) {
  const selectedCategory = event.fullObject;
  const categoryId = selectedCategory?.id;
  const categoryName = selectedCategory?.name;
  
  this.selectedCategoryName = categoryName;
  this.onCategoryChange(categoryId, categoryName);
}

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    if( this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }
  onInvoiceSearchChange(value: any) {
    const q = (value || '').toLowerCase().trim();
    this.searchReq.invoiceNo = q;
   if(this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }
    
  onMaterialSearchChange(value: any) {
    const q = (value || '').toLowerCase().trim();
    this.searchReq.SearchMaterial = q;
   if(this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }

  private slNoCarry: number = 0;

  // Each invoice group can span a different number of raw rows, so pageIndex * pageSize
  // does not line up with group boundaries. Instead, carry the group count forward from
  // the previous page (reset on page 1 / a fresh filter).
  assignSlNo(data: any[]): any[] {
    const startIndex = Number(this.searchReq.pageIndex || 1) === 1 ? 0 : this.slNoCarry;
    let groupCount = 0;
    let i = 0;
    while (i < data.length) {
      let j = i;
      while (j < data.length && data[j].purchaseInvoiceNo === data[i].purchaseInvoiceNo) {
        j++;
      }
      groupCount++;
      data[i].slNo = startIndex + groupCount;
      i = j;
    }
    this.slNoCarry = startIndex + groupCount;
    return data;
  }

  getAllPurchaseReport(obj: any, recalcTotals: boolean = true) {
    this.isLoading = true;
    this.searchReq.SupplierType = 2;
    this.report.fetchAllPurchaseReport(obj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        this.lstReport = this.assignSlNo(res.result);
        this.totalItems = Number(
          res.totalCount ??
          this.lstReport[0]?.totalCount ??
          this.lstReport.length
        );
        this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
        if (recalcTotals) {
          this.loadTotals(this.totalItems);
        }
      },
    });
  }
  getAllDealer(obj: any) {
    this.searchReq.pageIndex = null;
  this.searchReq.pageSize = null;
    this.report.fetchAllDealer(obj).subscribe({
      next: (res: any) => {
        this.lstDealers = res.result;
        this.totalItems = Number(
          res.totalCount ??
          this.lstDealers[0]?.totalCount ??
          this.lstDealers.length
        );
        this.searchReq.pageIndex = 1;
  this.searchReq.pageSize = 10;
      },
    });
  }
  getAllRequestOrderReport(obj: any, recalcTotals: boolean = true) {
    this.isLoading = true;
    this.searchReq.SupplierType = 1;
    this.report.fetchAllRequestOrderReport(obj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        this.lstReport = this.assignSlNo(res.result);
        this.totalItems = Number(
          res.totalCount ??
          this.lstReport[0]?.totalCount ??
          this.lstReport.length
        );
        this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
        if (recalcTotals) {
          this.loadTotals(this.totalItems);
        }
      },
    });
  }
  getAllCategory(model: any) {
    // this.searchReq.pageSize = 100;
    this.settingsService
      .fetchAllCategory(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstCategories = res.result;
          this.filteredCategories = this.lstCategories;
          this.totalItems =
            this.lstCategories.length > 0
              ? this.lstCategories[0].totalCount
              : 0;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }

  getAllWarehouse(model: any) {
    this.settingsService
      .fetchAllWarehouses(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstWarehouses = res.result;
          this.totalItems =
            this.lstWarehouses.length > 0
              ? this.lstWarehouses[0].totalCount
              : 0;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }
  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    // Paging doesn't change the filtered dataset, so keep the existing totals
    if( this.value == 1){
      this.getAllRequestOrderReport(this.searchReq, false);
    }else{
      this.getAllPurchaseReport(this.searchReq, false);
    }
  }

  showBottomSheet() {
    this.bottomSheet.open(BottomSheetComponent);
  }

  private handleKeyboard = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      event.preventDefault();
    } else if (event.key === 'Control') {
      this.closeBottomSheet();
    }
  };

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboard);
  }

  closeBottomSheet() {
    this.bottomSheet.dismiss();
  }

  onExportAllExcel() {
    this.isDownloading = true;

    if(this.value == 1){
          this.report
      .fetchAllRequestOrderReport({
        ...this.searchReq,
        pageIndex: 1,
        pageSize: this.totalItems,
        materialNo: this.searchReq.materialNo,
        brandId: this.searchReq.brandId,
        fromDate: this.searchReq.fromDate,
        toDate: this.searchReq.toDate,
      })
      .subscribe({
        next: (res: any) => {
          const data = res?.result || [];

          if (!data.length) {
            this.messagHelper.showMessage(400, 'No data found to export');
            this.isDownloading = false;
            return;
          }

            const rows = data.map((r: any) => ({
            MaterialNumber: r.materialNumber ?? r.materilNumber ?? '',
            InvoiceNumber: r.purchaseInvoiceNo ??  '',
            ItemName: r.itemName ?? '',
            Supplier: r.supplierName ?? '',
            Brand: r.brand ?? r.brandName ?? '',
            Warehouse: r.warehouse ?? r.warehouseName ?? '',
            Quantity: Number(r.quantity ?? 0),            
            UnitPrice: Number( r.unitPrice ?? 0),
            GrossPurchase: Number(r.netPurchase ?? 0),
            TotalInvoiceAmount: Number(r.totalInvoiceAmount ?? 0),
            Date: r.stockDate ?? r.invoiceDate ?? r.orderDate ?? '',
          }));

          this.excel(rows, 'Request Order Report.xlsx');
          this.messagHelper.showMessage(200, 'Export completed');
          this.isDownloading = false;
        },
        error: (err) => {
          this.messagHelper.showMessage(500, 'Failed to fetch data');
          console.error(err);
          this.isDownloading = false;
        },
      });
    } else{
          this.report
      .fetchAllPurchaseReport({
        ...this.searchReq,
        pageIndex: 1,
        pageSize: this.totalItems,
        materialNo: this.searchReq.materialNo,
        brandId: this.searchReq.brandId,
        fromDate: this.searchReq.fromDate,
        toDate: this.searchReq.toDate,
      })
      .subscribe({
        next: (res: any) => {
          const data = res?.result || [];

          if (!data.length) {
            this.messagHelper.showMessage(400, 'No data found to export');
            this.isDownloading = false;
            return;
          }

            const rows = data.map((r: any) => ({
            MaterialNumber: r.materialNumber ?? r.materilNumber ?? '',
            InvoiceNumber: r.purchaseInvoiceNo ??  '',
            ItemName: r.itemName ?? '',
            Supplier: r.supplierName ?? '',
            Brand: r.brand ?? r.brandName ?? '',
            Warehouse: r.warehouse ?? r.warehouseName ?? '',
            Quantity: Number(r.quantity ?? 0),
            UnitPrice: Number( r.unitPrice ?? 0),
            GrossPurchase: Number(r.netPurchase ?? 0),
            TotalInvoiceAmount: Number(r.totalInvoiceAmount ?? 0),
            Date: r.stockDate ?? r.invoiceDate ?? r.orderDate ?? '',
          }));

          this.excel(rows, 'Purchase Report.xlsx');
          this.messagHelper.showMessage(200, 'Export completed');
          this.isDownloading = false;
        },
        error: (err) => {
          this.messagHelper.showMessage(500, 'Failed to fetch data');
          console.error(err);
          this.isDownloading = false;
        },
      });
    }

  }

  // onBrandChange(brandId: any, brandName: string) {
  //   this.searchReq.brandId = brandId;
  //   this.selectedBrandName = brandName;
  //   // this.searchReq.brandId = id;
  //       if(this.authenticatedUser.isAdmin == 'true' && this.value == 1){
  //     this.getAllRequestOrderReport(this.searchReq);
  //   }else{
  //     this.getAllPurchaseReport(this.searchReq);
  //   }
  // }
  onDealerChange(id: any) {
    this.searchReq.tenantId = id;
        if(this.authenticatedUser.isAdmin == 'true' && this.value == 1){
      this.getAllRequestOrderReport(this.searchReq);
    this.getAllBrand({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.filteredBrands = this.lstBrands;
    this.getAllCategory({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.getAllWarehouse({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
      
    }else{
      this.getAllPurchaseReport(this.searchReq);
           this.getAllBrand({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.filteredBrands = this.lstBrands;
    this.getAllCategory({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.getAllWarehouse({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    }
  }

  refreshItemlist() {
    this.selectedBrandName = '';
    this.selectedCategoryName = '';
    this.filteredBrands = this.lstBrands;
    this.filteredCategories = this.lstCategories;
    this.searchReq.searchText = '';
    this.searchReq.brandId = 0;
    this.searchReq.materialNo = 0;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.selectedBrand = 'all';
    this.selectedCategory = 'all';
    this.searchReq.categoryId = 0;
    this.searchReq.warehouseId = 0;
    this.selectedWarehouse = 'all';
    this.selectedDealer = 'all';
    this.selectedOption = '1';
    this.value = 1;
    this.materialSearch = '';
    this.fromDate = null;
    this.toDate = null;
    if( this.value == 1){
      if(this.authenticatedUser?.isAdmin === 'true'){
         this.searchReq.tenantId = null;
      this.getAllRequestOrderReport(this.searchReq);
      }else{
         this.searchReq.tenantId = this.authenticatedUser?.tenantId;
      this.getAllRequestOrderReport(this.searchReq);
      }
     
    }else{
      this.getAllPurchaseReport(this.searchReq);
    }
  }
isFirstInvoice(index: number): boolean {
  if (index === 0) {
    return true;
  }

  return this.lstReport[index].purchaseInvoiceNo !==
         this.lstReport[index - 1].purchaseInvoiceNo;
}


getInvoiceRowSpan(index: number): number {
  const invoiceNo = this.lstReport[index].purchaseInvoiceNo;

  let count = 0;

  for (let i = index; i < this.lstReport.length; i++) {
    if (this.lstReport[i].purchaseInvoiceNo === invoiceNo) {
      count++;
    } else {
      break;
    }
  }

  return count;
}
  getAllBrand(model: any) {
    // this.searchReq.pageSize = 100;
    this.settingsService.fetchAllBrands(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstBrands = res.result;
        this.filteredBrands = this.lstBrands;
        this.totalItems =
          this.lstBrands.length > 0 ? this.lstBrands[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }
}
