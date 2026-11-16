import { BaseModel } from "./baseModel";

export class Purchase extends BaseModel {
  purchaseOrderId: string = '';
  purchaseInvoiceNo: string = '';
  purchaseDate: string = '';
  totalAmount: number = 0;
  discountAmount: number = 0;
  finalAmount: number = 0;
  
  tax: number = 0;
  vat: number = 0;
  due: number = 0;
  paymentMethod: number = 1;
  mobileBankMethod: number;
  phoneNumber: string = '';
  // bankId: number = 0;
  bankName: string;
  accountNumber: string;
  // cardNumber: string = '';
  tenantId: number = 0;
  paidAmount: number = 0;
  dueAmount: number = 0;
  IsBergerItem: boolean;

  purchaseDetails: PurchaseDetail[] = [];
  subTotal: number = 0;
}

export class PurchaseDetail {
  id: number = 0;
  purchaseOrderDetailId: string = '';

  // Item
  itemId: number = 0;
  itemName: string = '';

  // UOM
  uomId: number = 0;
  uomName: string = '';

  // Warehouse
  warehouseId: number = 0;

  // Supplier
  supplierId: number = 0;
  supplierName: string = '';

  // Pricing
  quantity: number = 0;
  unitPrice: number = 0;
  totalAmount: number = 0;

  // Tax & VAT
  tax: number = 0;
  vat: number = 0;

  // Dates
  purchaseDate: string = '';
  recievedDate: string = '';

  isSelected?: boolean;
  purchasereturnQuantity?: number;
  returnQuantity?: number;
  returnTotalAmount?: number;
  isReturn?: boolean;
}


