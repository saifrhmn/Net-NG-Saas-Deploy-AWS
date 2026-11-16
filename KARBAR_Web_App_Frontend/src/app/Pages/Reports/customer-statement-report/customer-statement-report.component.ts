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
  selector: 'app-customer-statement-report',
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
  templateUrl: './customer-statement-report.component.html',
  styleUrl: './customer-statement-report.component.scss'
})

export class CustomerStatementReportComponent {
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
  readonly excel = exportToExcel;

  currentBalance: number | null = null;
isSearchActive: boolean = false;

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
    this.getAllCustomerStatement(this.searchReq);
    // this.get(this.searchReq);
  }

  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
      this.isSearchActive = !!(this.searchReq.searchText && this.searchReq.searchText.trim().length > 0);
    this.getAllCustomerStatement(this.searchReq);
  }

  

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllCustomerStatement(this.searchReq);
  }

  // getAllCustomerStatement(obj: any) {
  //   this.report.fetchCustomerstatement(obj).subscribe({
  //     error: () => { this.isLoading = false; },
  //     next: (res: any) => {
  //       this.isLoading = false;
  //       debugger;
  //       this.lstReport = res.result;
  //       this.totalItems = Number(
  //         res.totalCount ??
  //           this.lstReport[0]?.totalCount ??
  //           this.lstReport.length,
  //       );
  //       this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
  //     },
  //   });
  // }

  getAllCustomerStatement(obj: any) {
  if (this.isSearchActive) {
    // fetch everything matching the search so the balance is accurate, not just page-local
    this.isLoading = true;
    this.report.fetchCustomerstatement({ ...obj, pageIndex: 1, pageSize: 100000 }).subscribe({
      error: () => { this.isLoading = false; },
      next: (res: any) => {
        this.isLoading = false;
        const allRows = res.result || [];
        this.totalItems = allRows.length;
        this.updateCurrentBalance(allRows);

        // paginate client-side for display
        const pageIndex = Number(obj.pageIndex || this.searchReq.pageIndex || 1);
        const pageSize = Number(obj.pageSize || this.searchReq.pageSize || 10);
        const start = (pageIndex - 1) * pageSize;
        this.lstReport = allRows.slice(start, start + pageSize);
      },
    });
  } else {
    this.currentBalance = null; // hide balance when not searching
    this.report.fetchCustomerstatement(obj).subscribe({
      next: (res: any) => {
        this.lstReport = res.result;
        this.totalItems = Number(
          res.totalCount ?? this.lstReport[0]?.totalCount ?? this.lstReport.length,
        );
        this.searchReq.pageIndex = Number(this.searchReq.pageIndex || 1);
      },
    });
  }
}

private updateCurrentBalance(rows: any[]): void {
  if (!rows?.length) {
    this.currentBalance = null;
    return;
  }
  const sorted = [...rows].sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (a.slNo ?? 0) - (b.slNo ?? 0); // tiebreaker when dates are equal
  });
  this.currentBalance = sorted[sorted.length - 1].balance;
}


  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllCustomerStatement(this.searchReq);
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
    .fetchCustomerstatement({
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
          'Customer Name': r.customerName ?? '',
          'Customer ID': r.customerId ?? '',
          'Address': r.address ?? '',
          'Date': r.date ? r.date.split('T')[0] : '',
          'Invoice/Receipt No': r.invoiceNo ?? '',
          'Reference': r.reference ?? '',
          'Debit (Sales)': r.debit ?? 0,
          'Credit (Payment)': r.credit ?? 0,
          'Balance': r.balance ?? 0,
        }));

        this.excel(rows, 'Customer Statement Report.xlsx');
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
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
      this.isSearchActive = false;
  this.currentBalance = null;
    this.getAllCustomerStatement(this.searchReq);
  }
}
