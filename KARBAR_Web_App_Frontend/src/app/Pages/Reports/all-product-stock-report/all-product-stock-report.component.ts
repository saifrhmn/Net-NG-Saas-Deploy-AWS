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
import { AuthenticatedUser, AuthenticationService } from '../../../Services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { exportToExcel } from '../../../Common/Utils/utils';
import { forkJoin } from 'rxjs';
import { TypeableSelectionDropdownComponent } from '../../../Common/Component/typeable-selection-dropdown/typeable-selection-dropdown.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-all-product-stock-report',
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
  MatCheckboxModule,
  TypeableSelectionDropdownComponent
  ],
  
  templateUrl: './all-product-stock-report.component.html',
  styleUrls: ['./all-product-stock-report.component.scss'],
})
export class AllProductStockReportComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstReport: any[] = [];
  isLoading: boolean = false;
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
  materialSearch: string = '';
  lstBrands: any[] = [];
  selectedCategory: string = 'all';
  selectedWarehouse: string = 'all';
  lstCategories: any[] = [];
  lstWarehouses: any[] = [];
      filteredBrands: any[] = [];
  selectedBrandName: string = '';
  selectedCategoryName: string = '';
filteredCategories: any[] = [];
includeZeroStock: boolean = false;
  allReportData: any[] = [];
  originalPageSize: number = 10;
  readonly excel = exportToExcel;

  constructor(
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private report : ReportService,
    private settingsService: SettingsService
  ) {}
  ngOnInit() {
    // initialize paging defaults and load first page
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchReq.pageIndex = this.searchReq.pageIndex || 1;
    this.searchReq.pageSize = this.searchReq.pageSize || 10;
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;
     this.originalPageSize = this.searchReq.pageSize;
    this.getAllstockReport(this.searchReq);
    this.getAllBrand({ pageIndex: 1, pageSize: null, tenantId: this.authenticatedUser?.tenantId });
    this.getAllCategory({ pageIndex: 1, pageSize: null, tenantId: this.authenticatedUser?.tenantId });
    this.getAllWarehouse({ pageIndex: 1, pageSize: null, tenantId: this.authenticatedUser?.tenantId });
    // this.get(this.searchReq);
  }

  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    this.getAllstockReport(this.searchReq);
  }

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllstockReport(this.searchReq);
  }
onMaterialSearchChange(value: any) {
  debugger
  const q = (value || '').toLowerCase().trim();
  this.searchReq.materialNo = q;
  this.searchReq.name = q;
  this.getAllstockReport(this.searchReq);

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
  onCategoryChange(categoryId: any, categoryName?: string) {
    this.searchReq.categoryId = categoryId;
    this.selectedCategoryName = categoryName || '';
    
      this.getAllstockReport(this.searchReq);
  }

  onWarehouseChange(id: any) {
    this.searchReq.warehouseId = id;
    this.getAllstockReport(this.searchReq);
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

onIncludeZeroToggle(checked: boolean): void {
  this.includeZeroStock = checked;
  this.searchReq.pageIndex = 1;
  this.searchReq.pageSize = this.originalPageSize || 10;
  this.getAllstockReport(this.searchReq);
}

getAllstockReport(obj: any) {
  const request = {
    ...obj,
    pageIndex: Number(obj?.pageIndex || 1),
    pageSize: this.includeZeroStock ? 100000 : Number(obj?.pageSize || this.searchReq.pageSize || 10),
    tenantId: obj?.tenantId ?? this.authenticatedUser?.tenantId,
  };

  this.isLoading = true;
  this.report.fetchAllProductStockReport(request).subscribe({
    error: () => { this.isLoading = false; },
    next: (res: any) => {
      this.isLoading = false;
      const rows = Array.isArray(res?.result) ? res.result : [];
      const filteredRows = this.applyZeroStockFilter(rows);

      this.allReportData = filteredRows;
      this.lstReport = this.includeZeroStock
        ? this.getPagedReportData(filteredRows)
        : rows;

      this.totalItems = this.includeZeroStock
        ? filteredRows.length
        : Number(res?.totalCount ?? rows[0]?.totalCount ?? rows.length ?? 0);

      this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
    }
  });
}

applyZeroStockFilter(rows: any[]): any[] {
  if (!this.includeZeroStock) {
    return rows;
  }

  return rows.filter((item: any) => Number(item.quantity ?? 0) > 0);
}

getPagedReportData(rows: any[]): any[] {
  const pageSize = Number(this.searchReq.pageSize || 10);
  const pageIndex = Number(this.searchReq.pageIndex || 1);
  const start = (pageIndex - 1) * pageSize;

  return rows.slice(start, start + pageSize);
}
  getAllCategory(model: any) {
    // this.searchReq.pageSize = 100;
    this.settingsService
      .fetchAllCategory(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstCategories = res.result;
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
  // onPageChange(event: any) {
  //   this.searchReq.pageSize = event.pageSize;
  //   this.searchReq.pageIndex = event.pageIndex + 1;
  //   this.getAllstockReport(this.searchReq);
  // }
onPageChange(event: any) {
  this.searchReq.pageSize = event.pageSize;
  this.searchReq.pageIndex = event.pageIndex + 1;

  if (this.includeZeroStock) {
    this.lstReport = this.getPagedReportData(this.allReportData);
    return;
  }

  this.getAllstockReport(this.searchReq);
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

// onExportAllExcel() {
//   // Base filters copied from current searchReq
//   const base = { ...this.searchReq };
//   base.pageIndex = 1;
//   base.pageSize = Number(this.searchReq.pageSize || 50);

//   this.report.fetchAllProductStockReport(base).subscribe({
//     next: (firstRes: any) => {
//       const firstPage = Array.isArray(firstRes.result) ? firstRes.result : [];
//       const totalCount = Number(firstRes.totalCount ?? (firstPage[0]?.totalCount) ?? firstPage.length);
//       const size = Number(base.pageSize);
//       const totalPages = Math.max(1, Math.ceil(totalCount / size));

//       if (totalPages <= 1) {
//         const rows = firstPage.map((r: any) => ({
//           MaterialNumber: r.materialNumber ?? '',
//           ItemName: r.itemName ?? '',
//           Brand: r.brand ?? '',
//           Warehouse: r.warehouse ?? '',
//           Quantity: r.quantity ?? 0,
//           Unit: r.unit ?? '',
//           MRP: r.mrp ?? 0,
//           SellingPrice: r.sellingPrice ?? 0,
//           WeightedAvgPrice: r.weightedAvgPrice ?? 0,
//           Date: r.stockDate ?? ''
//         }));
//         exportToExcel(rows, 'AllStock');
//         return;
//       }

//       // Prepare requests for remaining pages
//       const requests = [];
//       for (let p = 2; p <= totalPages; p++) {
//         requests.push(this.report.fetchAllProductStockReport({ ...base, pageIndex: p }));
//       }

//       forkJoin(requests).subscribe({
//         next: (resArray: any[]) => {
//           const pages = resArray.map(r => Array.isArray(r.result) ? r.result : []);
//           const all = firstPage.concat(...pages);
//           const rows = all.map((r: any) => ({
//             MaterialNumber: r.materialNumber ?? '',
//             ItemName: r.itemName ?? '',
//             Brand: r.brand ?? '',
//             Warehouse: r.warehouse ?? '',
//             Quantity: r.quantity ?? 0,
//             Unit: r.unit ?? '',
//             MRP: r.mrp ?? 0,
//             SellingPrice: r.sellingPrice ?? 0,
//             WeightedAvgPrice: r.weightedAvgPrice ?? 0,
//             Date: r.stockDate ?? ''
//           }));
//           exportToExcel(rows, 'AllStock');
//         },
//         error: () => this.messagHelper.showMessage(500, 'Failed to fetch all pages for export')
//       });
//     },
//     error: () => this.messagHelper.showMessage(500, 'Failed to fetch first page for export')
//   });
// }

onExportAllExcel() {
  this.isDownloading = true;

  this.report.fetchAllProductStockReport({ ...this.searchReq, pageIndex: 1, pageSize: this.totalItems , materialNo: this.searchReq.materialNo, brandId: this.searchReq.brandId})
    .subscribe({
      next: (res: any) => {
        const data = res?.result || [];

        if (!data.length) {
          this.messagHelper.showMessage(400, 'No data found to export');
          this.isDownloading = false;
          return;
        }

        const rows = data.map((r: any) => ({
          MaterialNumber: r.materialNumber ?? '',
          ItemName: r.itemName ?? '',
          Brand: r.brand ?? '',
          Warehouse: r.warehouse ?? '',
          Quantity: r.quantity ?? 0,
          Unit: r.unit ?? '',
          MRP: r.mrp ?? 0,
          SellingPrice: r.sellingPrice ?? 0,
          TotalStockPrice: (Number(r.quantity ?? 0) * Number(r.sellingPrice ?? 0)),
          WeightedAvgPrice: r.weightedAvgPrice ?? 0,
          Date: r.stockDate?.split('T')[0] ?? ''
        }));

        this.excel(rows, 'All Item Stock.xlsx');
        this.messagHelper.showMessage(200, 'Export completed');
        this.isDownloading = false;
      },
      error: (err) => {
        this.messagHelper.showMessage(500, 'Failed to fetch data');
        console.error(err);
        this.isDownloading = false;
      }
    });
}


  onBrandChange(brandId: any, brandName?: string) {
    debugger

      this.searchReq.brandId = brandId;
  this.selectedBrandName = brandName;
    this.getAllstockReport(this.searchReq);
  }

  refreshItemlist(){
    this.filteredBrands = this.lstBrands;
    this.filteredCategories = this.lstCategories;

    this.searchReq.brandId = 0;
    this.searchReq.categoryId = 0;
    this.searchReq.warehouseId = 0;
    this.searchReq.materialNo = 0;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.selectedBrand = 'all';
    this.selectedBrandName = '';
    this.selectedCategory = 'all';
    this.selectedCategoryName = '';
    this.selectedWarehouse = 'all';
    this.materialSearch = '';
    this.fromDate = null;
    this.toDate = null;
    this.getAllstockReport(this.searchReq);
  }

    getAllBrand(model: any) {

    // this.searchReq.pageSize = 100;
    this.settingsService.fetchAllBrands(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstBrands = res.result;
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

getTotalStock(){
  return (this.lstReport[0]?.totalStockQuantity ?? 0)
    .toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
}
  getTotalStockAmount(){
    // return this.lstReport.reduce((sum, item) => sum + (item.totalStockValue ?? 0), 0);
  return (this.lstReport[0]?.totalStockValue ?? 0)
    .toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  getTotalWeightedAmount(){
    // return this.lstReport.reduce((sum, item) => sum + (item.totalStockValue ?? 0), 0);
  return (this.lstReport[0]?.totalWeightAvgStockValue ?? 0)
    .toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  getWarehouseTotalWeightedAmount(){
    // return this.lstReport.reduce((sum, item) => sum + (item.totalStockValue ?? 0), 0);
  return (this.lstReport[0]?.warehouseTotalWeightAvgValue ?? 0)
    .toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  
}
