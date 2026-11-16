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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-top-item-sold',
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
    TypeableSelectionDropdownComponent,
  ],
  templateUrl: './top-item-sold.component.html',
  styleUrl: './top-item-sold.component.scss',
})
export class TopItemSoldComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstReport: any[] = [];
  isLoading: boolean = false;
  lstBrands: any[] = [];
  lstCategories: any[] = [];
  searchText: string = '';
  fromDate: string | null = null;
  toDate: string | null = null;
  isAdmin: boolean = false;
  isDownloading: boolean = false;
  selectedBrandName: string = '';
  filteredCategories: any[] = [];
  filteredBrands: any[] = [];
  selectedCategoryName: string = '';
  totalItems: number = 0;
  timer: any;
  searchReq: SearchRequest = new SearchRequest();
  authenticatedUser: AuthenticatedUser | null = null;
  readonly excel = exportToExcel;

  constructor(
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private report: ReportService,
    private settingsService: SettingsService,
  ) {}
  ngOnInit() {
    // initialize paging defaults and load first page
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchReq.pageIndex = this.searchReq.pageIndex || 1;
    this.searchReq.pageSize = this.searchReq.pageSize || 10;
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;
    this.getAllTopsold(this.searchReq);

    this.searchReq.pageSize = null;
    this.getAllBrand(this.searchReq);
    this.getAllCategory(this.searchReq);
    // this.get(this.searchReq);
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
  this.getAllTopsold(this.searchReq);
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
  this.getAllTopsold(this.searchReq);
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
  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    this.getAllTopsold(this.searchReq);
  }

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.brandId = null;
    this.searchReq.categoryId = null;
    this.selectedBrandName = '';
    this.selectedCategoryName = '';
    this.searchReq.pageIndex = 1;
    this.getAllTopsold(this.searchReq);
  }

  getAllTopsold(obj: any) {
    this.isLoading = true;
    this.report.fetchAllTopItemsSold(obj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        this.lstReport = res.result;
        this.totalItems = Number(
          res.totalCount ??
            this.lstReport[0]?.totalCount ??
            this.lstReport.length,
        );
        this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
      },
    });
  }

  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllTopsold(this.searchReq);
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
      .fetchAllTopItemsSold({
        ...this.searchReq,
        pageIndex: 1,
        pageSize: this.totalItems,
        materialNo: this.searchReq.materialNo,
        brandId: this.searchReq.brandId,
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
            'Sl No': r.slNo ?? '',
            'Item Code': r.itemCode ?? '',
            'Item Name': r.itemName ?? '',
            Brand: r.brand ?? '',
            'Total Quantity Sold': r.totalQuantitySold ?? 0,
            'Total Sales Value': r.totalSalesValue ?? 0,
            Rank: r.rank ?? '',
          }));

          this.excel(rows, 'Top Sold Items.xlsx');
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

  refreshItemlist() {
  // Clear date filters
  this.fromDate = null;
  this.toDate = null;

  // Clear brand & category filters
  this.selectedBrandName = '';
  this.selectedCategoryName = '';
  this.searchReq.brandId = null;
  this.searchReq.categoryId = null;

  // Reset pagination
  this.searchReq.pageIndex = 1;

  // Reload data
  this.getAllTopsold(this.searchReq);
}
}
