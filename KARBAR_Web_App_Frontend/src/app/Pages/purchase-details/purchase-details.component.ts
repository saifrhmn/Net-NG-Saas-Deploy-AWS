import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule, MatTabGroup } from '@angular/material/tabs';
import {
  MatFormFieldModule,
  MatFormField,
  MatLabel,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { Supplier } from '../../Model/supplier';
import { SupplierService } from '../../Services/supplier.service';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ApiResponse } from '../../Model/VM/apiResponse';

import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../Services/auth.service';
import { SettingsService } from '../../Services/settings.service';
import { Settings } from '../../Model/settings';
import { ItemService } from '../../Services/item.service';
import { Purchase } from '../../Model/purchase';
import { PurchaseDetails } from '../../Model/purchaseDetails';
import { PurchaseService } from '../../Services/purchase.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { InputComponent } from '../../Common/Component/input/input.component';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { OrderService } from '../../Services/order.service';
import { PurchaseDetailsService } from '../../Services/purchaseDetails.service';
import { MatPaginator } from "@angular/material/paginator";
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { ConfirmationDialogComponent } from '../../Common/Component/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-purchase-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatChipListbox,
    MatChipOption,
    MatAutocompleteModule,
    MatPaginator
  ],
  templateUrl: './purchase-details.component.html',
  styleUrl: './purchase-details.component.scss',
})
export class PurchaseDetailsComponent {
  invoiceToggle = localStorage.getItem('invoiceToggle') === 'true';
  lstPurchase: any[] = [];
  pendingPurchase: any[] = [];
  allPurchases: any[] = []; // master list
  authenticatedUser: AuthenticatedUser | null = null;
  invoiceOptions: string[] = [];
  invoiceOptionsFiltered: string[] = [];
  invoiceSearch: string = '';
  lstWarehouses: any[] = [];
  totalItems: number = 0;
  activeTabIndex: number = 0;
  unitPrice: number = 0;
  bergerTotalPurchaseAmount: number = 0;
  private invoiceWarehouseAutoApplied = new Set<string>();

  model: PurchaseDetails = new PurchaseDetails();
  searchReq: SearchRequest = new SearchRequest();
  timer: any;

  constructor(
    private router: Router,
    private orderService: OrderService,
    private purchaseDetailsService: PurchaseDetailsService,
    private settingsService: SettingsService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog
  ) { }

  toInt(value: any): number {
    const n = Number(value);
    return Math.max(0, Number.isFinite(n) ? Math.trunc(n) : 0);
  }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchReq.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.getAllpurchaseList(this.searchReq);

    this.lstPurchase.forEach(row => {
      if (!row.receivedQuantity && row.receivedQuantity !== 0) {
        row.receivedQuantity = row.actualBilledQuantity;
      }
    });

    this.getAllWarehouse({ tenantId: this.authenticatedUser?.tenantId });
  }
  calculateRemainingQty(actQty: number, recQty: number) {
    var a = actQty - recQty;
    return actQty - recQty;
  }
  onToggleChange() {
    localStorage.setItem('invoiceToggle', String(this.invoiceToggle));
    const route = this.invoiceToggle ? 'purchase-details' : 'purchase';
    console.log('invoiceToggle=', this.invoiceToggle, 'navigating to', route);
    this.router.navigate([route]);
  }

// Remember the value before editing so we can put it back if the user cancels
onUnitPriceFocus(row: any) {
  row.previousUnitPrice = row.unitPrice;
}

unitCalculation(row: any) {
  const unitPrice = Number(row.unitPrice || 0);
  const invoiceAmount = Number(row.invoiceAmount || 0);

  // Unit price above the invoice amount is unusual - ask before accepting it
  if (invoiceAmount > 0 && unitPrice > invoiceAmount) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Unit Price Too High';
    dialogRef.componentInstance.message =
      `Unit price (${unitPrice}) is greater than the invoice amount (${invoiceAmount}). Are you sure?`;

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.applyUnitCalculation(row);
      } else {
        row.unitPrice = row.previousUnitPrice ?? 0;
        this.applyUnitCalculation(row);
      }
    });
    return;
  }

  this.applyUnitCalculation(row);
}

private applyUnitCalculation(row: any) {
  const unitPrice = Number(row.unitPrice || 0);
  const invoiceQty = Number(row.actualBilledQuantity || 0);

  // Unit Price × Invoice Quantity
  row.bergerPurchaseAmount = unitPrice * invoiceQty;

  // Recalculate total for this invoice
  this.calculateBergerTotalPurchaseAmount(row);

  console.log('Unit Price:', unitPrice);
  console.log('Invoice Qty:', invoiceQty);
  console.log('Purchase Amount:', row.bergerPurchaseAmount);
}
  onTabChange(event: MatTabChangeEvent) {
    debugger
    this.activeTabIndex = event.index; // Track current tab
    this.searchReq.pageSize = 10;
    this.searchReq.pageIndex = 1; // Reset to first page

    if (event.index === 0) {
      this.getAllpurchaseList(this.searchReq);
    } else if (event.index === 1) {
      this.searchReq.isCompleted = false;
      this.searchReq.IsCustomerRecieved = true;
      this.getAllpendingpurchaseDetails(this.searchReq);
    } else {
      this.searchReq.isCompleted = true;
      this.searchReq.IsCustomerRecieved = true;
      this.getAllpendingpurchaseDetails(this.searchReq);
    }
  }

  // Update onPageChange to use the active tab
  onPageChange(event: any) {
    debugger
    this.searchReq.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;

    // Call appropriate method based on active tab
    if (this.activeTabIndex === 0) {
      this.getAllpurchaseList(this.searchReq);
    } else if (this.activeTabIndex === 1) {
      this.searchReq.isCompleted = false;
      this.getAllpendingpurchaseDetails(this.searchReq);
    } else {
      this.searchReq.isCompleted = true;
      this.getAllpendingpurchaseDetails(this.searchReq);
    }
  }
  completePurchase(row: any, pd: any) {
    debugger
    pd.invoiceQty = pd.remainingQty;
    pd.remainingQty = 0;
    console.log(pd);
    this.completeRemainingpurchase(row);
  }

  getAllpendingpurchaseDetails(filter: any) {
    debugger
    const pendingFilter: any = {
      tenantId: filter.tenantId,
      pageSize: filter.pageSize,
      pageIndex: filter.pageIndex,
      searchText: filter.searchText,
      isCompleted: filter.isCompleted
    };
    this.purchaseDetailsService.fetchAllPendingPurchaseDetails(pendingFilter).subscribe(
      (res: any) => {
        this.pendingPurchase = res.result;

      });
  }



  getAllpurchaseList(filter: any) {
    filter.IsCustomerRecieved = false;

    this.purchaseDetailsService.fetchAllPurchaseDetails(filter).subscribe(
      (res: any) => {
        console.log('InvoiceDetailsFromSAPData response:', res);
        debugger
        // Support both ApiResponse wrapper and plain payload
        const payload = res?.result ?? res ?? [];
        this.totalItems = Number(res.totalCount ?? (payload[0]?.totalCount) ?? payload.length);
        // Flatten payload into details array
        let details: any[] = [];
        if (Array.isArray(payload)) {
          // Array of invoices
          details = payload.flatMap((invoice: any) => {
            const hdrDoc = invoice?.billingDocument ?? '';
            const hdrDate = invoice?.billingDate ?? null;
            const items = Array.isArray(invoice?.sapSalesDetails)
              ? invoice.sapSalesDetails
              : [];
            return items.map((item: any) => ({
              ...item,
              _hdrDoc: hdrDoc,
              _hdrDate: hdrDate,
            }));
          });
        } else if (payload?.sapSalesDetails) {
          // Single invoice object
          details = (payload.sapSalesDetails ?? []).map((item: any) => ({
            ...item,
            _hdrDoc: payload.billingDocument ?? '',
            _hdrDate: payload.billingDate ?? null,
          }));
        }

        // Group by invoice to calculate totalAmount per invoice
        const invoiceMap = new Map<string, any[]>();
        details.forEach((d) => {
          const invoice = d._hdrDoc ?? 'NA';
          if (!invoiceMap.has(invoice)) invoiceMap.set(invoice, []);
          invoiceMap.get(invoice)?.push(d);
        });

        const rows: any[] = [];

        invoiceMap.forEach((items, billingDocument) => {
          const billingDate = items[0]._hdrDate ?? null;

          // Calculate total amount for this invoice
          const totalAmount = items.reduce((sum, item) => {
            const n = Number(item.invoiceAmount ?? 0);
            return sum + (Number.isFinite(n) ? n : 0);
          }, 0);

          items.forEach((item, index) => {
            const qtyNum = Number(item.actualBilledQuantity ?? 0);
            const actualQty = Number.isFinite(qtyNum) ? Math.trunc(qtyNum) : 0;

            rows.push({
              billingDocument,
              billingDate,
              materialNumber: item.materialNumber ?? '',
              itemId: item.itemId ?? '',
              materialDescription: item.materialDescription ?? '',
              actualBilledQuantity: actualQty,
              invoiceAmount: Number(item.invoiceAmount ?? 0),
              // Initially same as invoice amount
              bergerPurchaseAmount: Number(item.invoiceAmount ?? 0),

              totalAmount, // ← invoice-based total
              receivedQuantity: actualQty, // Default to invoice quantity, user can change
              remainingQuantity: 0, // Since received = billed by default
              warehouseId: null as number | null,

               bergerTotalPurchaseAmount: Number(totalAmount.toFixed(2)),
               paidAmount: Number(totalAmount.toFixed(2)),
              _showInvoiceCell: index === 0, // show invoice info on first row
              _rowspanInvoice: items.length,  // rowspan count
            });
          });
        });

        this.lstPurchase = rows;
        this.allPurchases = [...rows];

        // Setup invoice search options
        const invoices = rows.map((r) => r.billingDocument).filter(Boolean);
        this.invoiceOptions = Array.from(new Set(invoices));
        this.invoiceOptionsFiltered = [...this.invoiceOptions];
        console.log('Mapped purchase rows with invoice totals:', this.lstPurchase);
      },
      (err: any) => {
        this.lstPurchase = [];
        this.allPurchases = [];
        this.invoiceOptions = [];
        this.invoiceOptionsFiltered = [];
        this.messagHelper.showMessage(500, 'Failed to load purchase details');
        console.error('InvoiceDetailsFromSAPData error', err);
      }
    );
  }

formatAmount(value: number): string {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
  calculateTotalInvoiceAmount(): number {
    return (this.lstPurchase ?? [])
      .reduce((sum: number, item: any) => {
        const n = Number(item.invoiceAmount);
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0);
  }


  // Update onInvoiceSelected() to fetch by invoice number
  onInvoiceSelected(value: string) {
    this.invoiceSearch = value || '';
    const filter = {
      tenantId: this.authenticatedUser?.tenantId,
      searchText: this.invoiceSearch,
    };
    this.getAllpurchaseList(filter);
  }

  onInvoiceSearchChange(event: any) {
    debugger
    this.invoiceSearch = event.target.value || '';
    this.searchReq.searchText = this.invoiceSearch;
    // this.getAllpurchaseList(this.searchReq);

    if (this.activeTabIndex === 0) {
      this.getAllpurchaseList(this.searchReq);
    } else if (this.activeTabIndex === 1) {
      this.searchReq.isCompleted = false;
      this.getAllpendingpurchaseDetails(this.searchReq);
    } else {
      this.searchReq.isCompleted = true;
      this.getAllpendingpurchaseDetails(this.searchReq);
    }

    // this.getAllpendingpurchaseDetails(this.searchReq);
  }
  private applyInvoiceRowspan(rows: any[]): any[] {
    const sorted = [...rows].sort((a: any, b: any) =>
      (a.billingDocument ?? '').localeCompare(b.billingDocument ?? '')
    );

    const groupCounts = new Map<string, number>();
    sorted.forEach((r: any) => {
      const key = r.billingDocument ?? '';
      if (key) groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
    });

    const seen = new Set<string>();
    sorted.forEach((r: any) => {
      const key = r.billingDocument ?? '';
      if (!key) {
        r._showInvoiceCell = true;
        r._rowspanInvoice = 1;
        return;
      }
      if (!seen.has(key)) {
        r._showInvoiceCell = true;
        r._rowspanInvoice = groupCounts.get(key) || 1;
        seen.add(key);
      } else {
        r._showInvoiceCell = false;
        r._rowspanInvoice = 0;
      }
    });

    return sorted;
  }

  onReceivedQuantityInput(row: any, raw: string) {
    row._receivedQuantityRaw = raw;
  }

  onReceivedQuantityCommit(row: any) {

    const raw = (row._receivedQuantityRaw ?? row.receivedQuantity ?? '')
      .toString()
      .trim();
    if (raw === '') {
      row.receivedQuantity = 0;
    } else {
      const n = Number(raw);
      if (isNaN(n)) {
        delete row._receivedQuantityRaw;
        return;
      }
      let receivedQty = Math.max(0, Math.floor(n));
      if (receivedQty > row.actualBilledQuantity)
        receivedQty = row.actualBilledQuantity;
      row.receivedQuantity = receivedQty;
    }
    row.remainingQuantity =
      Number(row.actualBilledQuantity ?? 0) - Number(row.receivedQuantity ?? 0);
    delete row._receivedQuantityRaw;
  }
  getRowStatus(row: any): string {
    const remaining = row.actualBilledQuantity - (row.receivedQuantity || 0);
    return remaining > 0 ? 'pending' : 'received';
  }

  onReceivepaidAmount(row: any) {

  }

  completeRemainingpurchase(payload: any) {
    debugger
    this.purchaseDetailsService.createPendingPurchase(payload).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.model.IsCustomerRecieved = true;
        this.getAllpurchaseList(this.searchReq);
        this.messagHelper.showMessage(res.statusCode, res.result);
      } else {
        this.messagHelper.showMessage(400, 'Invoice number is required.');
      }
    });
  }
  onWarehouseChange(selectedRow: any) {
    const selectedWarehouseId = selectedRow.warehouseId;
    const invoiceNo = selectedRow.billingDocument;

    if (!invoiceNo) return;

    // First warehouse selection for this invoice: apply to all rows
    if (!this.invoiceWarehouseAutoApplied.has(invoiceNo)) {
      this.lstPurchase.forEach((row: any) => {
        if (row.billingDocument === invoiceNo) {
          row.warehouseId = selectedWarehouseId;
        }
      });
      this.invoiceWarehouseAutoApplied.add(invoiceNo);
      return;
    }

    // After first time: only change the row user selected
    selectedRow.warehouseId = selectedWarehouseId;
  }

  onWarehouseChangeNew(selectedRow: any) {
    const selectedWarehouseId = selectedRow.warehouseId;
    const invoiceNo = selectedRow.billingDocument;
    const materialNumber = selectedRow.materialNumber;

    // Apply the selected warehouse to the row with the matching material number
    this.lstPurchase.forEach(row => {
      if (row.billingDocument === invoiceNo && row.materialNumber === materialNumber) {
        row.warehouseId = selectedWarehouseId;
      }
    });
  }

  getAllWarehouse(model: any) {
    this.settingsService
      .fetchAllWarehouses(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstWarehouses = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }



  openReceiveModal(selectedRows?: any | any[]) {
    debugger
    const rows = Array.isArray(selectedRows)
      ? selectedRows
      : selectedRows
        ? // single row clicked → include all items for the same invoice
        this.lstPurchase.filter(r => r.billingDocument === selectedRows.billingDocument)
        : // no arg → include all rows with a positive receivedQuantity
        this.lstPurchase.filter(r => Number(r.receivedQuantity ?? 0) > 0);

    if (!rows || rows.length === 0) {
      this.messagHelper.showMessage(400, 'No items selected to receive');
      return;
    }

    const firstInvoice = rows[0].billingDocument ?? '';
    const payload = {
      id: 0,
      recievedOrderId: '',
      recievedNo: firstInvoice,
      recievedDate: new Date().toISOString(),
      totalAmount: rows.reduce((s: number, r: any) => {
        const n = Number(r.invoiceAmount ?? 0);
        return s + (Number.isFinite(n) ? n : 0);
      }, 0),
      paidAmount: selectedRows.paidAmount || 0,
      discountAmount: 0,
      tax: 0,
      vat: 0,
      bergerTotalPurchaseAmount: this.bergerTotalPurchaseAmount || selectedRows.bergerTotalPurchaseAmount || 0,
      IsCustomerRecieved: true,
      requestOrderNo: firstInvoice,
      tenantId: this.authenticatedUser?.tenantId ?? 0,
      purchaseDetails: rows.map((r: any) => {
        const actual = Number(r.actualBilledQuantity ?? 0);
        const received = Number(r.receivedQuantity ?? 0);
        const invoiceAmt = Number(r.invoiceAmount ?? 0);
        return {
          id: 0,
          purchaseOrderMasterId: 0,
          purchaseOrderDetailId: r.purchaseOrderDetailId ?? r.billingItem ?? r.billingDocument,
          itemId: r.itemId,
          uomId: r.uomId ?? 0,
          warehouseId: r.warehouseId ?? 0,
          bergerPurchaseAmount: r.bergerPurchaseAmount ?? 0,
          supplierId: r.supplierId ?? 0,
          invoiceQty: actual,
          remainingQty: Math.max(0, actual - received),
          unitPrice: invoiceAmt / Math.max(1, actual),
          orderStatus: 'Received',
          totalAmount: invoiceAmt,
          purchaseDate: new Date().toISOString(),
          recievedDate: new Date().toISOString(),
        };
      }),
    };

    console.log('Payload:', payload);
    debugger
    // Validate that all items have a warehouse selected
    const hasNullWarehouse = payload.purchaseDetails?.some((detail: any) => detail.warehouseId == null || detail.warehouseId === 0);
    if (hasNullWarehouse) {
      this.messagHelper.showMessage(400, 'Please select a warehouse for all items before receiving.');
      return;
    }

    this.purchaseDetailsService.createPendingPurchase(payload).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.searchReq.IsCustomerRecieved = true;
        this.getAllpurchaseList(this.searchReq);
        this.messagHelper.showMessage(res.statusCode, res.result);
      } else {
        this.messagHelper.showMessage(400, 'Invoice number is required.');
      }
    });

    rows.forEach(r => {
      r._receivedQuantityRaw = String(r.receivedQuantity ?? '');
      this.onReceivedQuantityCommit(r);
    });

    this.messagHelper.showMessage(200, 'Received quantity updated');
  }

  get totalAmount(): number {
    return this.lstPurchase.reduce((sum, row) => sum + (row.invoiceAmount || 0), 0);
  }

//   calculateBergerTotalPurchaseAmount(row: any) {

//   const invoiceRows = this.lstPurchase.filter(
//     x => x.billingDocument === row.billingDocument
//   );

//   const totalPurchaseAmount = invoiceRows.reduce((sum, item) => {
//     return sum + Number(item.bergerPurchaseAmount || 0);
//   }, 0);

//   invoiceRows.forEach(item => {
//     item.bergerTotalPurchaseAmount = totalPurchaseAmount;
//     item.paidAmount = totalPurchaseAmount;
//   });
// }
calculateBergerTotalPurchaseAmount(row: any) {

  const invoiceRows = this.lstPurchase.filter(
    x => x.billingDocument === row.billingDocument
  );

  const totalPurchaseAmount = invoiceRows.reduce((sum, item) => {
    return sum + Number(item.bergerPurchaseAmount || 0);
  }, 0);

  invoiceRows.forEach(item => {
    item.bergerTotalPurchaseAmount = totalPurchaseAmount;
    item.paidAmount = totalPurchaseAmount;
  });
}
}
