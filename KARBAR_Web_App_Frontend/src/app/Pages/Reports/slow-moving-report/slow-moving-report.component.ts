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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-slow-moving-report',
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
  MatOptionModule,],
  templateUrl: './slow-moving-report.component.html',
  styleUrl: './slow-moving-report.component.scss'
})

export class SlowMovingReportComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstReport: any[] = [];
  isLoading: boolean = false;
  searchText: string = '';
  fromDate: string | null = null;
  toDate: string | null = null;
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
    this.getAllSlowMovingReport(this.searchReq);
    // this.get(this.searchReq);
  }

  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    this.getAllSlowMovingReport(this.searchReq);
  }

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllSlowMovingReport(this.searchReq);
  }

getAllSlowMovingReport(obj:any) {
    this.isLoading = true;
    this.report.fetchSlowmovingReport(obj).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        this.lstReport = res.result;
        this.totalItems = Number(res.totalCount ?? (this.lstReport[0]?.totalCount) ?? this.lstReport.length);
        this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
      }
    });
}

  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllSlowMovingReport(this.searchReq);
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

  this.report.fetchSlowmovingReport({ ...this.searchReq, pageIndex: 1, pageSize: this.totalItems })
    .subscribe({
      next: (res: any) => {
        const data = res?.result || [];

        if (!data.length) {
          this.messagHelper.showMessage(400, 'No data found to export');
          this.isDownloading = false;
          return;
        }

        const rows = data.map((r: any, index: number) => ({
          'Sl No.': index + 1,
          'Material Code': r.materialCode ?? '',
          'Material Name': r.materialName ?? '',
          'Category': r.category ?? '',
          'Current Stock': Number(r.currentStock ?? 0),
          'Unit Cost': Number(r.unitCost ?? 0),
          'Stock Value': Number(r.stockValue ?? 0),
          'Last Purchase Date': r.lastPurchaseDate
            ? r.lastPurchaseDate.split('T')[0]
            : '',
          'Last Sale Date': r.lastSaleDate
            ? r.lastSaleDate.split('T')[0]
            : '',
          'Days Since Last Sale': r.daysSinceLastSale ?? '',
          'Sales Qty 30 Days': Number(r.salesQty30Days ?? 0),
          'Sales Qty 60 Days': Number(r.salesQty60Days ?? 0),
          'Sales Qty 90 Days': Number(r.salesQty90Days ?? 0),
          'Stock Status': r.stockStatus ?? '',
          'Suggested Action': r.suggestedAction ?? ''
        }));

        this.excel(rows, 'Slow Moving Non-Moving Dead Stock Report.xlsx');
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

  refreshItemlist(){
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllSlowMovingReport(this.searchReq);
  }  
}