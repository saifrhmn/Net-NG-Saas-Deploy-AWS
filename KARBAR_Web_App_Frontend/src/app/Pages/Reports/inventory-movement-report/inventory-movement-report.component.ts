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
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { TypeableSelectionDropdownComponent } from '../../../Common/Component/typeable-selection-dropdown/typeable-selection-dropdown.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-inventory-movement-report',
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
    MatCheckboxModule,
    TypeableSelectionDropdownComponent,
  ],
  templateUrl: './inventory-movement-report.component.html',
  styleUrl: './inventory-movement-report.component.scss'
})

export class InventoryMovementReportComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstStock: any[] = [];
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
  filteredBrands: any[] = [];
  selectedBrandName: string = '';
  selectedCategoryName: string = '';
filteredCategories: any[] = [];
includeZeroStock: boolean = false;
originalPageSize: number = 10;
allStockCache: any[] = []; 
  selectedMonth: string = '';
  months: Array<{ name: string; value: number }> = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 }
  ];

  

  readonly excel = exportToExcel;

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
 
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;
    if(this.authenticatedUser?.isAdmin === 'true'){
      this.searchReq.tenantId = null;
      this.searchReq.roleId = 3;
      this.getAllDealer(this.searchReq);
    }
    this.getAllstockReport(this.searchReq);
    this.getAllCategory({ pageIndex: 1, tenantId: this.searchReq.tenantId, pageSize: null });
    this.getAllBrand({ pageIndex: 1, tenantId: this.searchReq.tenantId, pageSize: null });
  }

  onFilter() {
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    this.getAllstockReport(this.searchReq);
  }
  getAllDealer(obj: any) {
      //  this.searchReq.roleId = 3;
  this.searchReq.pageIndex = null;
  this.searchReq.pageSize = null;
   obj.roleId = 3;
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

onCategoryChange(categoryId: any, categoryName?: string) {
  this.searchReq.categoryId = categoryId;
  if (categoryName) {
    this.selectedCategoryName = categoryName;
  }
  this.getAllstockReport(this.searchReq);
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

onBrandChange(brandId: any, brandName: string) {
  this.searchReq.brandId = brandId;
  this.selectedBrandName = brandName;
  this.getAllstockReport(this.searchReq);
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
  sumInvoiceAmount(fromDate?: string, toDate?: string): number {
    let reports = this.lstStock;
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      // Set time to start of day for fromDate
      from.setHours(0, 0, 0, 0);

      // Set time to end of day for toDate to include the entire day
      to.setHours(23, 59, 59, 999);

      reports = reports.filter((r: any) => {
        if (!r.invoiceDate) return false;
        const invDate = new Date(r.invoiceDate);
        // Ensure we're comparing dates properly
        invDate.setHours(0, 0, 0, 0);
        const from_compare = new Date(fromDate);
        from_compare.setHours(0, 0, 0, 0);
        const to_compare = new Date(toDate);
        to_compare.setHours(23, 59, 59, 999);
        return invDate >= from_compare && invDate <= to_compare;
      });
    }
    return reports.reduce((sum: number, r: any) => sum + (Number(r.totalInvoiceAmount) || 0), 0);
  }

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.selectedMonth = '';
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllstockReport(this.searchReq);
  }

  // getAllstockReport(obj: any) {
  //   pageSize: this.includeZeroStock ? 100000 : Number(obj?.pageSize || this.searchReq.pageSize || 10),
  //   this.report.fetchAllInventoryStock(obj).subscribe({
  //     next: (res: any) => {
  //       console.log(obj);
  //       this.lstStock = res.result;
  //       this.totalItems = Number(
  //         res.totalCount ??
  //         this.lstStock[0]?.totalCount ??
  //         this.lstStock.length
  //       );
  //       this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
        
  //     },
  //   });
  // }

  getAllstockReport(obj: any) {
  if (this.includeZeroStock) {
    // fetch everything so we can filter out zero-value rows, then paginate client-side
    const fetchObj = { ...obj, pageIndex: 1, pageSize: 100000 };
    this.isLoading = true;
    this.report.fetchAllInventoryStock(fetchObj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        const allRows = res.result || [];

        // keep only rows that have SOME non-zero quantity
        const filtered = allRows.filter((r: any) =>
          Number(r.openingStockQty) !== 0 ||
          Number(r.receivedQty) !== 0 ||
          Number(r.salesQty) !== 0 ||
          Number(r.closingStockQty) !== 0
        );

        this.allStockCache = filtered;
        this.totalItems = filtered.length;

        const pageIndex = Number(obj.pageIndex || this.searchReq.pageIndex || 1);
        const pageSize = Number(obj.pageSize && obj.pageSize !== 100000 ? obj.pageSize : (this.originalPageSize || 10));
        const startIndex = (pageIndex - 1) * pageSize;

        this.lstStock = filtered.slice(startIndex, startIndex + pageSize);
        this.searchReq.pageIndex = pageIndex;
        this.searchReq.pageSize = pageSize;
      },
    });
  } else {
    this.isLoading = true;
    this.report.fetchAllInventoryStock(obj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        this.lstStock = res.result;
        this.totalItems = Number(
          res.totalCount ??
          this.lstStock[0]?.totalCount ??
          this.lstStock.length
        );
        this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
      },
    });
  }
}

  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
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

  onExportAllExcel() {
    this.isDownloading = true;

    this.report
      .fetchAllInventoryStock({
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
            MaterialCode: r.materialCode,
            MaterialName: r.materialName ?? '',
            OpeningStockQuantity: r.openingStockQty,
            ReceiveQuantity: r.receivedQty,
            SalesQuantity: r.salesQty,
            ClosingStockQuantity: r.closingStockQty,
          }));

          this.excel(rows, 'Inventory Movement Report.xlsx');
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

onIncludeZeroToggle(checked: boolean): void {
  this.includeZeroStock = checked;
  this.searchReq.pageIndex = 1;
  this.searchReq.pageSize = this.originalPageSize || 10;
  this.getAllstockReport(this.searchReq);
}


  //   onBrandChange(id: any) {
  //   debugger;
  //   this.searchReq.brandId = id;
  //   this.getAllstockReport(this.searchReq);
  // }
  // onCategoryChange(id: any) {
  //   debugger
  //   this.searchReq.categoryId = id;
  //   this.getAllstockReport(this.searchReq);
  // }


    onDealerChange(id: any) {
    this.searchReq.tenantId = id;
      this.getAllstockReport(this.searchReq);
       this.getAllBrand({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});
    this.filteredBrands = this.lstBrands;
    this.getAllCategory({pageIndex: 1, pageSize: null, tenantId: this.searchReq.tenantId});

  }

  onMonthChange(monthValue: number) {
    const currentYear = new Date().getFullYear();
    // Set fromDate to the 1st of the selected month
    // monthValue is 1-based (1-12), but Date constructor expects 0-based (0-11)
    const firstDay = new Date(currentYear, monthValue - 1, 1);
    this.fromDate = this.formatDateLocal(firstDay);
    
    // Set toDate to the last day of the selected month
    // Using day 0 of the next month gives us the last day of current month
    const lastDay = new Date(currentYear, monthValue, 0);
    this.toDate = this.formatDateLocal(lastDay);
    
    // Trigger the filter
    this.onFilter();
  }

  private formatDateLocal(date: Date): string {
    // Format date in local timezone (not UTC) to avoid timezone offset issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  refreshItemlist() {
    this.selectedBrandName = '';
    this.selectedCategoryName = '';
    this.filteredBrands = this.lstBrands;
    this.filteredCategories = this.lstCategories;
    this.searchReq.brandId = 0;
    this.searchReq.materialNo = 0;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.selectedBrand = 'all';
    this.selectedCategory = 'all';
    this.selectedWarehouse = 'all';
    this.selectedDealer = 'all';
    this.selectedMonth = '';
    this.searchReq.categoryId = 0;
    // this.searchReq.IsCustomerRecieved = false;
    this.materialSearch = '';
    this.fromDate = null;
    this.toDate = null;
    if(this.authenticatedUser?.isAdmin === 'true'){
      this.searchReq.tenantId = null;
    }
    this.getAllstockReport(this.searchReq);
  }


}