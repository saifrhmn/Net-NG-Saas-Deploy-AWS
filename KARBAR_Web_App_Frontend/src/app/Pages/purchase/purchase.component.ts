import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Supplier } from '../../Model/supplier';
import { SupplierService } from '../../Services/supplier.service';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';
import { ApiResponse } from '../../Model/VM/apiResponse';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../Services/auth.service';
import { SettingsService } from '../../Services/settings.service';
import { Settings } from '../../Model/settings';
import { ItemService } from '../../Services/item.service';
import { Purchase } from '../../Model/purchase';
import { PurchaseService } from '../../Services/purchase.service';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { InputComponent } from '../../Common/Component/input/input.component';
import { MatChipListbox, MatChipOption } from "@angular/material/chips";
import { Router } from '@angular/router';
import { SearchRequest } from '../../Model/DTO/searchRequest';
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
  materialNumber?: number;
  supplierId?: number;
  supplierName?: string;
  weightedAveragePrice?: number;
}

export interface NewSupplier {
  name: string;
  type: string;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-purchase',
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
    MatTooltipModule,
    MatCheckboxModule,
    MatPaginatorModule
  ],
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.scss',
})
export class PurchaseComponent {
  invoiceToggle = localStorage.getItem('invoiceToggle') === 'true';
  // selectedSupplier: string = '';
  // itemSearch: string = '';
  purchaseDate: Date = new Date();
  selectedPaymentMethod: number = 0;
  isEditMode: boolean = false;
  invoiceError: boolean = false;
  duplicateInvoice: boolean = false;

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
  searchReq: SearchRequest = new SearchRequest();

  displayedColumns: string[] = [
    'serialNo',
    'materialNumber',
    'itemName',
    'brandName',
    'category',
    'unit',
    'purchasePrice',
    'warehouse',
    'supplier',
  ];

  subTotal: number = 0;
  discount: number = 0;
  discountType: string = '%'; // Add discount type property
  finalAmount: number = 0;
  deliveryCharge: number = 0;
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

  // Server-side pagination for the Completed Purchase list (pageIndex is 1-based like the API)
  pageSizeOptions: number[] = [10, 25, 50, 100];
  completedPage = { pageIndex: 1, pageSize: 10, total: 0 };

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

  model: Purchase = new Purchase();

  purchaseItems: any[] = [];
  taxAmount: number = 0;
  vatAmount: number = 0;
  public math = Math;

  showRemarkModal: boolean = false;
  remarks: string = '';
  selectedReturnRow: any = null;
  purchaseReturnModel: any = {};
  isdisablebtn: boolean = false;
  checkmark: boolean = false;
  actualamount: number = 0;

  lstReturnedPurchases: any[] = [];
  fromDate: string | null = null;
  toDate: string | null = null;

  private normalizeTextKey(value: any): string {
    return String(value ?? '').trim().toLowerCase();
  }

  private isSameSummaryKey(a: any, b: any): boolean {
    const sameWarehouse = Number(a?.warehouseId ?? 0) === Number(b?.warehouseId ?? 0);
    const sameSupplier = Number(a?.supplierId ?? 0) === Number(b?.supplierId ?? 0);

    const aItemId = Number(a?.itemId ?? 0);
    const bItemId = Number(b?.itemId ?? 0);
    const sameItemId = aItemId > 0 && bItemId > 0 && aItemId === bItemId;

    const aMaterial = this.normalizeTextKey(a?.materialNumber);
    const bMaterial = this.normalizeTextKey(b?.materialNumber);
    const sameMaterial = !!aMaterial && !!bMaterial && aMaterial === bMaterial;

    return sameWarehouse && sameSupplier && (sameItemId || sameMaterial);
  }

  private isSummaryAndDetailMatch(summary: any, detail: any): boolean {
    const sameWarehouse = Number(summary?.warehouseId ?? 0) === Number(detail?.warehouseId ?? 0);
    const sameSupplier = Number(summary?.supplierId ?? 0) === Number(detail?.supplierId ?? 0);

    const sItemId = Number(summary?.itemId ?? 0);
    const dItemId = Number(detail?.itemId ?? 0);
    const sameItemId = sItemId > 0 && dItemId > 0 && sItemId === dItemId;

    const sMaterial = this.normalizeTextKey(summary?.materialNumber);
    const dMaterial = this.normalizeTextKey(detail?.materialNumber);
    const sameMaterial = !!sMaterial && !!dMaterial && sMaterial === dMaterial;

    return sameWarehouse && sameSupplier && (sameItemId || sameMaterial);
  }

  constructor(
    private supplierService: SupplierService,
    private messagHelper: MessageHelperService,
    private settingsService: SettingsService,
    private purchaseService: PurchaseService,
    private itemService: ItemService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet,
    private router: Router
  ) {
    this.calculateTotals();
  }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.supplier.tenantId = this.authenticatedUser?.tenantId;
    this.model.purchaseDetails = [];
    this.purchaseItems = [...(this.model.purchaseDetails || [])];
    this.summaryItems = [];
    this.getAllSuppliers(this.supplier);
    this.getAllWarehouse(this.supplier);
    this.getAllItems(this.supplier);
    this.model.purchaseDate = new Date().toISOString().split('T')[0];
    this.model.tenantId = Number(this.authenticatedUser?.tenantId);
    // this.model.IsBergerItem =   false;
    // this.model.IsBergerItem = true;
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyboard);
  }
  onToggleChange() {
    localStorage.setItem('invoiceToggle', String(this.invoiceToggle));
    // Navigate immediately when toggle changes
    const route = this.invoiceToggle ? 'purchase-details' : 'purchase';
    console.log('invoiceToggle=', this.invoiceToggle, 'navigating to', route);
    this.router.navigate([route]);
  }

  openPurchase() {
    const route = this.invoiceToggle ? 'purchase-details' : 'purchase';
    console.log('invoiceToggle=', this.invoiceToggle, 'navigating to', route);
    this.router.navigate([route]);
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

  // onTabChange(event: MatTabChangeEvent) {
  //   if (event.index === 1) {
  //     this.loadCompletedPurchases();
  //   }
  // }

  onTabChange(event: MatTabChangeEvent) {
  if (event.index === 1) {
    this.loadCompletedPurchases();
  } else if (event.index === 2) {
    this.getAllReturnPurchaseList({
      tenantId: this.authenticatedUser?.tenantId,
      IsReturn: true,
      fromDate: this.fromDate,
      toDate: this.toDate,
    });
  }
}

  private loadCompletedPurchases() {
    if (this.completedLoaded) return;
    const filter = { tenantId: this.authenticatedUser?.tenantId };
    this.getAllpurchaseList(filter);
    this.completedLoaded = true;
  }

  loadCompletedPurchase() {
    if (this.completedLoaded) return;
    const model = { tenantId: this.authenticatedUser?.tenantId };
    this.getAllpurchaseList(model);
    this.completedLoaded = true;
  }
  onSupplierChange(supplierId: number) {
    this.selectedSupplierId = Number(supplierId ?? 0);
    this.selectedSupplier = (this.lstSuppler || []).find((s: any) => Number(s.id) === Number(this.selectedSupplierId)) || null;

    if (this.selectedSupplier.name?.trim().toLowerCase().includes('berger')) {
      this.supplier.IsBergerItem = true;
      this.getAllItems(this.supplier);
    }
    debugger;
    // Keep the existing supplier model id for modal form if needed
    this.supplier.id = this.selectedSupplier?.id ?? this.supplier.id;
  }

  getShortName(name: string | undefined | null): string {
    if (!name) return '';
    const parts = ('' + name).trim().split(/\s+/);
    if (parts.length <= 2) return parts.join(' ');
    return parts.slice(0, 2).join(' ') + '...';
  }

  // onItemSearchChange() {
  //   debugger
  //   // const q = (this.itemSearch || '').trim().toLowerCase();
  //     const q = (this.itemSearch || '').toLowerCase(); // do NOT trim — preserve spaces

  //   if (!q) {
  //     this.filteredItems = this.lstItem || [];
  //   } else {
  //     this.filteredItems = (this.lstItem || []).filter((it: any) => {
  //       const name = (it.name ?? '').toString().toLowerCase();
  //       const materialNumber = (it.materialNumber ?? '').toString().toLowerCase();
  //       const brand = (it.brandName ?? '').toString().toLowerCase();
  //       const barcode = (it.barcode ?? '').toString().toLowerCase();
  //       const category = (it.categoryName ?? '').toString().toLowerCase();
  //       return (
  //         name.includes(q) ||
  //         materialNumber.includes(q) ||
  //         brand.includes(q) ||
  //         barcode.includes(q) ||
  //         category.includes(q)
  //       );
  //     });
  //   }
  //   this.selectedDropdownIndex = -1;
  //   this.showItemDropdown = true;
  // }

onItemSearchChange(value?: string) {
  const q = (value ?? this.itemSearch ?? '').toLowerCase();
  this.itemSearch = q;
  this.searchReq.searchText = q;

  // Only filter locally, do not fetch on every keystroke
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

  // onItemSearchChange(value?: string) {
  //   debugger
  //   const q = (value ?? this.itemSearch ?? '').toLowerCase(); // keep spaces if needed
  //   this.itemSearch = q;
  //   this.searchReq.searchText = q; // sync back to main property
  //   this.getAllItems(this.searchReq);
  //   if (!q) {
  //     this.filteredItems = this.lstItem || [];
  //   } else {
  //     this.filteredItems = (this.lstItem || []).filter((it: any) => {
  //       const name = (it.name ?? '').toString().toLowerCase();
  //       const materialNumber = (it.materialNumber ?? '').toString().toLowerCase();
  //       const brand = (it.brandName ?? '').toString().toLowerCase();
  //       const barcode = (it.barcode ?? '').toString().toLowerCase();
  //       const category = (it.categoryName ?? '').toString().toLowerCase();
  //       return (
  //         name.includes(q) ||
  //         materialNumber.includes(q) ||
  //         brand.includes(q) ||
  //         barcode.includes(q) ||
  //         category.includes(q)
  //       );
  //     });
  //   }
  //   this.selectedDropdownIndex = -1;
  //   this.showItemDropdown = true;
  // }
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

  hideItemDropdown() {
    setTimeout(() => {
      this.showItemDropdown = false;
    }, 200);
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


  private addItemToPurchase(src: any) {
    debugger
    const warehouseId = Number(this.selectedWarehouseId ?? this.searchModelSettings?.warehouseId ?? 0);
    const supplierId = Number(this.supplier?.id ?? 0);

    const currentWarehouse = (this.lstWarehouses || []).find((w: any) => Number(w.id) === warehouseId);
    const currentSupplier = (this.lstSuppler || []).find((s: any) => Number(s.id) === supplierId);
    const supplierName = (currentSupplier?.name ?? '');

    // const materialNumber = Number(src.materialNumber ?? src.materialNumber ?? 0);
    const materialNumber = (src.materialNumber ?? src.materialNumber ?? 0);
    const unitPrice = Number(src.purchasePrice ?? src.purchasePrice ?? 0) || 0;

    // ensure arrays exist
    this.model.purchaseDetails = this.model.purchaseDetails ?? [];
    this.summaryItems = this.summaryItems ?? [];

    // find by item + warehouse + supplier
    const existing = (this.model.purchaseDetails || []).find((r: any) =>
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
        itemId: src.id,
        // itemId: src.itemId,
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
        weightedAveragePrice: Number(src.weightedAveragePrice ?? 0),

        vat: Number(src.vat ?? 0),
        vatAmount: Number(src.vatAmount ?? 0),
        // Dates (provide defaults so type matches)
        purchaseDate: new Date().toISOString(),
        recievedDate: '',
        // ts variant expected in error message
        recievedDatets: '',
      };
      this.model.purchaseDetails.push(newItem);
    }

    // trigger change detection for mat-table and keep purchaseItems in sync
    this.model.purchaseDetails = [...this.model.purchaseDetails];
    this.purchaseItems = [...this.model.purchaseDetails];

    // update summaryItems (keep keyed by item+warehouse+supplier)
    const summaryIndex = this.summaryItems.findIndex((x: any) =>
      Number(x.materialNumber ?? 0) === materialNumber &&
      Number(x.warehouseId ?? 0) === warehouseId &&
      Number(x.supplierId ?? 0) === supplierId
    );

    if (summaryIndex === -1) {
      this.summaryItems = [
        ...this.summaryItems,
        {
          materialNumber: materialNumber,
          itemCode: src.itemCode ?? '',
          // itemCode: src.itemCode ?? '',
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
          supplierName: currentSupplier?.name ?? '',
          // ADD THIS
    weightedAveragePrice: Number(src.weightedAveragePrice ?? 0),
        } as any
      ];
    } else {
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
    console.log('purchaseDetails:', this.model.purchaseDetails);
    console.log('purchaseItems (table datasource):', this.purchaseItems);
  }

  calculateTotals() {
    // Calculate sub total from summary items (qty * price)
    this.subTotal = this.summaryItems.reduce((total, item) => total + item.purchasePrice * item.quantity, 0);

    // Calculate final amount after discount
    if (this.discountType === '%') {
      this.finalAmount = this.subTotal - (this.subTotal * this.discount) / 100;
    } else {
      this.finalAmount = this.subTotal - this.discount;
    }

    // Add tax and VAT only if they have values
    this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;

    this.totalPayable = this.finalAmount + this.taxAmount + this.vatAmount;

    // Calculate due
    this.due = this.totalPayable - this.payment;
    this.model.tax = this.tax;
    this.model.vat = this.vat;
    this.model.totalAmount = this.totalPayable;
  }

  // Auto calculate discount when final amount changes
  onFinalAmountChange() {
    debugger
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
      debugger
      this.totalPayable = this.finalAmount + taxAmount + vatAmount;
      this.due = this.totalPayable - this.payment;
      // this.model.totalAmount = this.totalPayable;
    }
        this.calculateTotals();

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

    this.calculateTotals();
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
    this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
    this.totalPayable = this.finalAmount + this.taxAmount + this.vatAmount;
    this.due = this.totalPayable - this.payment;
    this.model.tax = this.tax;
    this.calculateTotals();
  }

  // Recalculate total payable when vat changes
  onVatChange() {

    this.taxAmount = this.tax ? (this.finalAmount * this.tax) / 100 : 0;
    this.vatAmount = this.vat ? (this.finalAmount * this.vat) / 100 : 0;
    this.totalPayable = this.finalAmount + this.taxAmount + this.vatAmount;
    this.due = this.totalPayable - this.payment;
    this.model.vat = this.vat;
    this.calculateTotals();
  }

  onPaymentMethodChange(value: number) {
    this.selectedPaymentMethod = value;
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

  getWarehouseName(warehouseId: number | string | undefined | null): string {
    if (!warehouseId) return '';
    
    console.log('🔍 Looking for warehouseId:', warehouseId, 'Type:', typeof warehouseId);
    console.log('📦 lstWarehouses array:', this.lstWarehouses);
    console.log('📦 First warehouse object:', this.lstWarehouses?.[0]);
    
    const warehouse = (this.lstWarehouses || []).find((w: any) => {
      console.log('  Checking warehouse:', { 
        'w.id': w.id, 
        'w.warehouseId': w.warehouseId,
        'w.name': w.name,
        'Match by id?': Number(w.id) === Number(warehouseId),
        'Match by warehouseId?': w.warehouseId === warehouseId
      });
      return Number(w.id) === Number(warehouseId) || w.warehouseId === warehouseId;
    });
    
    console.log('✅ Found warehouse:', warehouse);
    return warehouse?.name || '';
  }
  onSave() {
    console.log('Purchase saved');
    // Open the purchase summary modal

    if(this.model.purchaseInvoiceNo == null || this.model.purchaseInvoiceNo == undefined || this.model.purchaseInvoiceNo == ''){
      this.messagHelper.showMessage(400, 'Purchase Invoice No is required');
      return;
    }else{
      this.showPurchaseSummaryModal = true;
    }
  }

  // Toggle payment details visibility
  togglePaymentDetails() {
    this.showPaymentDetails = !this.showPaymentDetails;
  }

  // Supplier modal methods
  openSupplierModal() {
    this.showSupplierModal = true;
  }

  closeSupplierModal() {
    this.showSupplierModal = false;
    this.resetSupplierForm();
  }
  onModalKeydown(event: KeyboardEvent) {
    // Close modal on Escape key
    if (event.key === 'Escape') {
      this.closeSupplierModal();
      return;
    }
  }

  getAllItems(model: any) {
    // model.IsBergerItem = false;
    // const filter = { ...(model || {}), IsBergerItem: false };
    const filter = { ...(model || {}) };
    this.itemService.fetchAllItems(filter).subscribe((res: ApiResponse) => {
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
          console.log('✅ Warehouses loaded:', this.lstWarehouses);
          console.log('✅ First warehouse structure:', this.lstWarehouses?.[0]);
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
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }

  createSupplier(model: any) {
    this.supplierService.createSupplier(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);

        // Refresh supplier list and then auto-select the newly created supplier.
        const filter = { tenantId: this.authenticatedUser?.tenantId };
        this.supplierService.fetchAllSuppliers(filter).subscribe((res2: ApiResponse) => {
          if (res2.isSuccess) {
            this.lstSuppler = res2.result;

            // Try to get created id from create response
            let createdId: number | null = null;
            if (res.result && typeof res.result === 'object' && (res.result as any).id) {
              createdId = Number((res.result as any).id);
            }

            // Fallback: match by name + contact if API returned only a message
            if (!createdId) {
              const name = (model.name || '').toString().trim();
              const contact = (model.contact || '').toString().trim();
              const match = this.lstSuppler.find((c: any) => {
                if (!name) return false;
                if (contact) {
                  return c.name === name && (c.contact ?? '') === contact;
                }
                return c.name === name;
              });
              if (match) createdId = Number(match.id);
            }

            if (createdId) {
              this.selectedSupplierId = createdId;
              this.onSupplierChange(createdId);
            }

            // Close modal after selecting
            this.closeSupplierModal();
          } else {
            // If refresh failed still close modal and show warning
            this.messagHelper.showMessage(res2.statusCode, 'Supplier created but failed to refresh list');
            this.closeSupplierModal();
          }
        }, (err) => {
          this.messagHelper.showMessage(500, 'Supplier created but failed to refresh list');
          this.closeSupplierModal();
        });
      } else {
        if (res.errorMessage && res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    }, (err) => {
      this.messagHelper.showMessage(500, 'Failed to create supplier');
    });
  }
  private resetSupplierForm() {
    this.supplier = new Supplier();
  }

  // Quantity control methods
  // increaseQuantity(item: SummaryItem) {
  //   debugger
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
  increaseQuantity(item: SummaryItem) {
    // remove debugger
    item.quantity++;

    const targetMat = String((item as any).materialNumber ?? (item as any).itemId ?? '');
    const wh = Number(item.warehouseId ?? 0);

    this.model.purchaseDetails.forEach((pd: any) => {
      const pdMat = String(pd.materialNumber ?? pd.itemId ?? '');
      if (pdMat === targetMat && Number(pd.warehouseId ?? 0) === wh) {
        pd.quantity = item.quantity;
        pd.totalAmount = Number(pd.unitPrice ?? pd.purchasePrice ?? 0) * pd.quantity;
      }
    });

    this.model.purchaseDetails = [...this.model.purchaseDetails];
    this.purchaseItems = [...this.model.purchaseDetails];
    this.onItemChange();
  }
  decreaseQuantity(item: SummaryItem) {
    if (item.quantity > 1) {
      item.quantity--;
      this.model.purchaseDetails.forEach((pd: any) => {
        if (this.isSummaryAndDetailMatch(item, pd)) {
          pd.quantity = item.quantity;
          pd.totalAmount = Number(pd.unitPrice ?? pd.purchasePrice ?? 0) * pd.quantity;
        }
      });
      this.model.purchaseDetails = [...this.model.purchaseDetails];
      this.purchaseItems = [...this.model.purchaseDetails];
      this.onItemChange();
    }
  }

  // onQuantityInput(item: any, value: any) {
  //   let qty = Number(value);
  //   if (!Number.isFinite(qty)) qty = 1;
  //   qty = Math.floor(qty);
  //   if (qty < 1) qty = 1;

  //   item.quantity = qty;

  //   const itemId = Number(item.itemId ?? 0);
  //   const warehouseId = Number(item.warehouseId ?? 0);

  //   this.model.purchaseDetails.forEach((pd: any) => {
  //     if (
  //       pd.itemId === itemId &&
  //       Number(pd.warehouseId ?? 0) === warehouseId
  //     ) {
  //       pd.quantity == qty;
  //       pd.totalAmount = Number(pd.unitPrice ?? 0) * qty;
  //     }
  //   });

  //   // trigger table refresh and totals

  //   this.model.purchaseDetails = [...this.model.purchaseDetails];
  //   debugger
  //   this.onItemChange();
  // }

  onQuantityInput(item: any, value: any) {
    debugger
    let qty = Number(value);
    if (!Number.isFinite(qty)) qty = 1;
    qty = Math.floor(qty);
    if (qty < 1) qty = 1;
    console.log(item);

    item.quantity = qty;

    const targetMat = String(item.materialNumber ?? item.itemId ?? '');
    const warehouseId = Number(item.warehouseId ?? 0);

    this.model.purchaseDetails.forEach((pd: any) => {
      const pdMat = String(pd.materialNumber ?? pd.itemId ?? '');
      if (pdMat === targetMat && Number(pd.warehouseId ?? 0) === warehouseId) {
        pd.quantity = qty;
        pd.totalAmount = Number(pd.unitPrice ?? 0) * pd.quantity;
      }
    });

    this.model.purchaseDetails = [...this.model.purchaseDetails];
    this.purchaseItems = [...this.model.purchaseDetails];



    this.onItemChange();
  }
  deleteFromSummary(sItem: any) {
    this.summaryItems = (this.summaryItems || []).filter(
      (s: any) => !this.isSameSummaryKey(s, sItem)
    );

    this.model.purchaseDetails = (this.model.purchaseDetails || []).filter(
      (p: any) => !this.isSummaryAndDetailMatch(sItem, p)
    );

    // Sync table datasource and totals
    this.model.purchaseDetails = [...this.model.purchaseDetails];
    this.purchaseItems = [...this.model.purchaseDetails];
    this.onItemChange?.();
  }

  onItemChange() {
    // Calculate sub total from summary items
    this.subTotal = this.summaryItems.reduce(
      (total, item) => total + item.purchasePrice * item.quantity,
      0
    );
    // Sync quantities and prices from summaryItems back to purchaseDetails
    this.summaryItems.forEach((sItem: SummaryItem) => {
      this.model.purchaseDetails.forEach((pd: any) => {
        if (this.isSummaryAndDetailMatch(sItem, pd)) {
          pd.quantity = sItem.quantity;
          pd.unitPrice = sItem.purchasePrice;
          pd.totalAmount = sItem.purchasePrice * sItem.quantity;
        }
      });
    });
    this.model.purchaseDetails = [...this.model.purchaseDetails];
    this.purchaseItems = [...this.model.purchaseDetails];
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
    if (selId && Array.isArray(this.model.purchaseDetails)) {
      const supplierName = this.selectedSupplier?.name ?? '';
      for (const d of this.model.purchaseDetails) {
        d.supplierId = selId;
        // keep supplierName in sync for UI/back-end if needed
        if (!d.supplierName) d.supplierName = supplierName;
      }
      // keep table datasource in sync if you use it
      this.purchaseItems = [...(this.model.purchaseDetails || [])];
    }

    if (!this.model.purchaseInvoiceNo || this.model.purchaseInvoiceNo.trim() === '') {
      this.invoiceError = true;
      this.messagHelper.showMessage(400, 'Invoice number is required.');
      return;
    }

    // Re-check against the server right before saving, in case the blur check was skipped
    this.isInvoiceNoDuplicate(this.model.purchaseInvoiceNo, (isDuplicate) => {
      if (isDuplicate) {
        this.showDuplicateInvoiceWarning();
        this.showPurchaseSummaryModal = false;
        return;
      }
      this.createPurchase();
    });
  }

  // Warn as soon as the user leaves the Invoice No field
  checkDuplicateInvoice() {
    const invoiceNo = (this.model.purchaseInvoiceNo || '').trim();
    this.duplicateInvoice = false;
    if (!invoiceNo) return;
    this.isInvoiceNoDuplicate(invoiceNo, (isDuplicate) => {
      // Ignore stale responses if the user changed the value meanwhile
      if ((this.model.purchaseInvoiceNo || '').trim() !== invoiceNo) return;
      if (isDuplicate) {
        this.showDuplicateInvoiceWarning();
      } else {
        this.invoiceError = false;
      }
    });
  }

  private showDuplicateInvoiceWarning() {
    this.duplicateInvoice = true;
    this.invoiceError = true;
    this.messagHelper.showMessage(400, `Invoice No "${this.model.purchaseInvoiceNo.trim()}" already exists.`);
  }

  private isInvoiceNoDuplicate(invoiceNo: string, done: (isDuplicate: boolean) => void) {
    const target = (invoiceNo || '').trim().toLowerCase();
    if (!target) {
      done(false);
      return;
    }
    const filter: any = {
      tenantId: this.authenticatedUser?.tenantId,
      invoiceNo: encodeURIComponent(invoiceNo.trim()),
    };
    this.purchaseService.fetchAllPurchase(filter).subscribe({
      next: (res: ApiResponse) => {
        const list: any[] = res?.isSuccess ? res.result || [] : [];
        // Exact (case-insensitive) match, in case the API does a partial match or ignores the filter
        done(list.some((p) => String(p.purchaseInvoiceNo ?? '').trim().toLowerCase() === target));
      },
      // Don't block saving if the check itself fails; the server is the final authority
      error: () => done(false),
    });
  }

  private createPurchase() {
    this.model.paidAmount = this.payment;
    this.model.dueAmount = this.due;

    this.model.subTotal = this.subTotal;

    this.purchaseService.createPurchase(this.model).subscribe((res: ApiResponse) => {
      if (this.model.purchaseInvoiceNo && this.model.purchaseInvoiceNo.trim() !== '') {
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
      } else {
        this.invoiceError = true;
        this.messagHelper.showMessage(400, 'Invoice number is required.');
      }
    }, (err) => {
      // network/unexpected error
      this.messagHelper.showMessage(500, 'Failed to submit purchase');
    });

    // Make sure modal is closed (function above also closes it on success)
    this.showPurchaseSummaryModal = false;
  }

  resetAfterSubmit(clearInvoice: boolean = false) {
    // Reset purchase model
    this.model = new Purchase();

    this.duplicateInvoice = false;

    if (clearInvoice) {
      // keep invoice field empty per request
      this.model.purchaseInvoiceNo = '';
    } else {
      // regenerate invoice for next order (existing behavior)
      this.model.purchaseInvoiceNo = this.generateInvoiceNo();
    }

    this.model.purchaseDate = new Date().toISOString().split('T')[0];
    this.model.tenantId = Number(this.authenticatedUser?.tenantId);

    // clear details & summary
    this.model.purchaseDetails = [];
    this.summaryItems = [];
    // trigger mat-table change detection
    this.model.purchaseDetails = [...this.model.purchaseDetails];
    this.purchaseItems = [...this.model.purchaseDetails]; // keep table datasource in sync

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
    this.taxAmount = 0;
    this.vatAmount = 0;
  }

  getAllpurchaseList(filter: any) {
    filter.pageIndex = filter.pageIndex ?? this.completedPage.pageIndex;
    filter.pageSize = filter.pageSize ?? this.completedPage.pageSize;

    this.purchaseService
      .fetchAllPurchase(filter)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstPurchase = res.result || [];
          this.completedPage.total = this.getTotalCount(res, this.lstPurchase);
        } else {
          this.lstPurchase = [];
          this.completedPage.total = 0;
        }
      });
  }

  onCompletedPageChange(event: PageEvent) {
    this.completedPage.pageIndex = event.pageIndex + 1;
    this.completedPage.pageSize = event.pageSize;
    this.loadCompletedPurchase2();
  }

  /**
   * Total row count from an API response, whichever field reports it (a 0 is ignored).
   * Without a total, a full page means there may be more, so keep "next" enabled.
   */
  private getTotalCount(res: ApiResponse, rows: any[]): number {
    const reported = [res.totalCount, res.count, rows[0]?.totalCount]
      .map(n => Number(n))
      .find(n => n > 0);
    if (reported) return reported;

    const { pageIndex, pageSize } = this.completedPage;
    const seen = (pageIndex - 1) * pageSize + rows.length;
    return rows.length >= pageSize ? seen + 1 : seen;
  }
  syncInvoice() {
    this.model.purchaseInvoiceNo = this.generateInvoiceNo();
  }

  generateInvoiceNo(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    // Pattern: PUR-YYYYMMDD-HHMMSS-rand(3)
    return `IN-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
      d.getDate()
    )}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(
      d.getSeconds()
    )}-${Math.floor(Math.random() * 900 + 100)}`;
  }

  // Alt key handler to open bottom sheet
  private handleKeyboard = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      event.preventDefault();
      this.openNavigationSheet();
    }
  };

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboard);
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
      // Navigation is handled by the bottom sheet component
      // This is just for any additional logic needed after navigation
    });
  }

  openSearchForItem() {
    const ref = this.bottomSheet.open(BottomSheetComponent, {
      data: {
        field: 'itemName',
        placeholder: 'Search by Item Name...',
        label: 'Search Items',
        initialValue: '',
      },
    });

    ref
      .afterDismissed()
      .subscribe((result: { field: string; query: string } | null) => {
        if (result && result.query) {
          // Filter items based on search
          const q = result.query.toLowerCase();
          const filtered = this.lstItem.filter(item =>
            (item.itemName || '').toLowerCase().includes(q)
          );
          // Update purchase items or display filtered results
          if (filtered.length > 0) {
            // You can add first item or show a selection modal
            this.itemSearch = result.query;
          }
        }
      });
  }

  onFilter() {
  this.completedPage.pageIndex = 1;
  this.loadCompletedPurchase2();
}

clearFilter() {
  this.fromDate = null;
  this.toDate = null;
  this.completedPage.pageIndex = 1;
  this.loadCompletedPurchase2();
}

// Renamed wrapper so it can be re-called with date filters (your existing
// loadCompletedPurchases() only loads once due to completedLoaded guard)
private loadCompletedPurchase2() {
  const filter = {
    tenantId: this.authenticatedUser?.tenantId,
    fromDate: this.fromDate,
    toDate: this.toDate,
  };
  this.getAllpurchaseList(filter);
}

openRemarkModal(row: any) {
  debugger;
  this.showRemarkModal = true;
  this.selectedReturnRow = row;
  this.purchaseReturnModel = row;
  this.remarks = '';
  this.checkmark = false;
}

cancelRemark() {
  this.showRemarkModal = false;
  this.remarks = '';
  this.selectedReturnRow = null;
  this.checkmark = false;
}

getRemainingQuantity(detail: any): number {
  if (
    detail.purchasereturnQuantity === undefined ||
    detail.purchasereturnQuantity === null ||
    detail.purchasereturnQuantity === ''
  ) {
    return (detail.quantity || 0) - (detail.returnQuantity || 0);
  }
  return detail.purchasereturnQuantity;
}

onReturnQuantityChange(detail: any): void {
  if (detail.purchasereturnQuantity > detail.quantity) {
    this.messagHelper.showMessage(
      400,
      `Return quantity can't be greater than available quantity (${detail.quantity})`,
    );
    detail.returnTotalAmount = detail.purchasereturnQuantity * detail.unitPrice;
    this.isdisablebtn = true;
  } else {
    this.isdisablebtn = false;
    const maxQuantity = this.getRemainingQuantity(detail);

    detail.returnQuantity = Number(detail.purchasereturnQuantity);
    if (detail.returnQuantity > maxQuantity) detail.returnQuantity = maxQuantity;
    if (detail.returnQuantity < 0) detail.returnQuantity = 0;

    if (
      detail.purchasereturnQuantity === 0 ||
      detail.purchasereturnQuantity === null ||
      detail.purchasereturnQuantity === undefined
    ) {
      // no-op
    } else {
      detail.returnTotalAmount = detail.returnQuantity * detail.unitPrice;
    }
    this.actualamount += detail.returnTotalAmount || 0;
  }
}

// Dedupe helper for rendering Completed Purchase rows (one row per detail)
getPurchaseOrderDetails(details: any[]): any[] {
  if (!details || details.length === 0) return [];
  const seen = new Set();
  return details.filter((detail) => {
    const key = `${detail.itemId}-${detail.warehouseId}-${detail.unitPrice}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

updateReturnAmount() {
  this.showRemarkModal = false;

  if (!this.selectedReturnRow || !this.selectedReturnRow.purchaseDetails) {
    this.messagHelper.showMessage(400, 'Invalid return request. Please refresh and try again.');
    return;
  }

  const selectedItems = this.selectedReturnRow.purchaseDetails.filter(
    (item: any) => item.isSelected,
  );

  if (selectedItems.length === 0) {
    this.messagHelper.showMessage(400, 'Please select at least one item for return.');
    return;
  }

  if (!this.remarks || this.remarks.trim().length === 0) {
    this.messagHelper.showMessage(400, 'Please enter remarks for the return.');
    return;
  }

  const model = this.selectedReturnRow;

  const totalReturnAmount = selectedItems.reduce(
    (sum: number, detail: any) => sum + (detail.returnTotalAmount || 0),
    0,
  );

  const newTotalAmount = (model.totalAmount || 0) - totalReturnAmount;




this.purchaseReturnModel = {
  Id: 0,
  purchaseInvoiceNo: model.purchaseInvoiceNo || '',
  purchaseDate: model.purchaseDate || new Date().toISOString(),
  supplierId: model.purchaseDetails?.[0]?.supplierId || 0,
  totalAmount: newTotalAmount,
  discountAmount: model.discountAmount || 0,
  tax: model.tax || 0,
  vat: model.vat || 0,
  paymentMethod: model.paymentMethod || '',
  mobileBankMethod: model.mobileBankMethod || '',
  phoneNumber: model.phoneNumber || '',
  bankId: model.bankId || 0,
  cardNumber: model.cardNumber || '',
  warehouseId: model.purchaseDetails?.[0]?.warehouseId || 0,
  tenantId: model.tenantId || 0,
  remarks: this.remarks || '',
  purchaseReturnDetails: selectedItems.map((detail: any) => ({
    id: 0,
    itemId: detail.itemId || 0,
    uomId: detail.uomId || 0,
    warehouseId: detail.warehouseId || 0,
    quantity: detail.returnQuantity || 0,
    unitPrice: detail.unitPrice || 0,
    totalAmount: detail.returnTotalAmount || 0
  }))
};

console.log(
  'FINAL PURCHASE RETURN PAYLOAD:',
  JSON.stringify(this.purchaseReturnModel, null, 2)
);

debugger;
    this.purchaseService.createPurchaseReturn(this.purchaseReturnModel).subscribe({
      next: (res: ApiResponse) => {
        if (res && res.statusCode === 200) {
          this.messagHelper.showMessage(200, 'Return processed successfully.');
          const filter = { tenantId: this.authenticatedUser?.tenantId };
          this.getAllpurchaseList(filter);
        } else {
          this.messagHelper.showMessage(res.statusCode, '');
        }
      },
      error: (err: any) => {
        if (err) this.messagHelper.showMessage(err.status, err.message);
      },
    });
}

getAllReturnPurchaseList(filter: any) {
  debugger
  this.purchaseService.fetchAllPurchaseReturn(filter).subscribe((res: ApiResponse) => {
    if (res.isSuccess) {
      this.lstReturnedPurchases = res.result || [];
    } else {
      this.lstReturnedPurchases = [];
    }
  });
}
}

