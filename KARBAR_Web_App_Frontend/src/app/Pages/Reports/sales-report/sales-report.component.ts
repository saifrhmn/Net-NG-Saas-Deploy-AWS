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
import { MatAutocompleteSelectedEvent, MatAutocomplete, MatAutocompleteModule } from '@angular/material/autocomplete';
import { TypeableSelectionDropdownComponent } from '../../../Common/Component/typeable-selection-dropdown/typeable-selection-dropdown.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-sales-report',
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
  templateUrl: './sales-report.component.html',
  styleUrl: './sales-report.component.scss',
})
export class SalesReportComponent {
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
  selectedCategory: string = 'all';
  selectedWarehouse: string = 'all';
  materialSearch: string = '';
  lstBrands: any[] = [];
  lstCategories: any[] = [];
  lstWarehouses: any[] = [];
  lstDealers: any[] = [];
  selectedDealer: string = 'all';

  readonly excel = exportToExcel;
  filteredBrands: any[] = [];
  selectedBrandName: string = '';
  filteredCategories: any[] = [];
  selectedCategoryName: string = '';

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
    this.searchReq.roleId = 3;
    
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;
    if(this.authenticatedUser?.isAdmin === 'true'){
      this.searchReq.tenantId = null;
      this.getAllDealer({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId, roleId: this.searchReq.roleId});
    }
    this.searchReq.pageIndex = this.searchReq.pageIndex || 1;
    this.searchReq.pageSize = 10;
    this.getAllstalesReport(this.searchReq);

    this.getAllBrand({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.filteredBrands = this.lstBrands;
    this.getAllCategory({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
 
    this.getAllWarehouse({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    
    // this.get(this.searchReq);
  }

  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    this.getAllstalesReport(this.searchReq);
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
  private slNoCarry: number = 0;

  prepareRowSpans(data: any[]): any[] {
  // Each invoice group can span a different number of raw rows, so pageIndex * pageSize
  // does not line up with group boundaries. Instead, carry the group count forward from
  // the previous page (reset on page 1 / a fresh filter).
  const startIndex = Number(this.searchReq.pageIndex || 1) === 1 ? 0 : this.slNoCarry;
  let groupCount = 0;
  let i = 0;
  while (i < data.length) {
    let j = i;
    while (j < data.length && data[j].invoiceNo === data[i].invoiceNo) {
      j++;
    }
    const groupSize = j - i;
    groupCount++;
    data[i].isGroupStart = true;
    data[i].rowSpan = groupSize;
    data[i].slNo = startIndex + groupCount;
    for (let k = i + 1; k < j; k++) {
      data[k].isGroupStart = false;
      data[k].rowSpan = 0;
    }
    i = j;
  }
  this.slNoCarry = startIndex + groupCount;
  return data;
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
    this.report
      .fetchAllSalesReport({ ...this.searchReq, pageIndex: 1, pageSize: totalCount })
      .subscribe({
        next: (res: any) => {
          const data = res?.result || [];
          this.totalInvoiceAmount = data.reduce((sum: number, r: any) => sum + (Number(r.totalInvoiceAmount) || 0), 0);
          this.totalQty = data.reduce((sum: number, r: any) => sum + (Number(r.quantity) || 0), 0);
        },
      });
  }
  onCategoryChange(id: any) {
    debugger
    this.searchReq.categoryId = id;
    this.getAllstalesReport(this.searchReq);
  }

  onCategorySearch(searchValue: string) {
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
    this.onCategoryChange(categoryId);
  }
  onWarehouseChange(id: any) {
    debugger
    this.searchReq.warehouseId = id;
    this.getAllstalesReport(this.searchReq);
  }
  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllstalesReport(this.searchReq);
  }
  onInvoiceSearchChange(value: any) {
    debugger;
    const q = (value || '').toLowerCase().trim();
    this.searchReq.invoiceNo = q;
    this.getAllstalesReport(this.searchReq);
  }
  onMaterialSearchChange(value: any) {
    debugger;
    const q = (value || '').toLowerCase().trim();
    this.searchReq.SearchMaterial = q;
    this.getAllstalesReport(this.searchReq);
  }

  getAllstalesReport(obj: any, recalcTotals: boolean = true) {
    // debugger
    // if(this.authenticatedUser?.isAdmin === 'true'){
    //   this.searchReq.tenantId = null;
    // }
    this.isLoading = true;
    this.report.fetchAllSalesReport(obj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        console.log(obj);
        // this.lstReport = res.result;
        this.lstReport = this.prepareRowSpans(res.result);
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
    this.getAllstalesReport(this.searchReq, false);
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

    this.report
      .fetchAllSalesReport({
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
            InvoiceNumber: r.invoiceNo ?? r.invoiceNo ?? '',
            MaterialNumber: r.materialNumber ?? r.materilNumber ?? '',
            ItemName: r.itemName ?? '',
            Brand: r.brand ?? r.brandName ?? '',
            Warehouse: r.warehouse ?? r.warehouseName ?? '',
            Quantity: Number(r.quantity ?? 0),
            Unit: r.unit ?? r.uomName ?? '',
            MRP: Number(r.mrp ?? r.unitPrice ?? 0),
            SellingPrice: Number(r.sellingPrice ?? r.unitPrice ?? 0),
            TotalAmount: Number(r.invoiceValueAmt ?? r.invoiceValueAmt ?? 0),
            WeightedAvgPrice: Number(r.weightedAvgPrice ?? r.avgPrice ?? 0),
            Date: r.stockDate ?? r.invoiceDate ?? r.orderDate ?? '',
          }));

          this.excel(rows, 'Sales Report.xlsx');
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

    onDealerChange(id: any) {
    this.searchReq.tenantId = id;
      this.getAllstalesReport(this.searchReq);
      this.getAllBrand({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.filteredBrands = this.lstBrands;
    this.getAllCategory({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.getAllWarehouse({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});

  }


  onBrandChange(id: any) {
    debugger;
    this.searchReq.brandId = id;
    this.getAllstalesReport(this.searchReq);
  }

  onBrandSearch(searchValue: string) {
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
    this.onBrandChange(brandId);
  }

  refreshItemlist() {
    this.selectedBrandName = '';
    this.selectedCategoryName = '';
    this.filteredBrands = this.lstBrands;
    this.filteredCategories = this.lstCategories;
    this.searchReq.brandId = 0;
    this.searchReq.warehouseId = 0;
    this.searchReq.categoryId = 0;
    this.searchReq.materialNo = 0;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.selectedBrand = 'all';
    this.selectedCategory = 'all';
    this.selectedWarehouse = 'all';
    this.selectedDealer = 'all';
    this.searchReq.categoryId = 0;
    this.materialSearch = '';
    this.fromDate = null;
    this.toDate = null;
    debugger
    if(this.authenticatedUser?.isAdmin === 'true'){
      this.searchReq.tenantId = null;
    }
    this.getAllstalesReport(this.searchReq);
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
