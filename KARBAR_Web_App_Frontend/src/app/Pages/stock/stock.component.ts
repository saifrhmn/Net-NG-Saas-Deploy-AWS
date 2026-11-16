import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabChangeEvent, MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthenticatedUser, AuthenticationService } from '../../Services/auth.service';
import { RecordStatus } from '../../Common/Enum/appEnums';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { wareHouseTransfer } from '../../Model/wareHouseTransfer';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { ConfirmationDialogComponent } from '../../Common/Component/confirmation-dialog/confirmation-dialog.component';
import { Stocks  } from '../../Model/stock';
import { Settings } from '../../Model/settings';
import { Purchase } from '../../Model/purchase';
import { SettingsService } from '../../Services/settings.service';
import { StockService } from '../../Services/stock.service';
import { PurchaseService } from '../../Services/purchase.service';
import { SalesOrderService } from '../../Services/salesOrderService';
import { SalesOrder } from '../../Model/salesOrder';
import { ItemService } from '../../Services/item.service';
import { wareHouseTransefer } from '../../Services/wareHouseTransfer';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  templateUrl: './stock.component.html',
  styleUrl: './stock.component.scss',
})
export class StockComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | null = null; // don't initialize from this.authService here

  private originalPageSize: number = 10;
  includeZeroStock: boolean = false;
  displayStock: Stocks[] = [];
  lstStock: Stocks[] = [];
  lstWarehouse: Settings[] = [];
  lstPurchase: Purchase[] = [];
  lstSalesOrder: SalesOrder[] = [];
  lstItem: any[] = [];
  selectedWarehouse: any;
  searchText: string = '';
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  wareHouseTransferModel = new wareHouseTransfer();
  totalItems: number = 0;
  timer: any;
  filteredStock: any[] = [];
  stockIdfilter: number = 0;
  showRemarkModal = false;
  currentStockForSave: any = null;
  saving = false;
  totalCount: number = 0;
  itemControl: FormControl = new FormControl('');
  filteredItems$: Observable<any[]> = new Observable<any[]>();
  sortOption: string = 'alpha-asc';

  searchModel: Stocks = new Stocks();
  private lastFocusedElement: HTMLElement | null = null;
  showStockShiftModal: boolean = false;

  pagedDisplayStock: Stocks[] = [];
  fullListFetched: boolean = false;

  editValue: any = null;
  editMode: boolean = false;
  editingCell: { row: number; col: number | null } | null = null;
  private pendingUpdates = new Map<number, Map<number, number>>();



  constructor(
    private settingsService: SettingsService,
    private stockService: StockService,
    private wareHouseTransefer: wareHouseTransefer,
    private purchaseService: PurchaseService,
    private salesOrderService: SalesOrderService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private itemService: ItemService,
    private bottomSheet: MatBottomSheet
  ) {}

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchModel.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);
    this.getAllItems(this.searchReq);
    this.getAllWarehouse(this.searchReq);
    this.getAllStocks(this.searchReq);
    this.getAllpurchaseList(this.searchReq);
    this.searchReq.IsDraft = false;
    this.searchReq.IsReturn = false;
    this.getAllSellList(this.searchReq);

    // this.searchReq.pageSize = 20000;
    this.filteredItems$ = this.itemControl.valueChanges.pipe(
  startWith(''),
  map(value => {
    const filter = (typeof value === 'string') ? value.toLowerCase() : (value?.name ?? '').toLowerCase();
    return (this.lstItem ?? []).filter((i: any) => (i.name ?? '').toLowerCase().includes(filter));
  })
);
  }
displayItem(item: any): string {
  return item ? item.name : '';
}

onItemSelected(event: any) {
  const sel = event.option?.value;
  this.wareHouseTransferModel.itemId = sel?.id ?? sel ?? null;
}

  private openModalAndTrapFocus() {
    this.lastFocusedElement = document.activeElement as HTMLElement;

    document.body.classList.add('modal-open');

    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  
onSortChange(value: string) {
  this.sortOption = value;
  this.sortStock();
  this.searchReq.pageIndex = 1;
  this.applyStockFilter();
}

sortStock() {
  if (!this.lstStock || !Array.isArray(this.lstStock)) return;

  switch (this.sortOption) {
    case 'alpha-asc':
      this.lstStock.sort((a, b) => (a.itemName || '').localeCompare(b.itemName || ''));
      break;
    case 'alpha-desc':
      this.lstStock.sort((a, b) => (b.itemName || '').localeCompare(a.itemName || ''));
      break;
    case 'low-stock':
      this.lstStock.sort((a, b) => (this.getRowTotal(a) || 0) - (this.getRowTotal(b) || 0));
      break;
    case 'high-stock':
      this.lstStock.sort((a, b) => (this.getRowTotal(b) || 0) - (this.getRowTotal(a) || 0));
      break;
    case 'safety-stock':
      // Highest safety stock (lowStock) first; ties -> lower current stock first
      this.lstStock.sort((a: any, b: any) =>
        (Number(b.lowStock) || 0) - (Number(a.lowStock) || 0) ||
        (this.getRowTotal(a) || 0) - (this.getRowTotal(b) || 0)
      );
      break;
    default:
      break;
  }
}
  onTabChange(event: MatTabChangeEvent) {
    const tabLabel = event.tab.textLabel;
    // if (tabLabel === 'UOM') {
    if (tabLabel === 'Current Stock') {
      this.cancelEdit();
      // this.getAllUOM(this.searchReq);
    }
    // else if (tabLabel === 'WareHouse') {
    else if (tabLabel === 'Stock Return') {
      this.cancelEdit();
      // this.getAllWarehouse(this.searchReq);
    }
  }

  // ensureWarehouseArray(stock: any) {
  //   const targetLen = (this.lstWarehouse ?? []).length;
  //   stock.warehouse = Array.from({ length: targetLen }, (_, i) => {
  //     const existing = stock.warehouse?.[i];
  //     return existing
  //       ? {
  //           ...existing,
  //           itemQty: Number(existing.itemQty ?? existing.quantity ?? 0),
  //         }
  //       : { stockId: 0, itemQty: 0, quantity: 0 };
  //   });
  // }

  // ensure each column maps to a warehouseId and preserves existing cell values (including stockId)
  ensureWarehouseArray(stock: any) {
    const targetLen = (this.lstWarehouse ?? []).length;
    // keep any existing warehouse array but normalise length and metadata
    const raw = stock.warehouse ?? [];
    stock.warehouse = Array.from({ length: targetLen }, (_, i) => {
      // prefer an existing entry that matches the target warehouseId
      const warehouseId = Number(this.lstWarehouse?.[i]?.id ?? raw?.[i]?.warehouseId ?? 0);
      const existingById = raw.find((w: any) => Number(w.warehouseId) === warehouseId);
      const existingAtIndex = raw?.[i];
      const existing = existingById ?? existingAtIndex;

      if (existing) {
        return {
          ...existing,
          warehouseId,
          stockId: Number(existing.stockId ?? 0),
          itemQty: Number(existing.itemQty ?? existing.quantity ?? 0),
          quantity: Number(existing.quantity ?? existing.itemQty ?? 0),
        };
      }

      return { stockId: 0, warehouseId, itemQty: 0, quantity: 0 };
    });
  }

saveRow(stock: any) {
  debugger
  // ensure mapping exists so column indices align with lstWarehouse
  this.ensureWarehouseArray(stock);

  const staged = this.pendingUpdates.get(stock.itemId);
  if (!staged || staged.size === 0) return;

  const warehousePayload = Array.from(staged.entries()).map(([colIndex, qty]) => {
    // Map column index to real warehouse id (prefer lstWarehouse mapping)
    const cell = stock.warehouse?.[colIndex] ?? {};
    const whMeta = this.lstWarehouse?.[colIndex];
    const warehouseId = Number(whMeta?.id ?? cell?.warehouseId ?? 0);

    // Use the per-column cell's stockId (ensureWarehouseArray aligns existing entries by warehouseId)
    const stockId = Number(cell?.stockId ?? 0);

    return {
      stockId,
      warehouseId,
      quantity: Number(qty ?? 0),
    };
  });

  debugger

  const payload = {
    itemId: Number(stock.itemId),
    tenantId: Number(this.searchModel?.tenantId ?? 0),
    warehouse: warehousePayload,
    remarks: stock?.remarks ?? '',
  };

  this.stockService.createStock(payload).subscribe({
    next: (res) => {
      // If backend returned updated warehouse rows (with stockId), merge them into the row
      if (res && res.result && Array.isArray(res.result.warehouse) && res.result.warehouse.length > 0) {
        const updated: any[] = res.result.warehouse;
        stock.warehouse = stock.warehouse ?? [];

         this.cancelEdit();
        this.editMode = false;
        this.editValue = null;

        updated.forEach((w: any) => {
          const whId = Number(w.warehouseId ?? w.whId ?? 0);
          // find column index by lstWarehouse mapping
          const idx = (this.lstWarehouse ?? []).findIndex(lw => Number(lw.id) === whId);
          if (idx >= 0) {
            stock.warehouse[idx] = {
              ...(stock.warehouse[idx] ?? {}),
              warehouseId: whId,
              stockId: Number(w.stockId ?? this.stockIdfilter),
              itemQty: Number(w.quantity ?? w.itemQty ?? stock.warehouse[idx]?.itemQty ?? 0),
              quantity: Number(w.quantity ?? w.itemQty ?? stock.warehouse[idx]?.quantity ?? 0),
            };
          }
        });

        // Clear staged changes for this row and exit edit state
        this.pendingUpdates.delete(stock.itemId);
        this.cancelEdit();
        this.editMode = false;
        this.editValue = null;
      } else {
        // Fallback: refresh whole list to get server-assigned ids
        this.pendingUpdates.delete(stock.itemId);
        this.cancelEdit();
        this.editMode = false;
        this.editValue = null;
        this.getAllStocks(this.searchReq);
      }
    },
    error: (err) => console.error('Update stock failed', err),
  });
}
  // getQtyByIndex(stock: any, idx: number): number {
  //   debugger
  //   const row = stock?.warehouse?.[idx];
  //   return Number(row?.itemQty  ?? 0);
  //   // return Number(row?.itemQty ?? row?.quantity ?? 0);
  // }

  getQtyByIndex(stock: any, idx: number): number {
    const wh = this.lstWarehouse[idx];
    if (!wh || !stock?.warehouse) return 0;
  
    const targetId = Number(wh.id);
  
    const match = stock.warehouse.find((w: any) =>
        Number(w.warehouseId) === targetId
    );
  
    return Number(match?.itemQty ?? match?.quantity ?? 0);
  }
  

  // getQtyByIndex(stock: any, idx: number): number {
  //   if (!stock?.warehouse || !Array.isArray(stock.warehouse)) {
  //     return 0;
  //   }
    
  //   const row = stock.warehouse[idx];
  //   if (!row) {
  //     return 0;
  //   }
  
  //   // Parse the value to ensure it's treated as a number
  //   const qty = parseFloat(row.itemQty) || parseFloat(row.quantity) || 0;
  //   return qty;
  // }
  getRowTotal(stock: any): number {
    return (stock?.warehouse ?? []).reduce(
      (sum: number, w: any) => sum + Number(w.itemQty ?? w.quantity ?? 0),
      0
    );
  }
  toggleEditMode() {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.cancelEdit(); // exit any single-cell edit state
    }
  }

  enableEdit(rowIndex: number, colIndex: number, currentQty: number) {
    this.editingCell = { row: rowIndex, col: colIndex };
    this.editValue = Math.max(0, currentQty ?? 0);
    setTimeout(
      () => document.querySelector<HTMLInputElement>('.inline-input')?.focus(),
      0
    );
  }

  cancelEdit() {
    this.editingCell = null;
    this.editValue = null;
  }

  onQtyKeydown(event: KeyboardEvent) {
    // Block invalid number keys
    if (['-', '+', 'e', 'E'].includes(event.key)) {
      event.preventDefault();
      return;
    }

    // Tab key: save current cell and move to next
    if (event.key === 'Tab' && this.editingCell) {
      event.preventDefault();

      const currentRow = this.editingCell.row;
      const currentCol = this.editingCell.col ?? 0;
      const maxCol = this.lstWarehouse.length - 1;
      const maxRow = this.lstStock.length - 1;

      // Save current value first
      const stock = this.lstStock[currentRow];
      this.saveQty(currentRow, stock, currentCol);

      // Calculate next position
      let nextRow = currentRow;
      let nextCol = currentCol;

      if (event.shiftKey) {
        // Shift+Tab: move backward
        if (currentCol > 0) {
          nextCol = currentCol - 1;
        } else if (currentRow > 0) {
          nextRow = currentRow - 1;
          nextCol = maxCol;
        }
      } else {
        // Tab: move forward
        if (currentCol < maxCol) {
          nextCol = currentCol + 1;
        } else if (currentRow < maxRow) {
          nextRow = currentRow + 1;
          nextCol = 0;
        }
      }

      // Open next cell for editing
      if (nextRow !== currentRow || nextCol !== currentCol) {
        const nextStock = this.lstStock[nextRow];
        const nextQty = this.getQtyByIndex(nextStock, nextCol);
        this.enableEdit(nextRow, nextCol, nextQty);
      }
    }
  }

  onQtyInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const n = el.valueAsNumber;
    if (isNaN(n) || n < 0) {
      el.value = '0';
      this.editValue = 0;
    } else {
      this.editValue = n;
    }
  }

onQtyChange(value: any, rowIndex: number, stock: any, colIndex: number) {
  debugger
  const qty = Math.max(0, Number(value || 0));
  this.stockIdfilter = stock.warehouse[0].stockId;

  // Normalize the warehouse array so each column has an object with warehouseId and stockId
  this.ensureWarehouseArray(stock);

  // Defensive: make sure the specific cell exists
  stock.warehouse = stock.warehouse ?? [];
  stock.warehouse[colIndex] = stock.warehouse[colIndex] ?? {
    stockId: this.stockIdfilter,
    warehouseId: Number(this.lstWarehouse?.[colIndex]?.id ?? 0),
    itemQty: 0,
    quantity: 0,
  };

  // preserve any existing stockId on the cell
  const cell = stock.warehouse[colIndex];

  if (this.editMode) {
    cell.itemQty = qty;
    cell.quantity = qty;

    const key = Number(stock.itemId ?? stock.id ?? rowIndex);
    if (!this.pendingUpdates.has(key)) {
      this.pendingUpdates.set(key, new Map<number, number>());
    }
    this.pendingUpdates.get(key)!.set(colIndex, qty);
  } else {
    this.editValue = qty;
  }
}

  saveQty(rowIndex: number, stock: any, colIndex: number) {
    debugger
    // in bulk mode we already staged changes on each keystroke
    if (this.editMode) return;
    if (
      !this.editingCell ||
      this.editingCell.row !== rowIndex ||
      this.editingCell.col !== colIndex
    )
      return;

    const qty = Math.max(0, Number(this.editValue ?? 0));
    stock.warehouse[colIndex].itemQty = qty;
    stock.warehouse[colIndex].quantity = qty;
    stock.warehouse[colIndex].stockId = this.stockIdfilter;

    if (!this.pendingUpdates.has(stock.itemId)) {
      this.pendingUpdates.set(stock.itemId, new Map());
    }
    this.pendingUpdates.get(stock.itemId)!.set(colIndex, qty);

    this.cancelEdit();
  }
  hasPending(stock: any): boolean {
    const m = this.pendingUpdates.get(stock.itemId);
    return !!m && m.size > 0;
  }

 
  getRowStatusClass(stock: any): string | null {
    debugger;
    console.log('lowStock:', stock.lowStock, 'total:', this.getRowTotal(stock));
    const total = this.getRowTotal(stock);
    if (total < stock.lowStock) return 'danger-row';
    if (total < stock.lowStock + 10) return 'warning-row';
    return null;
  }

  resetForm() {
    this.searchModel = new Stocks();
    this.searchModel.tenantId = this.authenticatedUser?.tenantId ?? 0;
  }

  getAllStocks(model: any) {
  this.stockService.fetchAllStocks(model).subscribe((res: ApiResponse) => {
    if (res.isSuccess) {
      this.lstStock = Array.isArray(res.result) ? res.result : [];
      this.sortStock();

      this.applyStockFilter();
      // Use API total; fallback to possible row-level total or current page length
      this.totalItems = Number(
        res.totalCount ??
        (this.lstStock[0] as any)?.totalCount ??
        this.lstStock.length
      );
      // Keep 1-based pageIndex for the backend
      this.searchReq.pageIndex = Number(model.pageIndex || this.searchReq.pageIndex || 1);
    } else {
      if (res.errorMessage?.length) {
        res.errorMessage.forEach(msg => this.messagHelper.showMessage(res.statusCode, msg));
      }
    }
  });
}

updateStock(model: Stocks) {
  debugger
  // model.itemId = this.lstStock.find((s) => s.id === model.id)?.itemId ?? 0;
  model.id = model.stockId ? (model.stockId as unknown as number) : 0;
  model.remarks = this.searchModel.remarks;
  model.tenantId = this.authenticatedUser?.tenantId ?? 0;

  // Build a lookup of incoming quantities by warehouseId (from the UI payload)
  const incoming = Array.isArray(model.warehouse) ? model.warehouse : [];
  const qtyMap = new Map<number, number>();
  incoming.forEach((w: any) => {
    const wid = Number(w.warehouseId ?? w.whId ?? 0);
    const q = (w.quantity !== undefined && w.quantity !== null && w.quantity !== '') ? Number(w.quantity) : Number(w.itemQty ?? 0);
    qtyMap.set(wid, q);
  });

  // Normalize/align entries to the current lstWarehouse ordering and preserve any existing stockId
  const targetLen = (this.lstWarehouse ?? []).length;
  const existingRow = this.lstStock.find(s => Number(s.itemId) === Number(model.itemId) || Number(s.id) === Number(model.id));
  const raw = existingRow?.warehouse ?? incoming ?? [];

  const normalized = Array.from({ length: targetLen }, (_, i) => {
    const warehouseId = Number(this.lstWarehouse?.[i]?.id ?? raw?.[i]?.warehouseId ?? 0);
    const existingById = raw.find((w: any) => Number(w.warehouseId) === warehouseId);
    const existingAtIndex = raw?.[i];
    const existing = existingById ?? existingAtIndex;

    const existingQty = Number(existing?.itemQty ?? existing?.quantity ?? 0);
    const quantity = qtyMap.has(warehouseId) ? Number(qtyMap.get(warehouseId)) : existingQty;

    return {
      stockId: Number(existing?.stockId ?? 0),
      warehouseId,
      itemQty: quantity,
      quantity
    };
  });

  // Decide a common stockId: prefer any non-zero stockId found, else fallback to stockIdfilter, else 0
  const foundStockId = normalized.find(w => Number(w.stockId) > 0)?.stockId
    ?? (existingRow?.warehouse?.find((w: any) => Number(w.stockId) > 0)?.stockId)
    ?? this.stockIdfilter ?? 0;
  const commonStockId = Number(foundStockId ?? 0);

  // Ensure every entry has a stockId (use commonStockId when missing)
  model.warehouse = normalized.map(w => ({
    ...w,
    stockId: Number(w.stockId && Number(w.stockId) > 0 ? w.stockId : commonStockId)
  }));
  debugger
  this.stockService.createStock(model).subscribe((res: ApiResponse) => {
    if (res.isSuccess) {
      this.messagHelper.showMessage(res.statusCode, res.result);
      this.cancelEdit();
      this.getAllStocks(this.searchReq);
      this.showRemarkModal = false;
    } else {
      if (res.errorMessage && res.errorMessage.length > 0) {
        res.errorMessage.forEach((msg) =>
          this.messagHelper.showMessage(res.statusCode, msg)
        );
      }
    }
  });
}

  getAllWarehouse(model: any) {
    this.settingsService
      .fetchAllWarehouses(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstWarehouse = res.result;
          this.selectedWarehouse = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) =>
              this.messagHelper.showMessage(res.statusCode, msg)
            );
          }
        }
      });
  }

  onModalKeydown(event: KeyboardEvent) {
    // if (event.key === 'Escape') {
    //   this.closeStockModal();
    //   return;
    // }

    if (event.key === 'Tab') {
      const modalElement = (event.target as HTMLElement).closest(
        '.modal-container'
      );
      if (!modalElement) return;

      const focusableElements = modalElement.querySelectorAll<HTMLElement>(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  onSearch(event: any) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.target.value;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllStocks(this.searchReq);
    }, 500);
  }

  // onPageChange(event: any) {
  //   debugger
  //   this.searchReq.pageSize = event.pageSize;
  //   this.searchReq.pageIndex = event.pageIndex + 1;
  //   this.getAllStocks(this.searchReq);
  // }

  
  getAllpurchaseList(filter: any) {
    this.purchaseService
      .fetchAllPurchase(filter)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstPurchase = res.result;
        } else {
          this.lstPurchase = [];
        }
      });
  }
getAllSellList(filter: any) {
    this.salesOrderService
      .fetchAllSalesOrder(filter)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstSalesOrder = res.result;
        } else {
          this.lstSalesOrder = [];
        }
      });
  }

  // Open modal when user clicks Save button
  openRemarkModal(stock: any) {
    this.currentStockForSave = stock;
    this.searchModel.remarks = stock.remarks ?? '';
    this.showRemarkModal = true;
    // focus/UX: optionally focus textarea after view updates
    setTimeout(() => {
      const el = document.querySelector(
        '.modal-container textarea'
      ) as HTMLTextAreaElement | null;
      el?.focus();
    }, 50);
  }
  opentockShiftModal() {
    // this.isEditMode = false;
    // this.resetCustomerForm();
    this.showStockShiftModal = true;
    debugger
    this.searchReq.pageSize = this.totalCount;
    this.getAllItems(this.searchReq);
    this.openModalAndTrapFocus();
  }
  closeStockShiftModal() {
    this.showStockShiftModal = false;
    this.searchReq.pageSize = 10;
    // this.resetCustomerForm();

    document.body.classList.remove('modal-open');

    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
      }, 100);
    }
  }
    openNavigationSheet() {
    const ref = this.bottomSheet.open(BottomSheetComponent, {
      data: {
        isPageNavigation: true,
        label: 'Navigate to Page',
        placeholder: 'Type page name (e.g., purchase, order, users)',
      },
    });

    ref.afterDismissed().subscribe((result: any) => {
    });
  }
  // Called when user confirms remark + save
  async confirmSave() {
    if (!this.currentStockForSave) return;
    this.saving = true;

    // attach remark to the row so backend/save logic can use it
    this.currentStockForSave.pendingRemark = this.searchModel.remarks?.trim();

    try {
      await this.performSaveRow(this.currentStockForSave);
    } finally {
      this.saving = false;
      this.showRemarkModal = false;
      this.searchModel.remarks = '';
      this.currentStockForSave = null;
    }
  }

  // Cancel modal
  cancelRemark() {
    this.showRemarkModal = false;
    this.searchModel.remarks = '';
    this.currentStockForSave = null;
  }
  performSaveRow(stock: any): Promise<void> {
    return new Promise((resolve) => {
      console.log('Saving stock with remark:', stock.pendingRemark, stock);
      setTimeout(resolve, 400);
    });
  }

  getAllItems(model: any) {
    this.itemService.fetchAllItems(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstItem = res.result;
         this.totalCount = res.totalCount ?? 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }
 
editStock(model: any) {
  // ensure model reference is the component's model (keep passed model for clarity)
  const payload = this.wareHouseTransferModel ?? model ?? {};

  // attach tenant
  payload.tenantId = Number(this.authenticatedUser?.tenantId ?? 0);

  this.wareHouseTransefer.wareHouseTransfer(payload).subscribe((res: ApiResponse) => {
    if (res.isSuccess) {
      this.messagHelper.showMessage(res.statusCode, res.result);
      this.getAllStocks(this.searchReq);
      this.closeStockShiftModal();

      // clear the form model so inputs are emptied
      this.wareHouseTransferModel = {
        itemId: null,
        fromWarehouseId: null,
        toWarehouseId: null,
        changedQty: null,
        tenantId: null
      } as any;

      // optional: clear any local edit state
      this.editingCell = null;
      this.currentStockForSave = null;
    } else {
      if (res.errorMessage && res.errorMessage.length > 0) {
        res.errorMessage.forEach((msg: string) => this.messagHelper.showMessage(res.statusCode, msg));
      }
    }
  }, (err) => {
    // network / unexpected error
    this.messagHelper.showMessage(500, 'Failed to shift stock');
  });
}

// applyStockFilter(): void {
//   if (!this.includeZeroStock) {
//     // unchecked → show all

//     this.displayStock = this.lstStock ?? [];
//     // this.getAllStocks(this.searchReq);
//   } else {
//     // checked → exclude zero stock
//     this.displayStock = (this.lstStock ?? []).filter(
//       s => this.getRowTotal(s) > 0
//     );
//   }

//   this.totalItems = this.displayStock.length;
// }

applyStockFilter(): void {
  debugger
  if (!Array.isArray(this.lstStock)) this.lstStock = [];

  this.displayStock = this.includeZeroStock
    ? (this.lstStock ?? []).filter(s => this.getRowTotal(s) > 0)
    : (this.lstStock ?? []).slice();

  // Safety Stock: show only items whose total stock equals their lowStock
  if (this.sortOption === 'safety-stock') {
    this.displayStock = this.displayStock.filter(
      (s: any) => this.getRowTotal(s) === (Number(s.lowStock) || 0)
    );
  }

  this.totalItems = this.displayStock.length;

  // Ensure pageIndex is valid
  if (!this.searchReq.pageIndex || this.searchReq.pageIndex < 1) this.searchReq.pageIndex = 1;

  this.applyPaging();
}

// applyPaging(): void {
//   debugger
//   const pageSize = Number(this.searchReq.pageSize) || 10;
//   const pageIndex = Number(this.searchReq.pageIndex) || 1;
//   const start = (pageIndex - 1) * pageSize;
//   this.pagedDisplayStock = (this.displayStock || []);
//   // this.pagedDisplayStock = (this.displayStock || []).slice(start, start + pageSize);
// }

applyPaging(): void {
  const pageSize = Number(this.searchReq.pageSize) || 10;
  const pageIndex = Number(this.searchReq.pageIndex) || 1;
  const start = (pageIndex - 1) * pageSize;
  this.pagedDisplayStock = (this.displayStock || []);
  // this.pagedDisplayStock = (this.displayStock || []).slice(start, start + pageSize);
}

// onIncludeZeroToggle(event:any): void {
//   this.includeZeroStock = event.target.checked;
  
//   // Go back to page 1 to avoid empty pages after filtering
//   this.searchReq.pageIndex = 1;
  
//   // When filtering out zero stock, show all items at once (no pagination)
//   if (this.includeZeroStock) {
//     this.searchReq.pageSize = 999999; // Large number to show all items
//   } else {
//     this.searchReq.pageSize = 10; // Reset to default page size
//   }
  
//   this.applyStockFilter();
// }

// onIncludeZeroToggle(event: any): void {
//   this.includeZeroStock = event.target.checked;
//   this.searchReq.pageIndex = 1;
  
//   if (this.includeZeroStock) {
//     // Store original page size and fetch all items once
//     this.originalPageSize = this.searchReq.pageSize;
//     this.searchReq.pageSize = 999999; // Fetch all at once
//     this.getAllStocks(this.searchReq); // This will set lstStock with all items
//   } else {
//     // Restore normal pagination
//     this.searchReq.pageSize = this.originalPageSize;
//     this.getAllStocks(this.searchReq);
//   }
// }

onIncludeZeroToggle(event: any): void {
  this.includeZeroStock = event.target.checked;
  this.searchReq.pageIndex = 1;
  
  if (this.includeZeroStock) {
    // Store original page size and fetch all items once
    this.originalPageSize = this.searchReq.pageSize;
    this.searchReq.pageSize = null; // Fetch all at once
    this.getAllStocks(this.searchReq); // This will set lstStock with all items
  } else {
    // Restore normal pagination
    this.searchReq.pageSize = this.originalPageSize;
    this.getAllStocks(this.searchReq);
  }
}

onPageChange(event: any) {
  if (this.includeZeroStock) {
    // Filter is active: paginate client-side on already-fetched data
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.searchReq.pageSize = event.pageSize;
    this.applyPaging(); // Just paginate the existing filtered data
  } else {
    // Normal API pagination
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllStocks(this.searchReq);
  }
}

}
