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
  selector: 'app-customer-receivable-report',
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
  templateUrl: './customer-receivable-report.component.html',
  styleUrl: './customer-receivable-report.component.scss',
})
export class CustomerReceivableReportComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstReport: any[] = [];
  isLoading: boolean = false;
  searchText: string = '';
  today = new Date();
  fromDate: string | null = null;
  toDate: string | null = null;
  isAdmin: boolean = false;
  isDownloading: boolean = false;
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
    this.getAllCustomerReceiveable(this.searchReq);
    // this.get(this.searchReq);
  }

  onFilter() {
    // attach date filters to search request and fetch
    this.searchReq.fromDate = this.fromDate ? this.fromDate : null;
    this.searchReq.toDate = this.toDate ? this.toDate : null;
    this.searchReq.pageIndex = 1;
    this.getAllCustomerReceiveable(this.searchReq);
  }

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.pageIndex = 1;
    this.getAllCustomerReceiveable(this.searchReq);
  }

getAgingDays(dueDate: string | null): number | string {
  if (!dueDate) return '-';

  const due = new Date(dueDate);
  const diff = this.today.getTime() - due.getTime();

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
  getAllCustomerReceiveable(obj: any) {
    this.isLoading = true;
    this.report.fetchAllCustomerReceivable(obj).subscribe({
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
    this.getAllCustomerReceiveable(this.searchReq);
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
    .fetchAllCustomerReceivable({
      ...this.searchReq,
      pageIndex: 1,
      pageSize: this.totalItems
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
          'Customer Code': r.customerId ?? '',
          'Customer Name': r.customerName ?? '',
          'Invoice No': r.invoiceNo ?? '',
          'Invoice Date': r.invoiceDate
            ? r.invoiceDate.split('T')[0]
            : '',
          'Due Date': r.dueDate
            ? r.dueDate.split('T')[0]
            : '',
          'Invoice Amount': r.invoiceAmount ?? 0,
          'Paid': r.paid ?? 0,
          'Outstanding': r.outstanding ?? 0
        }));

        this.excel(rows, 'Customer Receivable Report.xlsx');
        this.messagHelper.showMessage(200, 'Export completed');
        this.isDownloading = false;
      },
      error: (err) => {
        console.error(err);
        this.messagHelper.showMessage(500, 'Failed to fetch data');
        this.isDownloading = false;
      }
    });
}

  refreshItemlist() {
    this.searchReq.fromDate = null;
    this.searchReq.toDate = null;
    this.searchReq.searchText = null;
    this.searchReq.pageIndex = 1;
    this.getAllCustomerReceiveable(this.searchReq);
  }
}
