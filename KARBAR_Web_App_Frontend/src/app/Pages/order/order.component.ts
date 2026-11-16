import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
import { Order } from '../../Model/order';
import { OrderService } from '../../Services/order.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { InputComponent } from '../../Common/Component/input/input.component';
import { MatChipListbox, MatChipOption } from "@angular/material/chips";

export interface PurchaseItem {
  itemCode: string;
  itemName: string;
  brandName: string;
  category: string;
  subCategory: string;
  unit: string;
  purchasePrice: number;
}

export interface SummaryItem {
  itemId?: number;
  name: string;
  quantity: number;
  mrp: number;
  purchasePrice: number;
  warehouseId?: number;
}

export interface NewSupplier {
  name: string;
  type: string;
  phone: string;
  address: string;
}


@Component({
  selector: 'app-order',
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
    MatChipListbox,
    MatChipOption
],
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})

export class OrderComponent {


approveModel: {
  invoiceNo: string;
  bergerRecievedStatus: string;
} = {
  invoiceNo: '',
  bergerRecievedStatus: ''
};
  // selectedSupplier: string = '';
  // itemSearch: string = '';
  purchaseDate: Date = new Date();
  selectedPaymentMethod: string = '';
  isEditMode: boolean = false;
  invoiceError: boolean = false;

  // Payment method specific fields
  checkNumber: string = '';
  cardNumber: string = '';
  selectedBank: string = '';
  selectedMobileBankingMethod: string = '';
  mobileNumber: string = '';
  showPaymentDetails: boolean = false; // Toggle for payment details section
  supplier: Supplier = new Supplier();

  // Modal properties
  showSupplierModal: boolean = false;
  showPurchaseSummaryModal: boolean = false;
  selectedSupplier: any = null;
  selectedSupplierId: number = 0;


  displayedColumns: string[] = [
    'materialNumber',
    'itemName',
    'currentStock',
    'brandName',
    'category',
    'purchasePrice',
    'warehouse',
    'quantity',
    'totalAmount',
  ];

  subTotal: number = 0;
  discount: number = 0;
  discountType: string = '%'; // Add discount type property
  finalAmount: number = 0;
  tax: number = 0;
  vat: number = 0;
  totalPayable: number = 0;
  payment: number = 0;
  due: number = 0;
  receivedAmount: number = 0; // Cash received from customer
  returnAmount: number = 0; // Change to return to customer

  lstSuppler: Supplier[] = [];
  lstPurchase: any[] = [];
  displayedCompletedColumns: string[] = [
    'purchaseInvoiceNo',
    'purchaseDate',
    'supplier',
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
  authenticatedUser: AuthenticatedUser | null = null;
  searchModelSettings: Settings = new Settings();
  selectedWarehouseId: number = 0; // For dropdown binding
  itemSearch: string = '';
  filteredItems: any[] = [];
  summaryItems: SummaryItem[] = [];
  showItemDropdown: boolean = false;
  selectedDropdownIndex: number = -1;

  model: Order = new Order();

  // get purchaseItems(): any[] {
  //   return this.model.purchaseDetails || [];
  // }

  purchaseItems: any[] = [];

  constructor(
    private supplierService: SupplierService,
    private messagHelper: MessageHelperService,
    private settingsService: SettingsService,
    private orderService: OrderService,
    private itemService: ItemService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet
  ) {
    this.calculateTotals();
  }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.supplier.tenantId = this.authenticatedUser?.tenantId;
    this.model.requestOrderDetails = [];
    this.purchaseItems = [...(this.model.requestOrderDetails || [])];
    this.summaryItems = [];
    this.getAllSuppliers(this.supplier);
    this.getAllWarehouse(this.supplier);
    // this.supplier.brandId = 7;
    this.supplier.IsBergerItem = true;
    this.getAllItems(this.supplier);
    this.model.purchaseDate = new Date().toISOString().split('T')[0];
    this.model.tenantId = Number(this.authenticatedUser?.tenantId);
    
  }

  onWarehouseChange(warehouseId: number) {
    // Store selected warehouse for NEW items only — do not mutate existing rows
    this.selectedWarehouseId = warehouseId;
    const selectedWarehouse = this.lstWarehouses.find(
      (w: any) => w.id === warehouseId
    );
    if (selectedWarehouse) {
      this.searchModelSettings.warehouseId = selectedWarehouse.id.toString();
    }
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.index === 1) {
      this.loadCompletedPurchase();
    }
  }
  getWarehouseName(warehouseId: number | string | undefined | null): string {
    if (!warehouseId) return '';
    
    const warehouse = (this.lstWarehouses || []).find((w: any) => {

      return Number(w.id) === Number(warehouseId) || w.warehouseId === warehouseId;
    });
    
    console.log('✅ Found warehouse:', warehouse);
    return warehouse?.name || '';
  }


    getShortName(name: string | undefined | null): string {
    if (!name) return '';
    const parts = ('' + name).trim().split(/\s+/);
    if (parts.length <= 1) return parts.join(' ');
    return parts.slice(0, 1).join(' ') + '...';
  }

  setDefaultSupplierBerger(): void {
  const berger = (this.lstSuppler || []).find(
    (s: any) => ((s.name || '') as string).toLowerCase().includes('berger')
  );
  if (berger) {
    this.selectedSupplierId = Number(berger.id);
    this.onSupplierChange(this.selectedSupplierId);
  }
}

  // private loadCompletedPurchases() {
  //   if (this.completedLoaded) return;
  //   const filter = { tenantId: this.authenticatedUser?.tenantId };
  //   this.getAllpurchaseList(filter);
  //   this.completedLoaded = true;
  // }

  loadCompletedPurchase() {
    if (this.completedLoaded) return;
    const model = { tenantId: this.authenticatedUser?.tenantId };
    if(this.authenticatedUser.roleId == 1 || this.authenticatedUser.roleId == 2 ){
      const model = { tenantId: 0 };
      this.getAllpurchaseList(model);
    } else{
      this.getAllpurchaseList(model);
    }
    this.completedLoaded = true;
  }

onStatusChange(row: any) {
  debugger
  // console.log('Updated row:', row);
  this.approveModel.invoiceNo = row.purchaseInvoiceNo;
  if(row.status == 0){
    this.approveModel.bergerRecievedStatus = 'Pending';
  } else{
    this.approveModel.bergerRecievedStatus = 'Completed';
  }
  console.log('Approve Model:', this.approveModel);

     this.orderService.updateStatus(this.approveModel).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, 'Status updated successfully.');
      } else {
        this.messagHelper.showMessage(res.statusCode, 'Status Not updated successfully.');
      }
    });

  // call API or update local state here
}

compareStatus(a: any, b: any): boolean {
  return a == b; // loose equality to handle string/number mismatch
}

  onSupplierChange(supplierId: number) {
  this.selectedSupplierId = Number(supplierId ?? 0);
  this.selectedSupplier = (this.lstSuppler || []).find((s: any) => Number(s.id) === Number(this.selectedSupplierId)) || null;

  // Keep the existing supplier model id for modal form if needed
  this.supplier.id = this.selectedSupplier?.id ?? this.supplier.id;
}

  onItemSearchChange() {
    debugger
    // const q = (this.itemSearch || '').trim().toLowerCase();
      const q = (this.itemSearch || '').toLowerCase(); // do NOT trim — preserve spaces

    if (!q) {
      this.filteredItems = this.lstItem || [];
    } else {
      this.filteredItems = (this.lstItem || []).filter((it: any) => {
        const name = (it.name ?? '').toString().toLowerCase();
        const materialNumber = (it.materialNumber ?? '').toString().toLowerCase();
        const brand = (it.brandName ?? '').toString().toLowerCase();
        const barcode = (it.barcode ?? '').toString().toLowerCase();
        const category = (it.categoryName ?? '').toString().toLowerCase();
        return (
          name.includes(q) ||
          materialNumber.includes(q) ||
          brand.includes(q) ||
          barcode.includes(q) ||
          category.includes(q)
        );
      });
    }
    this.selectedDropdownIndex = -1;
    this.showItemDropdown = true;
  }

  onItemSearchFocus() {
    this.filteredItems = this.lstItem || [];
    this.selectedDropdownIndex = -1;
    this.showItemDropdown = true;
  }

  onItemSearchKeydown(event: KeyboardEvent) {
    if (!this.showItemDropdown || this.filteredItems.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedDropdownIndex = Math.min(
          this.selectedDropdownIndex + 1,
          this.filteredItems.length - 1
        );
        this.scrollToSelected();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedDropdownIndex = Math.max(
          this.selectedDropdownIndex - 1,
          0
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
    if(this.selectedWarehouseId === 0){
      this.messagHelper.showMessage(400, 'WareHouse selection  is required.');
    } else{
    this.addItemToPurchase(item);
    this.itemSearch = `${item.name} - ${item.brandName}`;
    this.showItemDropdown = false;
    this.selectedDropdownIndex = -1;
    // Clear the search after a short delay to show what was selected

    setTimeout(() => {
      this.itemSearch = '';
      this.filteredItems = [];
    }, 1500);
    }

  }

  hideItemDropdown() {
    setTimeout(() => {
      this.showItemDropdown = false;
    }, 200);
  }
getItemStock(row: any): number {
  // Use the row's warehouse first; fall back to current selection for brand-new rows
  const targetWarehouseId = Number(row?.warehouseId ?? this.selectedWarehouseId ?? 0);

  // Find the source item in the full item list (by materialNumber or id)
  const src = (this.lstItem || []).find((it: any) => {
    const itKey = Number(it.materialNumber ?? it.id ?? 0);
    const rowKey = Number(row.materialNumber ?? row.itemId ?? 0);
    return itKey === rowKey;
  });

  if (!src) {
    // Fallback to any stock value carried on the row itself
    return Number(row.availableStock ?? 0);
  }

  // Prefer per-warehouse stock if available
  const stocks = src.warehousestk ?? src.warehouse ?? src.stocks ?? [];
  if (Array.isArray(stocks) && targetWarehouseId) {
    const match = stocks.find((w: any) => Number(w.warehouseId ?? w.id) === targetWarehouseId);
    if (match) return Number(match.qty ?? match.quantity ?? match.itemQty ?? 0);
  }

  // Fallback to overall counters if no per-warehouse match
  return Number(src.availableStock ?? src.stock ?? src.totalCount ?? 0);
}
  confirmItemSearch() {
  const q = (this.itemSearch || ''); // keep spaces so they count
  if (!q || !this.lstItem?.length) return;

  // Use same matching logic as the live filter:
  const lowerQ = q.toLowerCase();
  const match =
    this.filteredItems[0] ||
    this.lstItem.find((it: any) => {
      return (
        (it.name ?? '').toString().toLowerCase().includes(lowerQ) ||
        (it.barcode ?? '').toString().toLowerCase().includes(lowerQ)
      );
    });

  if (match) {
    this.addItemToPurchase(match);
    this.itemSearch = `${match.name} - ${match.brandName}`;
    this.filteredItems = [];
    this.showItemDropdown = false;
    setTimeout(() => {
      this.itemSearch = '';
    }, 1500);
  }
}

onQuantityInput(item: any, value: any) {
  let qty = Number(value);
  if (!Number.isFinite(qty)) qty = 1;
  qty = Math.floor(qty);
  if (qty < 1) qty = 1;

  item.quantity = qty;

  const itemId = Number(item.itemId ?? 0);
  const matNo = Number(item.materialNumber ?? 0);
  const warehouseId = Number(item.warehouseId ?? 0);

  (this.model.requestOrderDetails || []).forEach((pd: any) => {
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
  this.model.requestOrderDetails = [...(this.model.requestOrderDetails || [])];
  this.onItemChange();
}

  private addItemToPurchase(src: any) {
    debugger
    const warehouseId = Number(this.selectedWarehouseId ?? this.searchModelSettings?.warehouseId ?? 0);
    const supplierId = Number(this.supplier?.id ?? 0);
    
    const currentWarehouse = (this.lstWarehouses || []).find((w: any) => Number(w.id) === warehouseId);
    const currentSupplier = (this.lstSuppler || []).find((s: any) => Number(s.id) === supplierId);
    const supplierName = (currentSupplier?.name ?? '');

    const materialNumber = Number(src.materialNumber ?? src.materialNumber ?? 0);
    const unitPrice = Number(src.purchasePrice ?? src.purchasePrice ?? 0) || 0;

    // ensure arrays exist
    this.model.requestOrderDetails = this.model.requestOrderDetails ?? [];
    this.summaryItems = this.summaryItems ?? [];

    // find by item + warehouse + supplier
    const existing = (this.model.requestOrderDetails || []).find((r: any) =>
      Number(r.materialNumber) === materialNumber &&
      Number(r.warehouseId ?? 0) === warehouseId &&
      Number(r.supplierId ?? 0) === supplierId
    );

    if (existing) {
      existing.quantity = Number(existing.quantity ?? 0) + 1;
      existing.unitPrice = unitPrice;
      existing.totalAmount = Number(existing.unitPrice) * existing.quantity;
    } else {
   
      const newItem = {
        id: 0,
        purchaseOrderDetailId: '',
        // Item
        itemId: Number(src.id ?? 0),
        materialNumber: src.materialNumber,
        itemCode: src.itemCode ?? src.itemId ?? src.code ?? '',
        itemName: src.name ?? '',
        brandName: src.brandName ?? '',
        category: src.categoryName ?? '',
        // UOM
        uomId: src.uomId ?? 0,
        uomName: src.uomName ?? '',
        unit: src.uomName ?? src.unit ?? '',
        // Warehouse & Supplier
        warehouseId: warehouseId,
        warehouse: currentWarehouse?.name ?? '',
        supplierId: supplierId,
        supplierName: currentSupplier?.name ?? src.supplierName ?? '',
        supplier: currentSupplier?.name ?? src.supplierName ?? '',
        // Pricing & qty
        quantity: 1,
        unitPrice: unitPrice,
        purchasePrice: unitPrice,
        totalAmount: unitPrice * 1,
        // Tax / VAT
        tax: Number(src.tax ?? 0),
        vat: Number(src.vat ?? 0),
        vatAmount: Number(src.vatAmount ?? 0),
        // Dates (provide defaults so type matches)
        purchaseDate: new Date().toISOString(),
        recievedDate: '',
        // ts variant expected in error message
        recievedDatets: '',
      };
      this.model.requestOrderDetails.push(newItem);
    }

    // trigger change detection for mat-table and keep purchaseItems in sync
    this.model.requestOrderDetails = [...this.model.requestOrderDetails];
    this.purchaseItems = [...this.model.requestOrderDetails];

    // update summaryItems (keep keyed by item+warehouse+supplier)
    const summaryIndex = this.summaryItems.findIndex((x: any) =>
      Number(x.materialNumber ?? 0) === materialNumber &&
      Number(x.warehouseId ?? 0) === warehouseId &&
      Number(x.supplierId ?? 0) === supplierId
    );

    // if (summaryIndex === -1) {
    //   this.summaryItems = [
    //     ...this.summaryItems,
    //     {
    //       materialNumber: materialNumber,
    //       itemCode: src.itemCode ?? '',
    //       name: src.name ?? '',
    //       quantity: 1,
    //       unit: src.uomName ?? '',
    //       mrp: Number(src.mrp ?? 0),
    //       purchasePrice: unitPrice,
    //       vat: Number(src.vat ?? 0),
    //       vatAmount: Number(src.vatAmount ?? 0),
    //       warehouseId,
    //       warehouseName: currentWarehouse?.name ?? '',
    //       supplierId,
    //       supplierName: currentSupplier?.name ?? ''
    //     } as any
    //   ];
    // } 
    if (summaryIndex === -1) {
  this.summaryItems = [
    ...this.summaryItems,
    {
      itemId: Number(src.id ?? 0),
      materialNumber: materialNumber,  // already present
      itemCode: src.itemCode ?? '',
      name: src.name ?? '',
      quantity: 1,
      unit: src.uomName ?? '',
      mrp: Number(src.mrp ?? 0),
      purchasePrice: unitPrice,
      vat: Number(src.vat ?? 0),
      vatAmount: Number(src.vatAmount ?? 0),
      warehouseId,
      warehouseName: currentWarehouse?.name ?? '',
      supplierId,
      supplierName: currentSupplier?.name ?? ''
    } as any
  ];
}
    else {
      const s = { ...this.summaryItems[summaryIndex] };
      s.quantity = Number(s.quantity ?? 0) + 1;
      // recompute vatAmount if using percentage
      // if (s.vat) s.vatAmount = +(((s.purchasePrice ?? 0) * s.quantity) * (s.vat / 100));
      const copy = [...this.summaryItems];
      copy[summaryIndex] = s;
      this.summaryItems = copy;
    }

    // recalc totals / UI updates
    this.onItemChange?.();

    // debugging help (remove in production)
    console.log('requestOrderDetails:', this.model.requestOrderDetails);
    console.log('purchaseItems (table datasource):', this.purchaseItems);
  }

  calculateTotals() {
    // Calculate sub total from summary items (qty * price)
    this.subTotal = this.summaryItems.reduce(
      (total, item) => total + item.purchasePrice * item.quantity,
      0
    );

    // Calculate final amount after discount
    if (this.discountType === '%') {
      this.finalAmount = this.subTotal - (this.subTotal * this.discount) / 100;
    } else {
      this.finalAmount = this.subTotal - this.discount;
    }

    // Add tax and VAT only if they have values
    const taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    const vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;

    this.totalPayable = this.finalAmount + taxAmount + vatAmount;

    // Calculate due
    this.due = this.totalPayable - this.payment;
    this.model.tax = this.tax;
    this.model.vat = this.vat;
    this.model.totalAmount = this.totalPayable;
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
      const taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
      const vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
      this.totalPayable = this.finalAmount + taxAmount + vatAmount;
      this.due = this.totalPayable - this.payment;
      // this.model.totalAmount = this.totalPayable;
    }
  }

  // Auto calculate final amount when discount changes
  onDiscountChange() {
    if (this.subTotal > 0) {
      if (this.discountType === '%') {
        // Calculate discount from percentage
        const discountAmount = (this.subTotal * this.discount) / 100;
        this.finalAmount = this.subTotal - discountAmount;

        this.model.discountAmount = this.discount;
        // this.model.totalAmount = this.finalAmount;
      } else {
        // Calculate discount from fixed amount
        this.finalAmount = this.subTotal - this.discount;
        this.model.discountAmount = this.discount;
        // this.model.totalAmount = this.finalAmount;
      }

      // Recalculate totals
      const taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
      const vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
      this.totalPayable = this.finalAmount + taxAmount + vatAmount;
      this.due = this.totalPayable - this.payment;
      // this.model.totalAmount = this.totalPayable;
    }
  }

  // Auto calculate due when payment changes
  onPaymentChange() {
    this.due = this.totalPayable - this.payment;
    // this.model.totalAmount = this.totalPayable;
  }

  // Handle discount type change and convert values
  onDiscountTypeChange() {
    if (this.subTotal > 0 && this.discount > 0) {
      if (this.discountType === '%') {
        // Converting from ৳ to %
        this.discount = (this.discount / this.subTotal) * 100;
        this.model.discountAmount = this.discount;
      } else {
        // Converting from % to ৳
        this.discount = (this.subTotal * this.discount) / 100;
      }
    }
    // Recalculate totals after conversion
    this.calculateTotals();
  }

  // Recalculate total payable when tax changes
  onTaxChange() {
    const taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    const vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
    this.totalPayable = this.finalAmount + taxAmount + vatAmount;
    this.due = this.totalPayable - this.payment;
    this.model.tax = this.tax;
    this.calculateTotals();
  }

  // Recalculate total payable when vat changes
  onVatChange() {
    const taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    const vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
    this.totalPayable = this.finalAmount + taxAmount + vatAmount;
    this.due = this.totalPayable - this.payment;
    this.model.vat = this.vat;
    this.calculateTotals();
  }

  // Calculate return amount when cash received
  onReceivedAmountChange() {
    if (this.receivedAmount >= this.totalPayable) {
      this.returnAmount = this.receivedAmount - this.totalPayable;
      this.payment = this.totalPayable;
      this.due = 0;

      this.model.paymentMethod = this.selectedPaymentMethod;
    } else {
      this.returnAmount = 0;
      this.payment = this.receivedAmount;
      this.due = this.totalPayable - this.receivedAmount;
    }
  }

  onSave() {
    console.log('Purchase saved');
    // Open the purchase summary modal
    this.showPurchaseSummaryModal = true;
  }

  // Toggle payment details visibility
  togglePaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
  }



  getAllItems(model: any) {
    debugger
    this.model.IsBergerItem = true;
    this.itemService.fetchAllItems(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstItem = res.result;
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
  getAllSuppliers(model: any) {
    this.supplierService
      .fetchAllSuppliers(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstSuppler = res.result;
          this.setDefaultSupplierBerger();
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }

  // Quantity control methods
  // increaseQuantity(item: SummaryItem) {
  //   item.quantity++;
  //   this.model.purchaseDetails.forEach((pd: any) => {
  //     if (
  //       pd.itemId === item.itemId &&
  //       Number(pd.warehouseId ?? 0) === Number(item.warehouseId ?? 0)
  //     ) {
  //       pd.quantity = item.quantity;
  //       pd.totalAmount = pd.unitPrice * pd.quantity;
  //     }
  //   });
  //   // trigger table update
  //   this.model.purchaseDetails = [...this.model.purchaseDetails];
  //   this.onItemChange();
  // }

  increaseQuantity(item: any) {
  const newQty = Number(item.quantity ?? 0) + 1;
  item.quantity = newQty;

  const itemId = Number(item.itemId ?? 0);
  const matNo = Number(item.materialNumber ?? 0);
  const whId = Number(item.warehouseId ?? 0);

  (this.model.requestOrderDetails || []).forEach((pd: any) => {
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
  this.model.requestOrderDetails = [...(this.model.requestOrderDetails || [])];
  this.purchaseItems = [...(this.model.requestOrderDetails || [])];
  this.onItemChange();
}

  // decreaseQuantity(item: SummaryItem) {
  //   if (item.quantity > 1) {
  //     item.quantity--;
  //     this.model.purchaseDetails.forEach((pd: any) => {
  //       if (
  //         pd.itemId === item.itemId &&
  //         Number(pd.warehouseId ?? 0) === Number(item.warehouseId ?? 0)
  //       ) {
  //         pd.quantity = item.quantity;
  //         pd.totalAmount = pd.unitPrice * pd.quantity;
  //       }
  //     });
  //     this.model.purchaseDetails = [...this.model.purchaseDetails];
  //     this.onItemChange();
  //   }
  // }

  decreaseQuantity(item: any) {
  const curr = Number(item.quantity ?? 1);
  const newQty = Math.max(1, curr - 1);
  item.quantity = newQty;

  const itemId = Number(item.itemId ?? 0);
  const matNo = Number(item.materialNumber ?? 0);
  const whId = Number(item.warehouseId ?? 0);

  (this.model.requestOrderDetails || []).forEach((pd: any) => {
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

  this.model.requestOrderDetails = [...(this.model.requestOrderDetails || [])];
  this.purchaseItems = [...(this.model.requestOrderDetails || [])];
  this.onItemChange();
}

  // deleteFromSummary(sItem: any) {
  //   const itemId = Number(sItem.itemId ?? 0);
  //   const warehouseId = Number(sItem.warehouseId ?? 0);
  //   // const supplierId = Number(sItem.supplierId ?? 0);

  //   this.summaryItems = (this.summaryItems || []).filter(
  //     (s) =>
  //       !(
  //         Number(s.itemId ?? 0) === itemId &&
  //         Number(s.warehouseId ?? 0) === warehouseId
  //       )
  //   );

  //   this.model.purchaseDetails = (this.model.purchaseDetails || []).filter(
  //     (p) =>
  //       !(
  //         Number(p.itemId ?? 0) === itemId &&
  //         Number(p.warehouseId ?? 0) === warehouseId
  //       )
  //   );

  //   // sync table datasource
  //   this.model.purchaseDetails = [...this.model.purchaseDetails];
  //   this.purchaseItems = [...this.model.purchaseDetails];

  //   this.onItemChange?.();
  // }

  deleteFromSummary(sItem: any) {
  const itemId = Number(sItem.itemId ?? 0);
  const matNo = (sItem.materialNumber ?? 0);
  const warehouseId = Number(sItem.warehouseId ?? 0);

  // Remove from summary by itemId+warehouse or materialNumber+warehouse
  this.summaryItems = (this.summaryItems || []).filter((s: any) => {
    const sItemId = Number(s.itemId ?? 0);
    const sMatNo = (s.materialNumber ?? 0);
    const sWh = Number(s.warehouseId ?? 0);

    const matchById = itemId && sItemId === itemId && sWh === warehouseId;
    const matchByMat = !itemId && matNo && sMatNo === matNo && sWh === warehouseId;

    return !(matchById || matchByMat);
  });

  // Remove matching row(s) from the table datasource (purchaseDetails)
  this.model.requestOrderDetails = (this.model.requestOrderDetails || []).filter((p: any) => {
    const pItemId = Number(p.itemId ?? 0);
    const pMatNo = Number(p.materialNumber ?? 0);
    const pWh = Number(p.warehouseId ?? 0);

    const matchById = itemId && pItemId === itemId && pWh === warehouseId;
    const matchByMat = !itemId && matNo && pMatNo === matNo && pWh === warehouseId;

    return !(matchById || matchByMat);
  });

  // Sync table datasource and totals
  this.model.requestOrderDetails = [...this.model.requestOrderDetails];
  this.purchaseItems = [...this.model.requestOrderDetails];
  this.onItemChange?.();
}

  // Recalculate when any item property changes
  onItemChange() {
    // Calculate sub total from summary items
    this.subTotal = this.summaryItems.reduce(
      (total, item) => total + item.purchasePrice * item.quantity,
      0
    );
    // Sync quantities and prices from summaryItems back to purchaseDetails
    this.summaryItems.forEach((sItem: SummaryItem) => {
      this.model.requestOrderDetails.forEach((pd: any) => {
        if (
          pd.itemId === sItem.itemId &&
          Number(pd.warehouseId ?? 0) === Number(sItem.warehouseId ?? 0)
        ) {
          pd.quantity = sItem.quantity;
          pd.unitPrice = sItem.purchasePrice;
          pd.totalAmount = sItem.purchasePrice * sItem.quantity;
        }
      });
    });
    this.calculateTotals();
  }

  // Calculate total value for an item (quantity × purchase price)
  getItemTotal(item: SummaryItem): number {
    // this.model.totalAmount = item.quantity * item.purchasePrice;
    return item.quantity * item.purchasePrice;
  }

  // Purchase summary modal methods
  closePurchaseSummaryModal() {
    this.showPurchaseSummaryModal = false;
  }

submitPurchase() {
  // Ensure each purchase detail carries the selected supplier
  const selId = Number(this.selectedSupplierId ?? 0);
  if (selId && Array.isArray(this.model.requestOrderDetails)) {
    const supplierName = this.selectedSupplier?.name ?? '';
    for (const d of this.model.requestOrderDetails) {
      d.supplierId = selId;
      // keep supplierName in sync for UI/back-end if needed
      // if (!d.supplierName) d.supplierName = supplierName;
    }
    // keep table datasource in sync if you use it
    this.purchaseItems = [...(this.model.requestOrderDetails || [])];
  }

  // if (!this.model.purchaseInvoiceNo || this.model.purchaseInvoiceNo.trim() === '') {
  //   this.invoiceError = true;
  //   this.messagHelper.showMessage(400, 'Invoice number is required.');
  //   return;
  // }

  this.orderService.createOrder(this.model).subscribe((res: ApiResponse) => {
    // if (this.model.purchaseInvoiceNo && this.model.purchaseInvoiceNo.trim() !== '') {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);

        // Close summary modal and refresh list
        this.closePurchaseSummaryModal();
        const filter = { tenantId: this.authenticatedUser?.tenantId };
        this.getAllpurchaseList(filter);

        // Clear the form, table and invoice field.
        this.resetAfterSubmit(true);

        // clear any invoice error flag
        this.invoiceError = false;
      } else {
        if (res.errorMessage && res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    // } else {
    //   this.invoiceError = true;
    //   this.messagHelper.showMessage(400, 'Invoice number is required.');
    // }
});

  // Make sure modal is closed (function above also closes it on success)
  this.showPurchaseSummaryModal = false;
}



  resetAfterSubmit(clearInvoice: boolean = false) {
  // Reset purchase model
  this.model = new Order();


  this.model.purchaseDate = new Date().toISOString().split('T')[0];
  this.model.tenantId = Number(this.authenticatedUser?.tenantId);

  // clear details & summary
  this.model.requestOrderDetails = [];
  this.summaryItems = [];
  // trigger mat-table change detection
  this.model.requestOrderDetails = [...this.model.requestOrderDetails];
  this.purchaseItems = [...this.model.requestOrderDetails]; // keep table datasource in sync
  // clear search / dropdown / selections
  this.itemSearch = '';
  this.filteredItems = [];
  this.showItemDropdown = false;
  this.selectedDropdownIndex = -1;
  this.selectedSupplier = null;
  this.selectedWarehouseId = 0;
  this.selectedSupplierId = 0;
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
  this.showPurchaseSummaryModal = false;
}

  getAllpurchaseList(filter: any) {
    this.orderService.fetchAllOrder(filter)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstPurchase = (res.result || []).map((row: any) => {
            // Check multiple possible status indicators
            const isCompleted = 
              row.bergerRecievedStatus?.toLowerCase() === 'completed' ||
              row.bergerRecievedStatus?.toLowerCase() === 'received' ||
              row.status === 1 ||
              row.status === '1';
            
            console.log('Row status debug:', {
              invoiceNo: row.purchaseInvoiceNo,
              bergerRecievedStatus: row.bergerRecievedStatus,
              originalStatus: row.status,
              isCompleted: isCompleted
            });
            
            return {
              ...row,
              status: isCompleted ? 1 : 0
            };
          });
        } else {
          this.lstPurchase = [];
        }
      });
  }

}