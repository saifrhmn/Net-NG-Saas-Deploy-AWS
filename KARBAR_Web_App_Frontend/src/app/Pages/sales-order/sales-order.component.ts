import { Component, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Import MatCheckboxModule
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { Customer } from '../../Model/customer';
import { CustomerService } from '../../Services/customer.service';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import * as appEnums from '../../Common/Enum/appEnums';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ApiResponse } from '../../Model/VM/apiResponse';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../Services/auth.service';
import { SettingsService } from '../../Services/settings.service';
import { Settings } from '../../Model/settings';
import { ItemService } from '../../Services/item.service';
import { MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { SalesOrder, SalesOrderDetail } from '../../Model/salesOrder';
import { SalesOrderService } from '../../Services/salesOrderService';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';
import { UserService } from '../../Services/user.service';
import { User } from '../../Model/user';
import { MatDialog } from '@angular/material/dialog';
import { NumberToWordsPipe } from '../../Common/Pipes/number-to-words.pipe';



export interface SummaryItem {
  itemId?: number;
  name: string;
  quantity: number;
  mrp: number;
  sellingPrice: number;
  availableStock: number;
  weightedPrice: number;
  // purchasePrice: number;
  warehouseId?: number;
}

@Component({
  selector: 'app-sales-order',
  standalone: true,
  imports: [
    MatCheckboxModule,
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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    NumberToWordsPipe
  ],
  templateUrl: './sales-order.component.html',
  styleUrl: './sales-order.component.scss',
})
export class SalesOrderComponent {
  [x: string]: any;
  selectedSupplier: string = '';
  public math = Math;
  selectedPaymentMethod: number = 1;
  isEditMode: boolean = false;
  check: number = 0;
  remarks: string = '';
  CBremarks: string = '';
  salesReturnModel: any = {};
  selectedReturnRow: any = null; // Track which row is being returned
  customerExist: boolean = false;
  // Payment method specific fields
  checkNumber: string = '';
  cardNumber: string = '';
  selectedBank: string = '';
  selectedMobileBankingMethod: string = '';
  mobileNumber: string = '';
  showPaymentDetails: boolean = false; // Toggle for payment details section
  lstUser: User[] = [];
  actualqty: any;
  updateAmount: any;
  actualamount: number = 0;

  invoiceSearch : any;
  completedSearchTimer: any;

  // Server-side pagination, one state per list tab (pageIndex is 1-based like the API)
  pageSizeOptions: number[] = [10, 25, 50, 100];
  draftPage = { pageIndex: 1, pageSize: 10, total: 0 };
  completedPage = { pageIndex: 1, pageSize: 10, total: 0 };
  returnPage = { pageIndex: 1, pageSize: 10, total: 0 };

  isdisablebtn: boolean = false;

  checkReturn: number = 0;
  // customer: Supplier = new Supplier();
  customer: Customer = new Customer();
  showInvoicePreview: boolean = true;
  // Modal properties
  showCustomerModal: boolean = false;
  showSalesOrderSummaryModal: boolean = false;
  onCustomerCreated: any = null;
  itemTotal: number = 0;
  itemSearchTimeout: any;


  customerSearch: string = '';
  customerSearchTimeout: any;
  filteredCustomers: any[] = [];
  showCustomerDropdown: boolean = false;
  selectedCustomerDropdownIndex: number = -1;
  stockQty: number = 0;

  autoSaveTimeout: any;
  lastSavedModel: any = null;
  isAutoSaving: boolean = false;

  preventClose: boolean = false;
  authService: AuthenticationService = inject(AuthenticationService);
  // authenticatedUser: AuthenticatedUser | any = {};

  // return

  displayedColumns: string[] = [
    'serialNo',
    'materialNumber',
    'itemName',
    'shadesName',
    'warehouse',
    'brandName',
    'category',
    'stock',
    'purchasePrice',
    // 'unit',
    'quantity',
    'total',
    // 'customer',
  ];

  today: Date = new Date();

  showRemarkModal = false;
  showViewModal = false;
  viewSalesOrder: any = null;
  subTotal: number = 0;
  total: number = 0;
  discount: number = 0;
  deliveryCharge: number = 0;
  discountType: string = '৳'; // Add discount type property
  finalAmount: number = 0;
  tax: number = 0;
  vat: number = 0;
  totalPayable: number = 0;
  payment: number = 0;
  due: number = 0;
  receivedAmount: number = 0; // Cash received from customer
  returnAmount: number = 0; // Change to return to customer
  availStock: number = 0; // Available stock
  isSubmitButtonDisabled: boolean = false; // Disable submit button after submission
  isLoadingSubmit: boolean = false; // Show loader while submitting
  isLoadingOrderList: boolean = false; // Show loader while fetching order list

  lstCustomer: Customer[] = [];
  lstPurchase: any[] = [];
  lstSalesOrder: any[] = [];
  lstReturnedSales: any[] = [];
  displayedCompletedColumns: string[] = [
    'InvoiceNo',
    'Date',
    'customer',
    'warehouse',
    'itemName',
    'quantity',
    'totalAmount',
    'discountAmount',
    'tax',
    'vat',
    'status',
  ];

  completedLoaded = false;

  lstWarehouses: any[] = [];
  lstItem: any[] = [];

  allItems: any[] = [];

  authenticatedUser: AuthenticatedUser | null = null;
  searchModelSettings: Settings = new Settings();
  selectedWarehouseId: number = 0; // For dropdown binding
  itemSearch: string = '';
  filteredItems: any[] = [];
  summaryItems: SummaryItem[] = [];
  showItemDropdown: boolean = false;
  selectedDropdownIndex: number = -1;

  // Template reference to mat-tab-group
  @ViewChild('salesTabGroup') salesTabGroup!: MatTabGroup;

  // salesItems: any[] = [];
  // summaryItems: any[] = [];
  selectedCustomer: any = null;
  selectedWarehouse: any = null;

  // model: Purchase = new Purchase();
  model: SalesOrder = new SalesOrder();
  taxAmount: number = 0;
  vatAmount: number = 0;
  fromDate: string | null = null;
  toDate: string | null = null;
  checkmark: boolean = false;

  returnQty: number = 0;

  // Selection tracking for completed sales
  private readonly SALES_SELECTION_KEY = 'sales-order-selection';

  // ensure template mat-table updates from model.salesOrderDetails
  get salesItems(): SalesOrderDetail[] {
    return this.model.salesOrderDetails;
  }

  constructor(
    private customerService: CustomerService,
    private userService: UserService,
    private messagHelper: MessageHelperService,
    private settingsService: SettingsService,
    private salesOrderService: SalesOrderService,
    private itemService: ItemService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private MatDialog: MatDialog,
    private cdr: ChangeDetectorRef, // Add this
  ) {
    this.calculateTotals();
  }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.customer.tenantId = this.authenticatedUser?.tenantId;
    this.model.salesOrderDetails = [];
    this.summaryItems = [];
    this.getAllCustomer(this.customer);
    this.getAllWarehouse(this.customer);
    this.getAllUser(this.customer);
    this.getAllItems(this.customer);
    this.model.salesOrderDate = new Date().toISOString().split('T')[0];
    this.model.tenantId = Number(this.authenticatedUser?.tenantId);
    this.model = this.model ?? ({} as any);
    if (!this.model.invoiceNo) {
      this.model.invoiceNo = this.generateInvoiceNo();
    }
    this.model.salesOrderDetails.forEach((detail) => {
      detail.isSelected = false; // Initialize to false
    });

  }

  private loadSelectionsFromStorage(): void {
    try {
      const saved = localStorage.getItem(this.SALES_SELECTION_KEY);
      if (saved) {
        const data = JSON.parse(saved);

        // Restore detail selections
        this.lstPurchase.forEach((order) => {
          if (order.salesOrderDetails) {
            order.salesOrderDetails.forEach((detail: any) => {
              const key = `${order.id}-${detail.id}`;
              detail.isSelected = data.selectedDetails?.includes(key) || false;
            });
          }
        });

        // Restore sales order selections
        this.lstPurchase.forEach((order) => {
          order.isSelected =
            data.selectedSalesOrders?.includes(order.id) || false;
        });
      }
    } catch (e) {
      console.error('Failed to load selections:', e);
    }
  }
onInvoiceSearch(invoice : any){
  this.loadCompletedSalesOrder();
}
  /**
   * Save selections to localStorage when detail checkbox changes
   */
  onDetailSelectionChange(salesOrder: any, detail: any): void {
    this.updateAmount = salesOrder.totalAmount;
    this.saveAllSelectionsToStorage();
  }
  onReturnQuantityInput(event: any, detail: any) {
  // Get the input value

  if(event.target.value === '' || event.target.value === null) {
    this.messagHelper.showMessage(400, `Return quantity can't be empty`,);
    console.log(this.actualqty);
  }else{
      let value = Number(event.target.value);
  const maxQty = Number(detail.quantity || 0);

  // If value exceeds max quantity, limit it
  if (value > maxQty) {
    detail.salesreturnQuantity = maxQty;
    event.target.value = maxQty;
  }
  }

}

  /**
   * Validate and cap return quantity input to not exceed remaining quantity
   */
  onReturnQuantityChange(detail: any): void {
    if(detail.salesreturnQuantity > detail.quantity){
      this.messagHelper.showMessage(
        appEnums.ResponseStatus.warning,
        `Return quantity can't be greater than available quantity (${detail.quantity})`,
      );
      // detail.salesreturnQuantity = detail.quantity;
      detail.returnTotalAmount = detail.salesreturnQuantity * detail.unitPrice;
      this.isdisablebtn = true;
    }
   else{

    this.isdisablebtn = false;
     const maxQuantity = this.getRemainingQuantity(detail);


    // Ensure returnQuantity is a number
    detail.returnQuantity = Number(detail.salesreturnQuantity);
    // Cap at maximum remaining quantity
    if (detail.returnQuantity > maxQuantity) {
      detail.returnQuantity = maxQuantity;
    }
    // Ensure it's not negative
    if (detail.returnQuantity < 0) {
      detail.returnQuantity = 0;
    }

    if(detail.salesreturnQuantity === 0 || detail.salesreturnQuantity === null || detail.salesreturnQuantity === undefined){
      }else{
      
      detail.returnTotalAmount = detail.returnQuantity * detail.unitPrice;
    }
    // this.actualamount = this.updateAmount - detail.returnTotalAmount;
    this.actualamount += detail.returnTotalAmount;
   }
  }


  

  onFilter() {
    this.completedPage.pageIndex = 1;
    this.loadCompletedSalesOrder();
  }
  onFilterReturn() {
    this.returnPage.pageIndex = 1;
    this.loadReturnSalesOrder();
  }
  clearFilterReturn() {
    this.fromDate = null;
    this.toDate = null;
    this.returnPage.pageIndex = 1;
    this.loadReturnSalesOrder();
  }
  // Server-side search (name, number, invoice no) so it covers every page, not just the current one
  onCompletedSearch() {
    clearTimeout(this.completedSearchTimer);
    this.completedSearchTimer = setTimeout(() => this.onFilter(), 400);
  }

  clearFilter() {
    this.fromDate = null;
    this.toDate = null;
    this.invoiceSearch = '';
    this.completedPage.pageIndex = 1;
    this.loadCompletedSalesOrder();
  }

  loadReturnSalesOrder() {
    this.getAllReturnSalesOrderList({
      tenantId: this.authenticatedUser?.tenantId,
      IsReturn: true,
      fromDate: this.fromDate,
      toDate: this.toDate,
    });
  }

  // ---------- Pagination ----------

  onDraftPageChange(event: PageEvent) {
    this.draftPage.pageIndex = event.pageIndex + 1;
    this.draftPage.pageSize = event.pageSize;
    this.loadCompletedPurchases();
  }

  onCompletedPageChange(event: PageEvent) {
    this.completedPage.pageIndex = event.pageIndex + 1;
    this.completedPage.pageSize = event.pageSize;
    this.loadCompletedSalesOrder();
  }

  onReturnPageChange(event: PageEvent) {
    this.returnPage.pageIndex = event.pageIndex + 1;
    this.returnPage.pageSize = event.pageSize;
    this.loadReturnSalesOrder();
  }

  /**
   * Total row count from an API response, whichever field reports it (a 0 is ignored).
   * Without a total, a full page means there may be more, so keep "next" enabled.
   */
  private getTotalCount(res: ApiResponse, rows: any[], page: { pageIndex: number; pageSize: number }): number {
    const reported = [res.totalCount, res.count, rows[0]?.totalCount]
      .map(n => Number(n))
      .find(n => n > 0);
    if (reported) return reported;

    const seen = (page.pageIndex - 1) * page.pageSize + rows.length;
    return rows.length >= page.pageSize ? seen + 1 : seen;
  }
  /**
   * Save selections to localStorage when sales order checkbox changes
   */
  onSalesOrderSelectionChange(salesOrder: any): void {
    this.saveAllSelectionsToStorage();
  }

  /**
   * Save all current selections to localStorage
   */
  private saveAllSelectionsToStorage(): void {
    this.checkmark = false;
    try {
      const selectedDetails: string[] = [];
      const selectedSalesOrders: number[] = [];

      this.lstPurchase.forEach((order) => {
        if (order.isSelected) {
          selectedSalesOrders.push(order.id);
        }

        if (order.salesOrderDetails) {
          order.salesOrderDetails.forEach((detail: any) => {
            if (detail.isSelected) {
              selectedDetails.push(`${order.id}-${detail.id}`);
              this.checkmark = true;
            }
          });
        }
      });

      const data = {
        selectedDetails,
        selectedSalesOrders,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(this.SALES_SELECTION_KEY, JSON.stringify(data));
      console.log('Selections saved:', data);
    } catch (e) {
      console.error('Failed to save selections:', e);
    }
  }

  /**
   * Get all selected details with their parent sales orders
   */
  getSelectedDetailsWithParents(): Array<{ salesOrder: any; detail: any }> {
    const result: Array<{ salesOrder: any; detail: any }> = [];

    this.lstPurchase.forEach((order) => {
      if (order.salesOrderDetails) {
        order.salesOrderDetails.forEach((detail: any) => {
          if (detail.isSelected) {
            result.push({ salesOrder: order, detail });
          }
        });
      }
    });

    return result;
  }

  /**
   * Get all selected sales orders
   */
  getSelectedSalesOrdersForExport(): any[] {
    return this.lstPurchase.filter((order) => order.isSelected);
  }

  /**
   * Clear all selections
   */
  clearAllSelections(): void {
    this.lstPurchase.forEach((order) => {
      order.isSelected = false;
      if (order.salesOrderDetails) {
        order.salesOrderDetails.forEach((detail: any) => {
          detail.isSelected = false;
        });
      }
    });
    localStorage.removeItem(this.SALES_SELECTION_KEY);
    console.log('All selections cleared');
  }

  /**
   * Export selected data for reports, API calls, etc.
   */
  exportSelectedData(): any {
    const selectedDetails = this.getSelectedDetailsWithParents();
    const selectedOrders = this.getSelectedSalesOrdersForExport();

    return {
      salesOrders: selectedOrders,
      details: selectedDetails,
      summary: {
        totalOrders: selectedOrders.length,
        totalItems: selectedDetails.length,
        totalAmount: selectedDetails.reduce(
          (sum, item) => sum + item.detail.unitPrice * item.detail.quantity,
          0,
        ),
      },
      exportedAt: new Date().toISOString(),
    };
  }

  hasMatchingRole(): boolean {
    return this.lstUser.some(
      (user) => user.roleId === this.authenticatedUser?.roleId,
    );
  }

  getCurrentUserImage(): string | null {
    const currentUser = this.lstUser.find(
      (user) => user.phoneNumber === this.authenticatedUser?.phoneNumber,
    );
    if (currentUser?.imageBase64) {
      return currentUser.imageBase64.startsWith('http')
        ? currentUser.imageBase64
        : 'data:image/png;base64,' + currentUser.imageBase64;
    }
    return null;
  }
  getCurrentUserSignature(): string | null {
    
    const currentUser = this.lstUser.find(
      (user) => user.phoneNumber === this.authenticatedUser?.phoneNumber,
    );
    if (currentUser?.signatureImageBase64) {
      return currentUser.signatureImageBase64.startsWith('http')
        ? currentUser.signatureImageBase64
        : 'data:image/png;base64,' + currentUser.signatureImageBase64;
    }
    return null;
  }

  openRemarkModal(obj: any) {

    console.log('Opening modal:', obj); // Debugging
    this.showRemarkModal = true;
    this.selectedReturnRow = obj; // Store the specific row being returned
    this.salesReturnModel = obj;
    this.remarks = ''; // Reset remarks for new return
    this.checkmark = false; // Reset checkmark

  }

  openViewModal(order: any) {
    debugger
    this.viewSalesOrder = order;
    this.showViewModal = true;
  }

  closeViewModal() {
    this.showViewModal = false;
    this.viewSalesOrder = null;
  }

  // Get list of returned item IDs and quantities for filtering
  private salesMap(): Map<string, number> {
    const returnedMap = new Map<string, number>();

    // Build a map of returned items from lstPurchase
    (this.lstPurchase || []).forEach((returnOrder: any) => {
      if (returnOrder.salesOrderDetails) {
        returnOrder.salesOrderDetails.forEach((returnDetail: any) => {
          const key = `${returnDetail.itemId}-${returnDetail.warehouseId}`;
          const currentQty = returnedMap.get(key) || 0;
          returnedMap.set(key, currentQty + Number(returnDetail.quantity || 0));
        });
      }
    });
    return returnedMap;
  }
  // Get list of returned item IDs and quantities for filtering
  private getReturnedItemsMap(): Map<string, number> {
    const returnedMap = new Map<string, number>();

    // Build a map of returned items from lstReturnedSales
    (this.lstReturnedSales || []).forEach((returnOrder: any) => {
      if (returnOrder.returnOrderDetails) {
        returnOrder.returnOrderDetails.forEach((returnDetail: any) => {
          const key = `${returnDetail.itemId}-${returnDetail.warehouseId}`;
          const currentQty = returnedMap.get(key) || 0;
          returnedMap.set(key, currentQty + Number(returnDetail.quantity || 0));
        });
      }
    });

    return returnedMap;
  }

  // Helper method to get unique sales order details (removes returned items)
  getUniqueDetails(details: any[]): any[] {
    if (!details || details.length === 0) return [];

    // const returnedMap = this.salesMap();
    const returnedMap = this.getReturnedItemsMap();
    const seen = new Set();

    return details
      .filter((detail) => {
        const key = `${detail.itemId}-${detail.warehouseId}`;
        const returnedQty = returnedMap.get(key) || 0;
        const remainingQty = Number(detail.quantity || 0) - returnedQty;

        // Only include if there are items remaining (not fully returned)
        return remainingQty > 0;
      })
      .filter((detail) => {
        // Remove duplicates
        const key = `${detail.itemId}-${detail.warehouseId}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
  }


  getRemainingQuantity(detail: any): number {
    
  if (detail.salesreturnQuantity === undefined || detail.salesreturnQuantity === null || detail.salesreturnQuantity === '') {
    return (detail.quantity || 0) - (detail.returnQuantity || 0);
  }
  return detail.salesreturnQuantity ;
}

  
  getDetailsNotReturned(details: any[]): any[] {
  if (!details || details.length === 0) return [];

  const seen = new Set();

  return details
    .filter((detail) => {
      const remainingQty =
        (Number(detail.quantity) || 0) -
        (Number(detail.returnQuantity) || 0);

      return remainingQty > 0;
    })
    .filter((detail) => {

      const isBaseItem = (detail.itemName ?? '')
        .toUpperCase()
        .includes('BASE');

      // BASE items should always appear
      if (isBaseItem) {
        return true;
      }

      const key = `${detail.itemId}-${detail.warehouseId}-${detail.shadesName ?? ''}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

  getReturnOrderDetails(details: any[]): any[] {
  if (!details || details.length === 0) {
    return [];
  }

  const seen = new Set();

  return details.filter(detail => {

    const key =
      `${detail.itemId}-${detail.warehouseId}-${detail.shadesName}-${detail.unitPrice}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
  getqty(details: any[]): any[] {
    if (!details || details.length === 0) return [];

    const seen = new Set();
    return details.filter((detail) => {
      this.actualqty =
        Number(detail.quantity || 0) - Number(detail.returnQuantity || 0);
      // this.updateAmount = this.updateAmount-detail.returnTotalAmount;
      return true;
    });
  }

  onDeliveryChargeChange() {
    this.subTotal = this.totalPayable + this.deliveryCharge;
    this.model.deliveryCharge = this.deliveryCharge;
    this.triggerAutoSave();
    // this.subTotal = this.total + this.deliveryCharge;
    // this.finalAmount = this.subTotal;
  }

  cancelRemark() {
    this.showRemarkModal = false;
    this.remarks = ''; // Clear remarks
    this.selectedReturnRow = null; // Clear selected row
    this.checkmark = false; // Reset checkmark
  }

  handleNewCustomer(newCustomer: any) {
    if (!newCustomer) return;

    // Add newly created customer to list
    this.lstCustomer = [...this.lstCustomer, newCustomer];

    // Auto-select
    this.selectedCustomer = newCustomer;
    this.model.customerId = Number(newCustomer.id);
    this.model.customerName = newCustomer.name;

    // Set search field text
    this.customerSearch = `${newCustomer.name} ${
      newCustomer.contact ? ' - ' + newCustomer.contact : ''
    }`;

    // Close dropdown & modal
    this.showCustomerDropdown = false;
    this.showCustomerModal = false;

    // Optionally refresh list from API (if needed)
    // this.getAllCustomer(this.customer);

    this.onCustomerChange(this.model.customerId);
  }

  onCustomerSearchChange() {
    this.showCustomerDropdown = true;
    clearTimeout(this.customerSearchTimeout);
    this.customerSearchTimeout = setTimeout(() => {
      const q = (this.customerSearch || '').toLowerCase();
      if (!q) {
        this.filteredCustomers = [...(this.lstCustomer || [])];
        return;
      }
      this.filteredCustomers = (this.lstCustomer || [])
        .filter((c: any) => {
          return (
            (c.name ?? '').toString().toLowerCase().includes(q) ||
            (c.contact ?? '').toString().toLowerCase().includes(q) ||
            (c.address ?? '').toString().toLowerCase().includes(q)
          );
        })
        .slice(0, 200);
    }, 150);
  }

  onCustomerSearchFocus() {
    this.showCustomerDropdown = true;
    this.filteredCustomers = [...(this.lstCustomer || [])];
  }

  hideCustomerDropdown() {
    setTimeout(() => {
      if (!this.preventClose) {
        this.showCustomerDropdown = false;
        this.selectedCustomerDropdownIndex = -1;
      }
      this.preventClose = false; // reset
    }, 150);
  }

  onCustomerDropdownKeydown(event: KeyboardEvent) {
    if (!this.showCustomerDropdown || !this.filteredCustomers.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (
          this.selectedCustomerDropdownIndex <
          this.filteredCustomers.length - 1
        ) {
          this.selectedCustomerDropdownIndex++;
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.selectedCustomerDropdownIndex > 0) {
          this.selectedCustomerDropdownIndex--;
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (
          this.selectedCustomerDropdownIndex >= 0 &&
          this.selectedCustomerDropdownIndex < this.filteredCustomers.length
        ) {
          this.selectCustomer(
            this.filteredCustomers[this.selectedCustomerDropdownIndex],
          );
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.hideCustomerDropdown();
        break;
    }
  }

  selectCustomer(c: any) {
    if (!c) return;
    this.selectedCustomer = c;
    this.model.customerId = Number(c.id ?? 0);
    this.model.customerName = c.name ?? '';
    this.customerSearch = `${c.name} ${c.contact || c.phone ? ' - ' + (c.contact || c.phone) : ''}`;
    this.filteredCustomers = [];
    this.showCustomerDropdown = false;
    this.selectedCustomerDropdownIndex = -1;
    // keep any other logic you already have for when a customer changes
    this.onCustomerChange(this.model.customerId);
  }

  // Return first two words of a name, append "..." if there are more words
  getShortName(name: string | undefined | null): string {
    if (!name) return '';
    const parts = ('' + name).trim().split(/\s+/);
    if (parts.length <= 2) return parts.join(' ');
    return parts.slice(0, 2).join(' ') + '...';
  }

  onWarehouseChange(warehouseId: number) {
    this.selectedWarehouse =
      (this.lstWarehouses || []).find((w) => w.id === Number(warehouseId)) ||
      null;
    this.selectedWarehouseId = warehouseId;

    if (this.showItemDropdown) {
      this.onItemSearchChange();
    }
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.index == 0) {
      this.showInvoicePreview = true;
      this.check = 2;
    } else if (event.index == 1) {
      this.showInvoicePreview = false;
      this.loadCompletedPurchases();
      this.check = 1;
    } else if (event.index == 2) {
      //  this.loadCompletedSalesOrder();
      this.loadCompletedSalesOrder();
      this.check = 1;
    } else {
      this.showInvoicePreview = false;
      this.check = 1;
      this.loadReturnSalesOrder();
    }
  }

  loadCompletedPurchases() {
    // if (this.completedLoaded) return;
    const filter = {
      tenantId: this.authenticatedUser?.tenantId,
      IsDraft: true,
      IsReturn: false,
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.getAllSalesOrderList(filter); // Will deduplicate drafts by invoice number
    this.completedLoaded = true;
  }

  loadCompletedSalesOrder() {
    const model = {
      tenantId: this.authenticatedUser?.tenantId,
      IsDraft: false,
      IsReturn: false,
      fromDate: this.fromDate,
      toDate: this.toDate,
      searchText : this.invoiceSearch?.trim()
    };
    this.getAllSalesOrderList(model, true);
    this.completedLoaded = true;
  }

  /**
   * Load a draft for editing - populates form with draft data
   */
  editDraft(draftRow: any) {
    debugger
    if(this.checkmark){}
    if (!draftRow) return;

    // Load the draft model
    this.model = JSON.parse(JSON.stringify(draftRow));

    // Restore discount type (% or ৳) so a fixed-amount discount isn't reinterpreted as a percentage
    this.discountType = draftRow.discountType || '%';
    this.model.discountType = this.discountType;

    // Restore customer
    if (draftRow.customerId) {
      this.selectedCustomer =
        this.lstCustomer.find(
          (c) => Number(c.id) === Number(draftRow.customerId),
        ) || null;
      this.model.customerId = Number(draftRow.customerId);
      this.model.customerName = draftRow.customerName;
      this.customerSearch = `${draftRow.customerName}`;
    }

    // Restore warehouse from first detail (if available)
    if (draftRow.salesOrderDetails && draftRow.salesOrderDetails.length > 0) {
      const firstDetail = draftRow.salesOrderDetails[0];
      const warehouseId = Number(firstDetail.warehouseId ?? 0);

      this.selectedWarehouseId = warehouseId;
      this.selectedWarehouse =
        this.lstWarehouses.find((w) => Number(w.id) === warehouseId) || null;
    }

    // Rebuild summary items from draft details with ALL display fields
    // ENRICH from lstItem to get missing fields
    this.summaryItems = (draftRow.salesOrderDetails || []).map(
      (detail: any) => {
        // Look up full item details from lstItem by itemId
        const fullItem = (this.lstItem || []).find(
          (it) => Number(it.id) === Number(detail.itemId),
        );

        return {
          itemId: detail.itemId,
          discountType : this.discountType || '%',
          name: detail.itemName || fullItem?.name || '',
          quantity: Number(detail.quantity),
          mrp: Number(detail.unitPrice ?? 0),
          sellingPrice: Number(detail.unitPrice ?? 0),
          warehouseId: Number(detail.warehouseId ?? 0),
          customerId: Number(draftRow.customerId ?? 0),
          weightedPrice: Number(fullItem?.weightedAveragePrice ?? 0),

          availableStock: Number(detail.availableStock ?? 0),
        } as SummaryItem & { warehouseId?: number; customerId?: number };
      },
    );

    this.model.salesOrderDetails = (draftRow.salesOrderDetails || []).map(
      (detail: any) => {
        const fullItem = (this.lstItem || []).find(
          (it) => Number(it.id) === Number(detail.itemId),
        );
        const warehouseId = Number(detail.warehouseId ?? 0);
        const warehouseName =
          this.lstWarehouses.find((w) => Number(w.id) === warehouseId)?.name ||
          '';

        return {
          id: detail.id || 0,
          salesOrderDetailId: detail.salesOrderDetailId || '',
          itemId: detail.itemId,
          uomId: detail.uomId || fullItem?.uomId || 0,
          warehouseId: warehouseId,
          customerId: Number(draftRow.customerId ?? 0),
          quantity: Number(detail.quantity),
          unitPrice: Number(detail.unitPrice ?? 0),
          totalAmount: Number(
            detail.totalAmount ?? detail.quantity * detail.unitPrice,
          ),
          // Display fields - prefer draft data, fallback to fullItem data
          itemName: detail.itemName || fullItem?.name || '',
          materialNumber:
            detail.materialNumber || fullItem?.materialNumber || '',
          brandName: detail.brandName || fullItem?.brandName || '',
          category:
            detail.category ||
            detail.categoryName ||
            fullItem?.categoryName ||
            '',
          unit: detail.unit || detail.uomName || fullItem?.uomName || '',
          sellingPrice: Number(detail.unitPrice ?? 0),
          warehouse: detail.warehouse || warehouseName,
          customer: draftRow.customerName || '',
          availableStock: Number(
            detail.availableStock ??
              this.getStockForItemAtWarehouse(fullItem || {}, warehouseId) ??
              0,
          ),
          shadesName: detail.shadesName || '',
        };
      },
    ) as any;

    // Restore totals from draft
    this.subTotal = Number(draftRow.subTotal ?? 0);
    this.discount = Number(draftRow.discountAmount ?? 0);
    this.finalAmount = Number(draftRow.finalAmount ?? this.subTotal);
    this.tax = Number(draftRow.tax ?? 0);
    this.vat = Number(draftRow.vat ?? 0);
    this.taxAmount = Number(draftRow.taxAmount ?? 0);
    this.vatAmount = Number(draftRow.vatAmount ?? 0);
    this.totalPayable = Number(draftRow.totalAmount ?? 0);
    this.payment = Number(draftRow.paidAmount ?? 0);
    this.due = Number(draftRow.dueAmount ?? 0);
    this.deliveryCharge = Number(draftRow.deliveryCharge ?? 0);
    this.CBremarks = draftRow.remarks ?? '';

    // Set payment details if available
    if (draftRow.paymentMethod) {
      this.selectedPaymentMethod = Number(draftRow.paymentMethod);
    }

    // Mark model as draft so it can be updated
    this.model.isDraft = true;
    this.model.isReturn = false;

    // Trigger change detection for mat-table
    this.model.salesOrderDetails = [...this.model.salesOrderDetails];

    // CRITICAL: Initialize lastSavedModel so auto-save change detection works
    this.lastSavedModel = JSON.parse(JSON.stringify(this.model));

    // CRITICAL: Recalculate totals based on restored summary items
    this.calculateTotals();

    // Switch to New Sales tab (index 0)
    if (this.salesTabGroup) {
      this.salesTabGroup.selectedIndex = 0;
    }

    // Scroll to top so user sees the form
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);

    console.log('Draft loaded for editing:', this.model);
    this.messagHelper.showMessage(200, 'Draft loaded for editing');

    // Refresh draft list to only show actual drafts (excluding completed orders)
    const draftFilter = {
      tenantId: this.authenticatedUser?.tenantId,
      IsDraft: true,
      fromDate: this.fromDate,
      toDate: this.toDate,
    };
    this.getAllSalesOrderList(draftFilter);
  }

  /**
   * Delete a draft permanently
   */
  deleteDraft(draftRow: any) {
    debugger
    if (!confirm('Are you sure you want to delete this draft?')) return;
    // this.lstPurchase = this.lstPurchase.filter(
    //   (order) => Number(order.id) !== Number(draftRow.id),
    // );
      this.salesOrderService.deleteSalesOrder(draftRow.id).subscribe({
      next: () => {
        // Remove from local list
        this.lstPurchase = this.lstPurchase.filter(
          (order) => Number(order.id) !== Number(draftRow.id),
        );
        this.draftPage.total = Math.max(0, this.draftPage.total - 1);
        this.messagHelper.showMessage(200, 'Draft deleted successfully');
      }
    });
  }

  

  onCustomerChange(customerId: number) {
    this.selectedCustomer =
      (this.lstCustomer || []).find((c) => c.id === Number(customerId)) || null;
    this.model.customerId = Number(this.selectedCustomer?.id ?? 0);
    this.model.customerName = this.selectedCustomer?.name ?? '';
  }

  hasStockInWarehouse(it: any, warehouseId: number): boolean {
    if (!warehouseId) return true; // no warehouse selected → don't filter
    const stocks =
      it.warehousestk ??
      it.wareHouseStk ??
      it.warehouseStock ??
      it.warehouseStocks ??
      [];
    if (!Array.isArray(stocks)) {
      const total = Number(it.totalCount ?? it.availableStock ?? it.stock ?? 0);
      return total > 0;
    }
    const match = stocks.find(
      (ws: any) => Number(ws.warehouseId) === Number(warehouseId),
    );
    const qty = Number(match?.itemQty ?? match?.qty ?? 0);
    return qty > 0;
  }

  onItemSearchChange() {
    
    this.showItemDropdown = true;
    clearTimeout(this.itemSearchTimeout);

    this.itemSearchTimeout = setTimeout(() => {
      const q = (this.itemSearch || '').toLowerCase();

      this.filteredItems = (this.lstItem || [])
        .filter((it: any) =>
          this.hasStockInWarehouse(it, this.selectedWarehouseId),
        )
        .filter((it: any) => {
          if (!q) return true;
          return (
            (it.name ?? '').toString().toLowerCase().includes(q) ||
            (it.materialNumber ?? '').toString().toLowerCase().includes(q) ||
            (it.brandName ?? '').toString().toLowerCase().includes(q) ||
            (it.categoryName ?? '').toString().toLowerCase().includes(q) ||
            (it.itemId ?? '').toString().toLowerCase().includes(q)
          );
        })
        .slice(0, 200);
    }, 150);
  }

  updateReturnAmount() {
    this.showRemarkModal = false;

    // Get only the selected items from the SPECIFIC row being returned
    if (!this.selectedReturnRow || !this.selectedReturnRow.salesOrderDetails) {
      this.messagHelper.showMessage(
        400,
        'Invalid return request. Please refresh and try again.',
      );
      return;
    }

    const selectedItems = this.selectedReturnRow.salesOrderDetails.filter(
      (item: { isSelected: any }) => item.isSelected,
    );

    // Validate: must have selected items
    if (selectedItems.length === 0) {
      this.messagHelper.showMessage(
        400,
        'Please select at least one item for return.',
      );
      return;
    }

    // Validate: must have remarks
    if (!this.remarks || this.remarks.trim().length === 0) {
      this.messagHelper.showMessage(
        400,
        'Please enter remarks for the return.',
      );
      return;
    }

    const model = this.selectedReturnRow;

    // Calculate total return amount from all selected items
    const totalReturnAmount = selectedItems.reduce(
      (sum: number, detail: any) => {
        return sum + (detail.returnTotalAmount || 0);
      },
      0,
    );
    debugger
    // New total amount = original amount - return amount
    const newTotalAmount = (model.totalAmount || 0) - totalReturnAmount;

    console.log('Selected items for return:', selectedItems.length);
    console.log('Total return amount:', totalReturnAmount);
    console.log('New total amount:', newTotalAmount);

    // 1. CREATE RETURN ORDER (existing code)
    this.salesReturnModel = {
      id: model.id || 0,
      salesInvoiceNo: model.invoiceNo || '',
      returnOrderId: '',
      salesDate: model.orderDate || new Date().toISOString(),
      totalAmount: newTotalAmount,
      discountAmount: model.discountAmount || 0,
      discountType: model.discountType || '%',
      tax: model.tax || 0,
      vat: model.vat || 0,
      paymentMethod: model.paymentMethod || '',
      mobileBankMethod: model.mobileBankMethod || '',
      phoneNumber: model.phoneNumber || '',
      bankId: model.bankId || 0,
      cardNumber: model.cardNumber || '',
      warehouseId: model.salesOrderDetails?.[0]?.warehouseId || 0,
      tenantId: model.tenantId || 0,
      customerId: model.customerId || 0,
      remarks: this.remarks || '',
      returnOrderDetails: selectedItems.map((detail: any) => ({
        id: detail.id || 0,
        returnOrderDetailId: detail.salesOrderDetailId || '',
        itemId: detail.itemId || 0,
        uomId: detail.uomId || 0,
        warehouseId: detail.warehouseId || 0,
        quantity: detail.returnQuantity || 0,
        unitPrice: detail.unitPrice || 0,
        returnTotalAmount: detail.returnTotalAmount || 0,
        totalAmount: detail.returnTotalAmount || 0,
        isReturn: true,
      })),
    };

    console.log('Return Amount Updated:', this.salesReturnModel);

    // Call the service to create the sales order return
    this.salesOrderService
      .createSalesorderReturn(this.salesReturnModel)
      .subscribe({
        next: (res: ApiResponse) => {
          if (res && res.statusCode === 200) {
            // STEP 1: Return created successfully
            this.messagHelper.showMessage(
              200,
              'Return processed successfully.',
            );
            const filter = {
              tenantId: this.authenticatedUser?.tenantId,
              IsDraft: false,
              IsReturn: false,
            };
            this.cdr.detectChanges();
            this.getAllSalesOrderList(filter);

            // STEP 2: NOW UPDATE THE ORIGINAL SALES ORDER
            const updateModel = {
              id: model.id,
              salesOrderId: model.salesOrderId,
              invoiceNo: model.invoiceNo,
              customerId: Number(model.customerId),
              orderDate: model.orderDate,
              tenantId: Number(model.tenantId),
              totalAmount: Number(newTotalAmount),
              discountAmount: Number(model.discountAmount),
              discountType: model.discountType || '%',
              tax: Number(model.tax),
              vat: Number(model.vat),
              paidAmount: Number(model.paidAmount),
              dueAmount: Math.max(
                0,
                Number(model.dueAmount || 0) - totalReturnAmount,
              ),
              deliveryCharge: Number(model.deliveryCharge),
              remarks: model.remarks,
              isReturn: model.isReturn,
              isDraft: model.isDraft,
              paymentMethod: Number(model.paymentMethod) || 1,
              mobileBankMethod: Number(model.mobileBankMethod) || 0,
              phoneNumber: model.phoneNumber,
              bankName: model.bankName,
              accountNumber: model.accountNumber,
              // Update all sales order details: mark returned items and update quantities
              salesOrderDetails: model.salesOrderDetails.map((detail: any) => {
                const returnedItem = selectedItems.find(
                  (item: any) => item.id === detail.id,
                );

                return {
                  ...detail,
                  // Mark as returned if this item was selected for return
                  isReturn: returnedItem ? true : detail.isReturn,
                  // Update return quantity
                  returnQuantity: returnedItem
                    ? returnedItem.returnQuantity || 0
                    : detail.returnQuantity || 0,
                  // Calculate remaining quantity for display
                  quantity:
                    (detail.quantity || 0) -
                    (returnedItem ? returnedItem.returnQuantity || 0 : 0),
                };
              }),
            };

          } else {
            this.messagHelper.showMessage(res.statusCode, '');
          }
        },
        error: (err: any) => {
          if (err) {
            this.messagHelper.showMessage(err.status, err.message);
          }
        },
      });
  }

  onItemSearchFocus() {
    this.showItemDropdown = true;
    const q = (this.itemSearch || '').toLowerCase();

    this.filteredItems = (this.lstItem || [])
      .filter((it: any) =>
        this.hasStockInWarehouse(it, this.selectedWarehouseId),
      )
      .filter((it: any) => {
        if (!q) return true;
        return (
          (it.name ?? '').toString().toLowerCase().includes(q) ||
          (it.materialNumber ?? '').toString().toLowerCase().includes(q) ||
          (it.brandName ?? '').toString().toLowerCase().includes(q) ||
          (it.categoryName ?? '').toString().toLowerCase().includes(q) ||
          (it.itemId ?? '').toString().toLowerCase().includes(q)
        );
      })
      .slice(0, 200);
  }
  onItemSearchKeydown(event: KeyboardEvent) {
    if (!this.showItemDropdown || this.filteredItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedDropdownIndex = Math.min(
          this.selectedDropdownIndex + 1,
          this.filteredItems.length - 1,
        );
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedDropdownIndex = Math.max(
          this.selectedDropdownIndex - 1,
          0,
        );
        this.scrollToSelected();
        break;
      case 'Enter':
        event.preventDefault();
        if (
          this.selectedDropdownIndex >= 0 &&
          this.selectedDropdownIndex < this.filteredItems.length
        ) {
          this.selectItem(this.filteredItems[this.selectedDropdownIndex]);
        } else if (this.filteredItems.length > 0) {
          this.selectItem(this.filteredItems[0]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.showItemDropdown = false;
        this.selectedDropdownIndex = -1;
        break;
    }
  }

  scrollToSelected() {
    setTimeout(() => {
      const dropdown = document.querySelector('.item-dropdown');
      const selected = document.querySelector('.item-dropdown-option.selected');
      if (dropdown && selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }



  selectItem(item: any) {
  debugger;
  
  if (this.selectedWarehouseId == 0 || this.selectedCustomer == null) {
    this.messagHelper.showMessage(
      400,
      'Warehouse and Customer selection are required.',
    );
    return; // Add return here instead of else
  }

  if (!item) return;

  // Add stock validation BEFORE adding to sales
  if (!this.hasStockInWarehouse(item, this.selectedWarehouseId)) {
    this.messagHelper.showMessage(
      400,
      `No stock available for "${item.name}" in the selected warehouse.`,
    );
    return;
  }

  const perItemWarehouseId = Number(item?.__selectedWarehouseId ?? 0);
  const warehouseId = Number(this.selectedWarehouseId);

  item.__selectedWarehouseId = warehouseId;

  this.selectedWarehouse =
    (this.lstWarehouses || []).find(
      (w: any) => Number(w.id) === warehouseId,
    ) || this.selectedWarehouse;

  item.availableStock = this.getStockForItemAtWarehouse(item, warehouseId);
  this.stockQty = item.availableStock;

  this.filteredItems = (this.filteredItems || []).map((it: any) =>
    it && it.id === item.id
      ? {
          ...it,
          __selectedWarehouseId: item.__selectedWarehouseId,
          availableStock: item.availableStock,
        }
      : it,
  );
item.weightedPrice = Number(item.weightedAveragePrice ?? 0);
  this.addItemToSales(item);

  this.itemSearch = `${item.name} - ${item.brandName ?? ''}`;
  this.filteredItems = [];
  this.showItemDropdown = false;
  this.selectedDropdownIndex = -1;

  setTimeout(() => {
    this.itemSearch = '';
  }, 800);
}

  getStockForItemAtWarehouse(item: any, warehouseId: number): number {
    const stocks =
      item.warehousestk ?? item.wareHouseStk ?? item.warehouseStock ?? [];
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return Number(item.totalCount ?? item.availableStock ?? item.stock ?? 0);
    }
    const w = stocks.find(
      (s: any) => Number(s.warehouseId) === Number(warehouseId),
    );
    if (w) return Number(w.itemQty ?? w.qty ?? 0);
    return stocks.reduce(
      (sum: number, s: any) => sum + Number(s.itemQty ?? 0),
      0,
    );
  }

  perWarehouseStocks(
    item: any,
  ): Array<{ warehouseId: number; name: string; qty: number }> {
    const stocks =
      item.warehousestk ?? item.wareHouseStk ?? item.warehouseStock ?? [];
    const arr = Array.isArray(stocks) ? stocks : [];
    const wid = Number(this.selectedWarehouseId ?? 0);

    const list = wid
      ? arr.filter((s: any) => Number(s.warehouseId) === wid)
      : arr;

    if (!list.length) {
      if (wid) {
        const name =
          (this.lstWarehouses || []).find((w: any) => Number(w.id) === wid)
            ?.name ?? `W${wid}`;
        return [{ warehouseId: wid, name, qty: 0 }];
      }
      return [
        {
          warehouseId: 0,
          name: 'All',
          qty: Number(
            item.totalCount ?? item.availableStock ?? item.stock ?? 0,
          ),
        },
      ];
    }

    return list.map((s: any) => {
      const id = Number(s.warehouseId ?? 0);
      const name =
        (this.lstWarehouses || []).find((w: any) => Number(w.id) === id)
          ?.name ?? `W${id}`;
      const qty = Number(s.itemQty ?? s.qty ?? 0);
      return { warehouseId: id, name, qty };
    });
  }

  // click handler for badge: set selected warehouse (and update UI) — does not auto-add item
  selectWarehouseForDropdown(
    warehouseId: number,
    item: any,
    event?: MouseEvent,
  ) {
    if (event) event.stopPropagation();

    const wid = Number(warehouseId ?? 0);

    // update global selection (fallback when an item has no per-item warehouse)
    this.selectedWarehouseId = wid;
    this.selectedWarehouse =
      (this.lstWarehouses || []).find((w: any) => Number(w.id) === wid) || null;

    // If a specific item was clicked, record the per-item warehouse choice
    if (item) {
      // persist per-item selection so that addItemToSales reads it
      item.__selectedWarehouseId = wid;

      // attach the warehouse-specific available stock to the item (so the UI shows the matched qty)
      item.availableStock = this.getStockForItemAtWarehouse(item, wid);
      item.__availableStockSelected = item.availableStock;
    }

    // keep filteredItems list in sync so UI updates for the specific item only
    this.filteredItems = (this.filteredItems || []).map((it: any) =>
      it && item && it.id === item.id
        ? {
            ...it,
            __selectedWarehouseId: item.__selectedWarehouseId,
            availableStock: item.availableStock,
            __availableStockSelected: item.__availableStockSelected,
          }
        : it,
    );
  }


// For colorbank product

addItemToSales(src: any) {
  debugger;

  const warehouseId = Number(
    src?.__selectedWarehouseId ??
      this.selectedWarehouse?.id ??
      this.selectedWarehouseId ??
      (this.searchModelSettings?.warehouseId
        ? Number(this.searchModelSettings.warehouseId)
        : 0)
  );

  const customerId = Number(
    this.selectedCustomer?.id ?? this.customer?.id ?? 0
  );

  const warehouseName =
    this.selectedWarehouse?.name ??
    this.lstWarehouses.find((w: any) => Number(w.id) === warehouseId)?.name ??
    "";

  const customerName =
    this.selectedCustomer?.name ?? this.customer?.name ?? "";

  this.model.salesOrderDetails ??= [];
  this.summaryItems ??= [];

  const unitPrice = Number(src.sellingPrice ?? 0) || 0;

  const availableStockFromWarehouse = this.getStockForItemAtWarehouse(
    src,
    warehouseId
  );

  // BASE products always create a new row
  const isBaseItem = (src.name ?? "")
    .toUpperCase()
    .includes("BASE");

  // Total quantity already added (used only for stock validation)
  const currentQty = this.model.salesOrderDetails
    .filter(
      (d: any) =>
        Number(d.itemId) === Number(src.id) &&
        Number(d.warehouseId ?? 0) === warehouseId &&
        Number(d.customerId ?? 0) === customerId
    )
    .reduce((sum: number, d: any) => sum + Number(d.quantity ?? 0), 0);

  if (currentQty + 1 > availableStockFromWarehouse) {
    this.messagHelper.showMessage(
      400,
      `Cannot add more of "${src.name}". Available stock is ${availableStockFromWarehouse}.`
    );
    return;
  }

  let existingDetail: any = null;

  // Only merge NON-BASE products
  if (!isBaseItem) {
    existingDetail = this.model.salesOrderDetails.find(
      (d: any) =>
        Number(d.itemId) === Number(src.id) &&
        Number(d.warehouseId ?? 0) === warehouseId &&
        Number(d.customerId ?? 0) === customerId
    );
  }
  if (existingDetail) {
    existingDetail.quantity += 1;
    existingDetail.unitPrice = unitPrice;
    existingDetail.totalAmount =
      existingDetail.quantity * existingDetail.unitPrice;
      
    existingDetail.availableStock = availableStockFromWarehouse;
  } else {
    const newItem: SalesOrderDetail & {
      warehouse?: string;
      customer?: string;
      itemName?: string;
      brandName?: string;
      category?: string;
      unit?: string;
      sellingPrice?: number;
      materialNumber?: string;
      customerId?: number;
      warehouseId?: number;
      availableStock?: number;
    } = {
      id: 0,
      salesOrderDetailId: "",
      itemId: src.id,
      uomId: src.uomId ?? 0,
      warehouseId,
      customerId,
      quantity: 1,
      unitPrice,
      totalAmount: unitPrice,
      itemName: src.name ?? "",
      materialNumber: src.materialNumber ?? "",
      brandName: src.brandName ?? "",
      category: src.categoryName ?? "",
      unit: src.uomName ?? "",
      sellingPrice: unitPrice,
      warehouse: warehouseName,
      customer: customerName,
      availableStock: availableStockFromWarehouse,
    } as any;

    this.model.salesOrderDetails.push(newItem);
  }

  this.model.salesOrderDetails = [...this.model.salesOrderDetails];

  if (customerId) {
    this.model.customerId = customerId;
    this.model.customerName = customerName;
  }

  // ================= SUMMARY =================
  let summaryIndex = -1;

  // Only merge NON-BASE products
  if (!isBaseItem) {
    summaryIndex = this.summaryItems.findIndex(
      (s: any) =>
        Number(s.itemId ?? 0) === Number(src.id) &&
        Number(s.warehouseId ?? 0) === warehouseId &&
        Number(s.customerId ?? 0) === customerId
    );
  }

  if (summaryIndex === -1) {
    this.summaryItems = [
      ...this.summaryItems,
      {
        itemId: src.id,
        name: src.name ?? "",
        quantity: 1,
        mrp: Number(src.mrp ?? 0),
        sellingPrice: unitPrice,
         // ⭐ Weighted Average Price
      weightedPrice: Number(
        src.weightedAveragePrice ?? 0
      ),
        warehouseId,
        customerId,
      } as SummaryItem & { customerId?: number ,  weightedPrice?: number;},
    ];
  } else {
    const s = { ...this.summaryItems[summaryIndex] };
    s.quantity += 1;
    s.sellingPrice = unitPrice;

     // ⭐ Keep Weighted Average Price
  s.weightedPrice = Number(
    src.weightedAveragePrice ?? 0
  );
    const copy = [...this.summaryItems];
    copy[summaryIndex] = s;
    this.summaryItems = copy;
  }

  console.log("[SalesOrder] Details:", this.model.salesOrderDetails);
  console.log("[SalesOrder] Summary:", this.summaryItems);

  this.onItemChange();
  this.triggerAutoSave();
}

  calculateTotals() {
    const total = this.summaryItems.reduce(
      (total, item) => total + item.sellingPrice * item.quantity,
      // (total, item) => total + item.purchasePrice * item.quantity,
      0,
    );
    this.total = parseFloat(total.toFixed(2));
    this.subTotal = this.total;
    // this.subTotal = parseFloat(total.toFixed(2));

    // Calculate final amount after discount
    if (this.discountType === '%') {
      this.finalAmount = this.subTotal - (this.subTotal * this.discount) / 100;
      this.subTotal = this.finalAmount;
    } else {
      this.finalAmount = this.subTotal - this.discount;
      this.subTotal = this.finalAmount;
    }

    // Add tax and VAT only if they have values
    this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;

    this.totalPayable = parseFloat(
      (this.finalAmount + this.taxAmount + this.vatAmount).toFixed(2),
    );

    this.subTotal = this.totalPayable;

    // Calculate due
    this.due = this.totalPayable - this.payment;
    this.model.tax = this.tax;
    this.model.vat = this.vat;
    this.model.totalAmount = this.totalPayable;
    this.subTotal = this.totalPayable;
  }

  // Auto calculate discount when final amount changes
  onFinalAmountChange() {
    if (this.subTotal > 0) {
      const discountAmount = this.subTotal - this.finalAmount;
      if (this.discountType === '%') {
        this.discount = (discountAmount / this.subTotal) * 100;
      } else {
        this.discount = discountAmount;
      }

      // Recalculate totals only with tax and vat if they have values
      this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
      this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
      this.totalPayable = parseFloat(
        (this.finalAmount + this.taxAmount + this.vatAmount).toFixed(2),
      );

      this.due = this.totalPayable - this.payment;

      // this.model.totalAmount = this.totalPayable;
    }
  }

  // Auto calculate final amount when discount changes
  onDiscountChange() {
    if (this.subTotal > 0) {
      if (this.discountType === '%') {
        // Calculate discount from percentage
        if (this.total === this.subTotal) {
          const discountAmount = (this.subTotal * this.discount) / 100;
          this.finalAmount = this.subTotal - discountAmount;
          this.model.discountAmount = this.discount;
        } else {
          const discountAmount = (this.total * this.discount) / 100;
          this.finalAmount = this.total - discountAmount;
          this.model.discountAmount = this.discount;
        }
        // const discountAmount = (this.subTotal * this.discount) / 100;
        // this.finalAmount = this.subTotal - discountAmount;

        // this.model.discountAmount = this.discount;
        // this.model.totalAmount = this.finalAmount;
      } else {
        // Calculate discount from fixed amount
        if (this.total === this.subTotal) {
          this.finalAmount = this.subTotal - this.discount;
          this.model.discountAmount = this.discount;
        } else {
          this.finalAmount = this.total - this.discount;
          this.model.discountAmount = this.discount;
        }
        // this.finalAmount = this.subTotal - this.discount;
        // this.model.discountAmount = this.discount;
      }

      // Recalculate totals
      this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
      this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
      this.totalPayable = this.finalAmount + this.taxAmount + this.vatAmount;
      this.due = this.totalPayable - this.payment;
      this.subTotal = this.finalAmount;
      this.triggerAutoSave();
      // this.model.totalAmount = this.totalPayable;
    }
  }

  // Auto calculate due when payment changes
  onPaymentChange() {
    this.due = this.totalPayable - this.payment;
    this.model.paidAmount = this.payment;
    this.model.dueAmount = this.due;
    this.triggerAutoSave();
    // this.model.totalAmount = this.totalPayable;
  }

  // Handle discount type change and convert values
  onDiscountTypeChange() {
    // Always record the type, even before a discount is entered, so drafts keep it
    this.model.discountType = this.discountType;
    if (this.subTotal > 0 && this.discount > 0) {
      if (this.discountType === '%') {
        // Converting from ৳ to %
        this.discount = (this.discount / this.subTotal) * 100;
        this.model.discountAmount = this.discount;

      } else {
        // Converting from % to ৳
        this.discount = (this.subTotal * this.discount) / 100;
        this.subTotal = this.totalPayable;
      }
    }
    // Recalculate totals after conversion
    this.calculateTotals();
    this.triggerAutoSave();
  }

  // Recalculate total payable when tax changes
  onTaxChange() {
    this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
    this.totalPayable = this.finalAmount + this.taxAmount + this.vatAmount;
    this.due = this.totalPayable - this.payment;
    this.model.tax = this.tax;
    this.subTotal = this.totalPayable;
    this.calculateTotals();
    this.triggerAutoSave();
  }

  // Recalculate total payable when vat changes
  onVatChange() {
    this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
    this.totalPayable = this.finalAmount + this.taxAmount + this.vatAmount;
    this.due = this.totalPayable - this.payment;
    this.model.vat = this.vat;
    this.calculateTotals();
    this.triggerAutoSave();
  }

  onPaymentMethodChange(value: number) {
    debugger
    this.selectedPaymentMethod = value;
    this.triggerAutoSave();
  }

  // Calculate return amount when cash received
  onReceivedAmountChange() {
    if (this.receivedAmount >= this.totalPayable) {
      this.returnAmount = Number(
        (this.receivedAmount - this.totalPayable).toFixed(2),
      );
      // this.returnAmount = this.receivedAmount - this.totalPayable;
      this.payment = this.totalPayable;
      this.due = 0;

      this.model.paymentMethod = this.selectedPaymentMethod;
    } else {
      this.returnAmount = 0;
      this.payment = this.receivedAmount;
      this.due = this.totalPayable - this.receivedAmount;
    }
    this.triggerAutoSave();
  }

  onSave() {
    debugger
    console.log('Sales Order saved');
    // Open the sales summary modal
    console.log('summary model', this.summaryItems);
    this.showSalesOrderSummaryModal = true;
  }

  // Toggle payment details visibility
  togglePaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
  }

  openCustomerModal() {
    this.showCustomerModal = true;
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.customerExist = false;
    this.resetCustomerForm();
  }
  onModalKeydown(event: KeyboardEvent) {
    // Close modal on Escape key
    if (event.key === 'Escape') {
      this.closeCustomerModal();
      return;
    }
  }

  getAllItems(model: any) {
    this.itemService.fetchAllItems(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        const all = res.result || [];
        this.lstItem = all.filter((it: any) => {
          const stocks =
            it.warehousestk ?? it.wareHouseStk ?? it.warehouseStock;
          // keep item if stocks is not an array OR it has entries
          return !Array.isArray(stocks) || stocks.length > 0;
        });
        // console.log(this.lstItem);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  getAllUser(model: any) {
    this.userService.fetchAllUser(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstUser = res.result;
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
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }
  getAllCustomer(model: any) {
    this.customerService
      .fetchAllCustomers(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstCustomer = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }

  createCustomer(model: any) {
    debugger;
           if(model.tenantId == 0){
            model.tenantId = this.authenticatedUser?.tenantId
          }
    this.customerService.createCustomer(model).subscribe(
      (res: ApiResponse) => {
        if (res.isSuccess) {
          this.messagHelper.showMessage(res.statusCode, res.result);
          debugger
          // Refresh the customer list and then try to select the newly created customer.
          const filter = { tenantId: this.authenticatedUser?.tenantId };
   
          this.customerService.fetchAllCustomers(filter).subscribe(
            (res2: ApiResponse) => {
              if (res2.isSuccess) {
                this.lstCustomer = res2.result;

                // Try to get created id from create response (best-case)
                let createdId: number | null = null;
                if (
                  res.result &&
                  typeof res.result === 'object' &&
                  (res.result as any).id
                ) {
                  createdId = Number((res.result as any).id);
                }

                // Fallback: match by name + contact if API returned only a message
                if (!createdId) {
                  const name = (model.name || '').toString().trim();
                  const contact = (model.contact || '').toString().trim();
                  const match = this.lstCustomer.find((c: any) => {
                    if (!name) return false;
                    if (contact) {
                      return c.name === name && (c.contact ?? '') === contact;
                    }
                    return c.name === name;
                  });
                  if (match) createdId = Number(match.id);
                }

                if (createdId) {
                  // try to find the created customer in the refreshed list
                  const match = this.lstCustomer.find(
                    (c: any) => Number(c.id) === Number(createdId),
                  );

                  if (match) {
                    // reuse the same selection flow used by the search dropdown
                    this.selectCustomer(match);
                  } else {
                    // fallback: set id + model fields and show a compact label in the search input
                    this.customer.id = createdId;
                    this.onCustomerChange(createdId);
                    this.customerSearch = `${this.customer.name ?? ''}${
                      this.customer.contact ? ' - ' + this.customer.contact : ''
                    }`;
                    setTimeout(() => (this.customerSearch = ''), 800);
                  }
                }
                this.closeCustomerModal();
              } else {
                this.messagHelper.showMessage(
                  res2.statusCode,
                  'Customer created but failed to refresh list',
                );
                this.closeCustomerModal();
              }
            },
            (err) => {
              this.messagHelper.showMessage(
                500,
                'Customer created but failed to refresh list',
              );
              this.closeCustomerModal();
            },
          );
          // this.getAllCustomer(filter);
          //  this.closeCustomerModal();
        } else {
          if (res.errorMessage && res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      },
      (err) => {
        this.messagHelper.showMessage(500, 'Failed to create customer');
      },
    );
  }

  private resetCustomerForm() {
    this.customer = new Customer();
  }

  onQuantityInput(item: any, value: any) {
    let qty = Number(value);
    if (!Number.isFinite(qty)) qty = 1;
    qty = Math.floor(qty);
    if (qty < 1) qty = 1;

    const itemId = Number(item.itemId ?? 0);
    const matNo = Number(item.materialNumber ?? 0);
    const warehouseId = Number(item.warehouseId ?? 0);
    const customerId = Number(item.customerId ?? 0);

    // Find the matching detail to check available stock
    const matchingDetail = (this.model.salesOrderDetails || []).find(
      (pd: any) => {
        const matchesItem =
          (itemId && Number(pd.itemId ?? 0) === itemId) ||
          (!itemId && matNo && Number(pd.materialNumber ?? 0) === matNo);
        const matchesWarehouse = Number(pd.warehouseId ?? 0) === warehouseId;
        return matchesItem && matchesWarehouse;
      },
    );

    const availableStock = Number(matchingDetail?.availableStock ?? 0);

    // Validate: quantity must be less than available stock
    if (qty > availableStock) {
      this.messagHelper.showMessage(
        400,
        `Cannot add more. Available stock: ${availableStock}`,
      );
      qty = Math.max(1, availableStock);
    }

    item.quantity = qty;

    // Update summaryItems to keep in sync
    (this.summaryItems || []).forEach((sItem: any) => {
      const sameItem = Number(sItem.itemId) === itemId;
      const sameWarehouse = Number(sItem.warehouseId ?? 0) === warehouseId;
      const sameCustomer = Number(sItem.customerId ?? 0) === customerId;

      if (sameItem && sameWarehouse && sameCustomer) {
        sItem.quantity = qty;
      }
    });

    // Update salesOrderDetails
    (this.model.salesOrderDetails || []).forEach((pd: any) => {
      const matchesItem =
        (itemId && Number(pd.itemId ?? 0) === itemId) ||
        (!itemId && matNo && Number(pd.materialNumber ?? 0) === matNo);
      const matchesWarehouse = Number(pd.warehouseId ?? 0) === warehouseId;

      if (matchesItem && matchesWarehouse) {
        pd.quantity = qty;
        pd.totalAmount = Number(pd.unitPrice ?? 0) * qty;
      }
    });

    // trigger table refresh and totals
    this.model.salesOrderDetails = [...(this.model.salesOrderDetails || [])];
    this.calculateTotals();
    this.triggerAutoSave();
  }
  increaseQuantity(item: any) {
    debugger
    const itemId = Number(item.itemId ?? 0);
    const matNo = Number(item.materialNumber ?? 0);
    const whId = Number(item.warehouseId ?? 0);

    // Find the matching detail to check available stock
    const matchingDetail = (this.model.salesOrderDetails || []).find(
      (pd: any) => {
        const matchesItem =
          (itemId && Number(pd.itemId ?? 0) === itemId) ||
          (!itemId && matNo && Number(pd.materialNumber ?? 0) === matNo);
        const matchesWarehouse = Number(pd.warehouseId ?? 0) === whId;
        return matchesItem && matchesWarehouse;
      },
    );

    const availableStock = Number(matchingDetail?.availableStock ?? 0);
    const newQty = Number(item.quantity ?? 0) + 1;

    // Validate: quantity must be less than available stock
    if (newQty > availableStock) {
      this.messagHelper.showMessage(
        400,
        `Cannot add more. Available stock: ${availableStock}`,
      );
      return;
    }

    item.quantity = newQty;

    (this.model.salesOrderDetails || []).forEach((pd: any) => {
      const matchesItem =
        (itemId && Number(pd.itemId ?? 0) === itemId) ||
        (!itemId && matNo && Number(pd.materialNumber ?? 0) === matNo);
      const matchesWarehouse = Number(pd.warehouseId ?? 0) === whId;

      if (matchesItem && matchesWarehouse) {
        pd.quantity = newQty;
        const price = Number(pd.unitPrice ?? pd.purchasePrice ?? 0);
        pd.totalAmount = price * newQty;
      }
    });

    // refresh table datasource and totals
    this.model.salesOrderDetails = [...(this.model.salesOrderDetails || [])];
    // this.purchaseItems = [...(this.model.salesOrderDetails || [])];
    this.onItemChange();
    this.triggerAutoSave();
  }

  decreaseQuantity(item: any) {
    const curr = Number(item.quantity ?? 1);
    const newQty = Math.max(1, curr - 1);
    item.quantity = newQty;

    const itemId = Number(item.itemId ?? 0);
    const matNo = Number(item.materialNumber ?? 0);
    const whId = Number(item.warehouseId ?? 0);

    (this.model.salesOrderDetails || []).forEach((pd: any) => {
      const matchesItem =
        (itemId && Number(pd.itemId ?? 0) === itemId) ||
        (!itemId && matNo && Number(pd.materialNumber ?? 0) === matNo);
      const matchesWarehouse = Number(pd.warehouseId ?? 0) === whId;

      if (matchesItem && matchesWarehouse) {
        pd.quantity = newQty;
        const price = Number(pd.unitPrice ?? pd.purchasePrice ?? 0);
        pd.totalAmount = price * newQty;
      }
    });

    this.model.salesOrderDetails = [...(this.model.salesOrderDetails || [])];
    // this.purchaseItems = [...(this.model.requestOrderDetails || [])];
    this.onItemChange();
    this.triggerAutoSave();
  }



deleteFromSummary(index: number) {

  // Remove the same row from summary
  this.summaryItems.splice(index, 1);

  // Remove the same row from details
  this.model.salesOrderDetails.splice(index, 1);

  // Trigger change detection
  this.summaryItems = [...this.summaryItems];
  this.model.salesOrderDetails = [...this.model.salesOrderDetails];

  this.onItemChange();
}

  onItemChange() {

  this.subTotal = (this.summaryItems || []).reduce(
    (total, item) =>
      total + Number(item.sellingPrice || 0) * Number(item.quantity || 0),
    0
  );
debugger
  (this.summaryItems || []).forEach((sItem: any, index: number) => {

    const isBaseItem = (sItem.name ?? "")
      .toUpperCase()
      .includes("BASE");

    if (isBaseItem) {

      // BASE -> update same row only
      const detail = this.model.salesOrderDetails[index];

      if (!detail) return;

      detail.quantity = Number(sItem.quantity || 0);
      detail.unitPrice = Number(sItem.sellingPrice || 0);
      detail.sellingPrice = detail.unitPrice;
      
      detail.totalAmount =
        Number(detail.quantity) * Number(detail.unitPrice);

    } else {

      // NON BASE -> existing behaviour
      (this.model.salesOrderDetails || []).forEach((pd: any) => {

        const sameItem =
          Number(pd.itemId) === Number(sItem.itemId);

        const sameWarehouse =
          Number(pd.warehouseId) === Number(sItem.warehouseId);

        const sameCustomer =
          Number(pd.customerId) === Number(sItem.customerId);

        if (sameItem && sameWarehouse && sameCustomer) {

          pd.quantity = Number(sItem.quantity || 0);
          pd.unitPrice = Number(sItem.sellingPrice || 0);
          pd.sellingPrice = pd.unitPrice;
          pd.totalAmount =
            Number(pd.quantity) * Number(pd.unitPrice);
            pd.weightedPrice = Number(sItem.weightedAveragePrice || 0);

        }

      });

    }

  });

  this.model.salesOrderDetails = [...this.model.salesOrderDetails];

  this.calculateTotals();
}

  // Calculate total value for an item (quantity × sales price)
  getItemTotal(item: SummaryItem): number {
    // this.model.totalAmount = item.quantity * item.purchasePrice;
    this.itemTotal = parseFloat((item.quantity * item.sellingPrice).toFixed(2));
    // this.itemTotal = item.quantity * item.sellingPrice;
    return this.itemTotal;
    // return item.quantity * item.purchasePrice;
  }

  // Sales order summary modal methods
  closeSalesOrderSummaryModal() {
    this.showSalesOrderSummaryModal = false;
    this.isSubmitButtonDisabled = false;
  }


  getPaymentMethodLabel(method: any, mobileBankMethod?: any): string {
    const map: Record<string, string> = {
      '1': 'Cash', Cash: 'Cash',
      '2': 'Credit', Credit: 'Credit',
      '3': 'Mobile Banking', 'Mobile Banking': 'Mobile Banking',
      '4': 'Bank', BankTransfer: 'Bank', Bank: 'Bank',
    };
    const label = map[String(method ?? '')] || '-';
    if (label === 'Mobile Banking') {
      const banks: Record<string, string> = { '1': 'bKash', '2': 'Nagad', '3': 'Rocket', '4': 'Upay' };
      const bank = banks[String(mobileBankMethod ?? '')];
      return bank ? `${label} (${bank})` : label;
    }
    return label;
  }

  printViewInvoice() {
    const section = document.getElementById('viewSection');
    if (!section) {
      alert('Invoice content not found');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Please allow popups to print the invoice.');
      return;
    }

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${this.viewSalesOrder?.invoiceNo}</title>
        <style>${this.getPrintStyles()}</style>
      </head>
      <body>
        ${section.innerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  printInvoice() {
    const section = document.getElementById('printSection');
    if (!section) {
      alert('Invoice content not found');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (!printWindow) {
      alert('Please allow popups to print the invoice.');
      return;
    }

    printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${this.model.invoiceNo}</title>
        <style>${this.getPrintStyles()}</style>
      </head>
      <body>
        ${section.innerHTML}
      </body>
    </html>
  `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }

  getPrintStyles(): string {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 100% !important;
      height: 100% !important;
    }

    body {
      font-family: Arial, sans-serif;
      margin: 10mm 20mm !important;
      padding: 0 !important;
      color: #000;
      background: white;
      overflow: visible !important;
    }

    /* Signature Section */
.signature {
  margin-top: -80px;
  display: flex;
  justify-content: flex-start;
  padding-left: 20px;
}

.signature-block {
  text-align: center;
  min-width: 200px;
  
  p {
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
}

.signature-line {
  width: 200px;
  height: 1px;
  background-color: #333;
  margin: 10px auto;
}

.signature-image {
  max-height: 60px;
  max-width: 180px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 10px auto 0;
}

.colorBank{
margin-top : 300px;
}

    /* Hide buttons and non-essential elements */
    button, .btn, .no-print, mat-icon, mat-button, .modal-actions {
      display: none !important;
    }

    /* Invoice container for print */
    .invoice-container {
      width: 100% !important;
      max-width: 100% !important;
      overflow: visible !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Center the header completely */
    .invoice-header {
      text-align: center !important;
      margin-bottom: 20px !important;
      width: 100% !important;
    }

    .company-logo {
      max-width: 80px !important;
      height: auto !important;
      margin: 0 auto 10px auto !important;
      display: block !important;
    }

    .company-logo.company-logo-lg {
      max-width: 100% !important;
      width: 100% !important;
      height: auto !important;
    }

    .invoice-header h1,
    .invoice-header .title {
      font-size: 26px !important;
      font-weight: bold !important;
      margin: 8px 0 !important;
      text-align: center !important;
    }

    .invoice-header p {
      margin: 3px 0 !important;
      font-size: 12px !important;
      text-align: center !important;
      line-height: 1.3 !important;
    }

    .invoice-header b {
      font-size: 14px !important;
      font-weight: bold !important;
    }

    /* Two column layout for invoice info */
    .invoice-info {
      display: table !important;
      width: 100% !important;
      margin: 15px 0 10px 0 !important;
      border: 1px solid #000 !important;
      border-collapse: collapse !important;
    }

    .left-info {
      display: table-cell !important;
      width: 50% !important;
      text-align: left !important;
      vertical-align: top !important;
      padding: 8px !important;
      border-right: 1px solid #000 !important;
    }

    .right-info {
      display: table-cell !important;
      width: 50% !important;
      text-align: right !important;
      vertical-align: top !important;
      padding: 8px !important;
    }

    .invoice-info p {
      margin: 2px 0 !important;
      font-size: 11px !important;
      line-height: 1.3 !important;
    }

    /* Table scroll container */
    .invoice-table-scroll {
      width: 100% !important;
      overflow: visible !important;
      margin: 0 !important;
    }

    /* Table styling */
    .invoice-table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 0 !important;
      font-size: 11px !important;
      border: 1px solid #000 !important;
    }

    .invoice-table th,
    .invoice-table td {
      border: 1px solid #000 !important;
      padding: 6px !important;
      text-align: center !important;
    }

    .invoice-table th {
      background-color: #f0f0f0 !important;
      font-weight: bold !important;
    }

    /* Right-aligned totals - positioned below table */
    .totals {
      width: 100% !important;
      // width: 45% !important;
      margin: 20px 0 0 0 !important;
      padding: 0 !important;
      text-align: right !important;
    }

    .totals p {
      // display: block !important;
      display: flex;
      justify-content: flex-end;
      margin: 0 !important;
      font-size: 11px !important;
      padding: 2px 0 !important;
      text-align: right !important;
      line-height: 1.5 !important;
    }

    .totals h4 {
      display: inline-block !important;
      // display: block !important;
      margin: 4px 0 0 0 !important;
      font-size: 12px !important;
      font-weight: bold !important;
      border-top: 1px solid #000 !important;
      padding: 6px 0 0 0 !important;
      text-align: right !important;
    }



    .payment-method-line {
      white-space: nowrap !important;
    }

    .payment-method-chip {
      display: inline-block !important;
      margin-left: 4px !important;
      background-color: #e8f1fd !important;
      color: #1a5fb4 !important;
      border: 1px solid #cfe0f7 !important;
      border-radius: 12px !important;
      padding: 2px 10px !important;
      font-size: 12px !important;
      font-weight: 500 !important;
    }

    .powered-by {
      display: block !important;
      text-align: center !important;
      margin-top: 10px !important;
      font-size: 11px !important;
      color: #939393 !important;
    }

    @page {
      margin: 10mm 15mm !important;
      size: A4 portrait !important;
    }

    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body {
        margin: 0 !important;
        padding: 10mm !important;
        width: 100% !important;
      }
      .invoice-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
  `;
  }

  submitSalesOrder() {
    debugger;
    if(this.model.paidAmount > this.model.totalAmount){
      this.model.dueAmount = 0;
    this.model.subTotal = this.subTotal;
    this.model.paidAmount = this.payment;
    this.model.customerName = this.selectedCustomer?.name;
    this.model.customerPhone = this.selectedCustomer?.contact;
    this.model.customerAddress = `${this.selectedCustomer?.addressLine1 ?? ''} ${this.selectedCustomer?.addressLine2 ?? ''}`.trim();
    this.model.addressLine1 = this.selectedCustomer?.addressLine1;
    this.model.addressLine2 = this.selectedCustomer?.addressLine2;
    // this.model.dueAmount = this.due;
    this.model.totalAmount = this.totalPayable;
    this.model.discountAmount = this.discount;
    this.model.discountType = this.discountType;
    this.model.tax = this.tax;
    this.model.vat = this.vat;
    this.model.isDraft = false;
    this.model.deliveryCharge = this.deliveryCharge;
    this.model.remarks = this.CBremarks;
    }else{
    this.model.subTotal = this.subTotal;
    this.model.paidAmount = this.payment;
    this.model.dueAmount = this.due;
    this.model.totalAmount = this.totalPayable;
    this.model.discountAmount = this.discount;
    this.model.discountType = this.discountType;
    this.model.tax = this.tax;
    this.model.vat = this.vat;
    this.model.isDraft = false;
    this.model.deliveryCharge = this.deliveryCharge;
    this.model.remarks = this.CBremarks;
    this.model.customerName = this.selectedCustomer?.name;
    this.model.customerPhone = this.selectedCustomer?.contact;
    this.model.addressLine1 = this.selectedCustomer?.addressLine1;
    this.model.addressLine2 = this.selectedCustomer?.addressLine2;
    }
    // Disable the submit button immediately to prevent multiple submissions
    this.isSubmitButtonDisabled = true;


    // Convert payment method string to numeric ID
    const paymentMethod = String(this.model.paymentMethod || '');
    if (paymentMethod === 'Cash') {
      this.model.paymentMethod = 1 as any;
    } else if (paymentMethod === 'Credit') {
      this.model.paymentMethod = 2 as any;
    } else if (paymentMethod === 'Mobile Banking') {
      this.model.paymentMethod = 3 as any;
    } else if (paymentMethod === 'BankTransfer') {
      this.model.paymentMethod = 4 as any;
    }

    debugger;

  // Check stock for ALL items
  const allItemsHaveStock = (this.model.salesOrderDetails || []).every((detail: any) =>
    this.hasStockInWarehouse(detail.itemId, detail.warehouseId)
  );

  // if (!allItemsHaveStock) {
  //   this.messagHelper.showMessage(400, 'One or more items do not have sufficient stock in the selected warehouse');
  //   this.isSubmitButtonDisabled = false; // Re-enable button
  //   return;
  // }
    this.salesOrderService
      .createSalesOrder(this.model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.messagHelper.showMessage(res.statusCode, res.result);
          this.model.remarks = "";
          this.CBremarks = '';
          this.getAllItems({ tenantId: this.authenticatedUser?.tenantId });
          // Force change detection
          this.cdr.detectChanges();

          // Use requestAnimationFrame to wait for next render cycle
          requestAnimationFrame(() => {
            // Give it one more frame to be sure
            requestAnimationFrame(() => {
              const section = document.getElementById('printSection');
              console.log('Print section found:', section);

              if (section) {
                this.printInvoice();
              } else {
                console.error('printSection not found in DOM');
                alert('Unable to print. Please try again.');
              }
            });
          });

          // Close modal after print completes
          setTimeout(() => {
            this.closeSalesOrderSummaryModal();
            this.model.invoiceNo = this.generateInvoiceNo();
            const filter = {
              tenantId: this.authenticatedUser?.tenantId,
              IsDraft: false,
              IsReturn: false,
            };
            this.getAllSalesOrderList(filter);
            this.resetAfterSubmit();
          }, 2000);
        } else {
          res.errorMessage.forEach((msg: any) =>
            this.messagHelper.showMessage(res.statusCode, msg),
          );
        }
      });
  }

  draftToSalesOrder(odj: any) {
    const a = odj;
    this.model = { ...odj };
    this.model.isDraft = false;
    this.model.isReturn = false;
    this.model.salesOrderId = odj.salesOrderId;
    // Keep the draft's discount type (% or ৳) when sending it to sales
    this.model.discountType = odj.discountType || '%';
    if (a.paymentMethod === 'Cash') {
      this.model.paymentMethod = 1;
    } else if (a.paymentMethod === 'Credit') {
      this.model.paymentMethod = 2;
    } else if (a.paymentMethod === 'Mobile Banking') {
      this.model.paymentMethod = 3;
    } else if (a.paymentMethod === 'BankTransfer') {
      this.model.paymentMethod = 4;
    }
    this.salesOrderService
      .createSalesOrder(this.model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.isSubmitButtonDisabled = true;
          // Refresh the list after successful submission
          // this.getAllSalesOrderList({ tenantId: this.authenticatedUser?.tenantId, isDraft: true });
          this.loadCompletedPurchases();
          this.messagHelper.showMessage(res.statusCode, res.result);
          this.resetAfterSubmit();
        } else {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg),
          );
        }
      });
  }
  triggerAutoSave() {
    clearTimeout(this.autoSaveTimeout);

    this.autoSaveTimeout = setTimeout(() => {
      this.autoSaveDraft();
    }, 1200); // Auto-save 2 seconds after user stops typing
    // }, 2000); // Auto-save 2 seconds after user stops typing
  }
  autoSaveDraft() {
    if (!this.model || !this.model.invoiceNo) return;

    // Prevent unnecessary API call
    const current = JSON.stringify(this.model);
    const last = JSON.stringify(this.lastSavedModel);

    if (current === last) return;

    this.isAutoSaving = true;

    // Convert payment method string to numeric ID
    let paymentMethodValue = this.model.paymentMethod || 1;
    const paymentMethodStr = String(paymentMethodValue || '');

    if (paymentMethodStr === 'Cash' || paymentMethodStr === '1') {
      paymentMethodValue = 1;
    } else if (paymentMethodStr === 'Credit' || paymentMethodStr === '2') {
      paymentMethodValue = 2;
    } else if (
      paymentMethodStr === 'Mobile Banking' ||
      paymentMethodStr === '3'
    ) {
      paymentMethodValue = 3;
    } else if (
      paymentMethodStr === 'BankTransfer' ||
      paymentMethodStr === '4'
    ) {
      paymentMethodValue = 4;
    } else {
      // Default to numeric value if already a number
      paymentMethodValue = Number(paymentMethodValue) || 1;
    }

    // Prepare payload with all required fields for new items
    const payload = {
      ...this.model,
      isDraft: true,
      invoiceNo: this.model.invoiceNo, // Preserve invoice number
      paymentMethod: paymentMethodValue, // Ensure payment method is numeric
      // Ensure new items (id: 0) are properly formatted
      salesOrderDetails: (this.model.salesOrderDetails || []).map(
        (detail: any) => ({
          ...detail,
          id: detail.id || 0, // Ensure id is 0 for new items, not undefined
          salesOrderDetailId: detail.salesOrderDetailId || '', // Empty for new items
        }),
      ),
    };
    // debugger;
    this.salesOrderService.createSalesOrder(payload).subscribe({
      next: (res: ApiResponse) => {
        if (res.isSuccess) {
          const currentInvoiceNo = this.model.invoiceNo;

          // If response contains updated model with real IDs for new items, update local model
          if (res.result && res.result.salesOrderDetails) {
            this.model.salesOrderDetails = res.result.salesOrderDetails;
          }

          this.lastSavedModel = JSON.parse(JSON.stringify(this.model));
          this.model.invoiceNo = currentInvoiceNo; // Keep same invoice number
          console.log(
            '✅ Draft auto-saved with items:',
            this.model.salesOrderDetails.length,
          );
        }
        this.isAutoSaving = false;
      },
      error: () => {
        this.isAutoSaving = false;
        console.error('Auto-save failed');
      },
    });
  }

  saveAsDraft() {
     if(this.model.paidAmount > this.model.totalAmount){
      this.model.dueAmount = 0;
     }else{
      this.model.dueAmount = this.due;
     }
    this.model.subTotal = this.subTotal;
    this.model.paidAmount = this.payment;
    // this.model.dueAmount = this.due;
    this.model.totalAmount = this.totalPayable;
    this.model.discountAmount = this.discount;
    this.model.tax = this.tax;
    this.model.remarks = this.CBremarks;
    this.model.vat = this.vat;
    this.model.isDraft = true;
    this.model.discountType = this.discountType;
    this.model.customerAddress = `${this.selectedCustomer?.addressLine1 ?? ''} ${this.selectedCustomer?.addressLine2 ?? ''}`.trim();

    // Convert payment method string to numeric ID
    const paymentMethod = String(this.model.paymentMethod || '');
    if (paymentMethod === 'Cash') {
      this.model.paymentMethod = 1 as any;
    } else if (paymentMethod === 'Credit') {
      this.model.paymentMethod = 2 as any;
    } else if (paymentMethod === 'Mobile Banking') {
      this.model.paymentMethod = 3 as any;
    } else if (paymentMethod === 'BankTransfer') {
      this.model.paymentMethod = 4 as any;
    } else if (!Number.isInteger(this.model.paymentMethod)) {
      this.model.paymentMethod = 1 as any; // Default to Cash
    }

    this.salesOrderService
      .createSalesOrder(this.model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.messagHelper.showMessage(res.statusCode, res.result);


          // Close modal after print completes
          setTimeout(() => {
            
            this.closeSalesOrderSummaryModal();
            this.model.invoiceNo = this.generateInvoiceNo();

            const filter = {
              tenantId: this.authenticatedUser?.tenantId,
              IsDraft: true,
            };
            this.getAllSalesOrderList(filter);
            this.resetAfterSubmit();
          }, 2000);
        } else {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg),
          );
        }
      });
  }

getTotalReturnAmount(row: any): number {
  if (!row || !row.salesOrderDetails) return row?.totalAmount || 0;

  // Check if any item has return quantity greater than original quantity
  const hasInvalidReturn = row.salesOrderDetails.some((detail: any) => {
    if(isNaN(detail.returnQuantity) || detail.returnQuantity == 0){
      return row?.totalAmount - (detail.returnTotalAmount || 0) < 0;
    } else{
      const returnQty = Number(detail.returnQuantity || 0);
    const originalQty = Number(detail.quantity || 0);
    return returnQty > originalQty;
    }
    });
    
  

  // If invalid return found, return original total (don't calculate)
  // if (hasInvalidReturn) {
  //   return row.totalAmount || 0;
  // }

  // Calculate total return amount from all items
  const totalReturnAmount = row.salesOrderDetails.reduce(
    (sum: number, detail: any) => {
      return sum + (detail.returnTotalAmount || 0);
    },
    0,
  );

  // Calculate new total amount
  let newTotalAmount = (row.totalAmount || 0) - totalReturnAmount;

  // Ensure never goes negative
  if (newTotalAmount < 0) {
    newTotalAmount = 0;
  }

  return parseFloat(newTotalAmount.toFixed(2));
}
  
  getReturnedItemsForView(details: any[]): any[] {
    if (!details || details.length === 0) return [];

    return details.filter((detail) => {
      const returnQty = Number(detail.returnQuantity || 0);
      return returnQty > 0;
    });
  }

  // Calculate total return amount for view modal
  getTotalReturnAmountForView(details: any[]): number {
    if (!details || details.length === 0) return 0;

    return details.reduce((sum: number, detail: any) => {
      const returnQty = Number(detail.returnQuantity || 0);
      const unitPrice = Number(detail.unitPrice || 0);
      return sum + returnQty * unitPrice;
    }, 0);
  }

  customerCheck() {
    const contact = this.customer.contact; // Get the contact to check
    // const name = this.customer.name; // Get the contact to check
    if (!contact) {
      console.log('No contact provided');
      return;
    }

    // Check if the contact exists in the customer list
    const exists = this.lstCustomer.some(
      (customer) => customer.contact === contact,
    );

    if (exists) {
      this.customerExist = true;
      console.log(`Contact ${contact} exists in the customer list.`);
    } else {
      this.customerExist = false;
      console.log(`Contact ${contact} does not exist in the customer list.`);
    }
  }

  customerSuggestions: any[] = []; // Array to hold filtered suggestions

  onCustomerInputChange() {
    const contact = this.customer.contact?.toLowerCase() || '';
    if (contact) {
      this.customerSuggestions = this.lstCustomer.filter((customer) =>
        customer.contact?.toLowerCase().includes(contact),
      );
    } else {
      this.customerSuggestions = [];
    }
  }

  selectCustomerSuggestion(contact: string) {
    this.customer.contact = contact;
    this.customerSuggestions = [];
    this.customerCheck();
  }

  resetAfterSubmit() {
    // regenerate invoice for next order
    this.model = new SalesOrder();
    this.model.invoiceNo = this.generateInvoiceNo();
    this.model.salesOrderDate = new Date().toISOString().split('T')[0];
    this.model.tenantId = Number(this.authenticatedUser?.tenantId);

    // clear details & summary
    this.model.salesOrderDetails = [];
    this.summaryItems = [];
    // trigger mat-table change detection
    this.model.salesOrderDetails = [...this.model.salesOrderDetails];

    // Reset customer-related fields
    this.model.customerId = 0;
    this.model.customerName = '';
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.showCustomerDropdown = false;

    // clear search / dropdown / selections
    this.itemSearch = '';
    this.filteredItems = [];
    this.filteredCustomers = [];
    this.showItemDropdown = false;
    this.selectedDropdownIndex = -1;
    this.selectedCustomer = null;
    this.selectedWarehouse = null;
    this.selectedCustomer = null;
    this.selectedWarehouse = null;
    this.selectedWarehouseId = 0;

    // reset totals & payment fields
    this.subTotal = 0;
    this.discount = 0;
    this.finalAmount = 0;
    this.tax = 0;
    this.vat = 0;
    this.totalPayable = 0;
    this.payment = 0;
    this.due = 0;
    this.receivedAmount = 0;
    this.returnAmount = 0;

    // close modals if any
    this.showSalesOrderSummaryModal = false;
  }

  getAllSalesOrderList(filter: any, excludeReturned: boolean = false) {
    // Draft list and Completed Sales list page separately
    const page = filter.IsDraft === true ? this.draftPage : this.completedPage;
    filter.pageIndex = filter.pageIndex ?? page.pageIndex;
    filter.pageSize = filter.pageSize ?? page.pageSize;

    // Show loader before API call
    // this.isLoadingOrderList = true;
    debugger
    this.salesOrderService.fetchAllSalesOrder(filter).subscribe(
      (res: ApiResponse) => {
        // Hide loader after API response
        this.isLoadingOrderList = false;

        if (res.isSuccess) {
          let result = res.result || [];
          page.total = this.getTotalCount(res, result, page);
          this.lstPurchase = result;
          this.lstSalesOrder = result;
          console.log(result);

          // Filter out fully returned orders from Completed Sales tab
          if (excludeReturned) {
            result = result.filter((order: any) => order.isReturn !== true);
          }

          // Deduplicate drafts by invoice number - keep only latest version
          if (filter.IsDraft === true) {
            result = this.deduplicateDraftsByInvoiceNo(result);
          }
          // Initialize returnQuantity to null for new returns (blank field), preserve for returned items
          result.forEach((order: { salesOrderDetails: any[] }) => {
            if (
              order.salesOrderDetails &&
              Array.isArray(order.salesOrderDetails)
            ) {
              order.salesOrderDetails.forEach((detail) => {
                // Only reset if not already returned
                if (detail.isReturn !== true) {
                  // detail.returnQuantity = null;  // Blank input field for new returns
                }
                // For returned items (isReturn === true), keep the API value
              });
            }
          });

          this.lstPurchase = result;
        } else {
          this.lstPurchase = [];
          page.total = 0;
        }
      },
      (error) => {
        // Hide loader on error
        this.isLoadingOrderList = false;
        console.error('Error fetching sales orders:', error);
      },
    );
  }

  private deduplicateDraftsByInvoiceNo(orders: any[]): any[] {
    // Filter to only keep actual drafts, exclude any completed orders
    const draftsOnly = orders.filter((order) => order.isDraft !== false);

    const invoiceMap = new Map<string, any>();

    draftsOnly.forEach((order) => {
      const invoiceNo = order.invoiceNo;
      const existing = invoiceMap.get(invoiceNo);

      // Keep the one with the highest ID (most recent draft)
      if (!existing || Number(order.id || 0) > Number(existing.id || 0)) {
        invoiceMap.set(invoiceNo, order);
      }
    });

    return Array.from(invoiceMap.values());
  }
  getAllReturnSalesOrderList(filter: any) {
    filter.pageIndex = filter.pageIndex ?? this.returnPage.pageIndex;
    filter.pageSize = filter.pageSize ?? this.returnPage.pageSize;

    this.salesOrderService
      .fetchAllReturnSalesOrder(filter)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstReturnedSales = res.result || [];
          this.returnPage.total = this.getTotalCount(res, this.lstReturnedSales, this.returnPage);
          // Force re-render of completed sales to reflect filtered items
          // this.lstPurchase = [...this.lstPurchase];
        } else {
          this.lstReturnedSales = [];
          this.returnPage.total = 0;
        }
      });
  }

  syncInvoice() {
    this.model.invoiceNo = this.generateInvoiceNo();
  }

  generateInvoiceNo(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Pattern: SO-YYYYMMDD-HHMMSS-XXX
    return `IN-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
      d.getDate(),
    )}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(
      d.getSeconds(),
    )}-${Math.floor(Math.random() * 900 + 100)}`;
  }

  hideItemDropdown() {
    // small delay so click on dropdown option registers before it closes
    setTimeout(() => {
      this.showItemDropdown = false;
      this.selectedDropdownIndex = -1;
    }, 150);
  }
}
