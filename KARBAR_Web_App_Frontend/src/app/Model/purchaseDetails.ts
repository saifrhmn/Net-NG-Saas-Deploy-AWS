import { BaseModel } from "./baseModel";

export class PurchaseDetails extends BaseModel {
  recievedOrderId: string = '';
  recievedNo: string = '';
  recievedDate: string = '';
  IsCustomerRecieved: boolean = false;
  
  purchaseOrderId: string = '';     // maps requestOrderNo / recievedOrderId if needed
  purchaseInvoiceNo: string = '';   // maps recievedNo
  
  purchaseDate: string = '';
  requestOrderNo: string = '';
  
  totalAmount: number = 0;
  discountAmount: number = 0;
  finalAmount: number = 0;
  tax: number = 0;
  vat: number = 0;
  
  paidAmount: number = 0;
  dueAmount: number = 0;
  
  subTotal: number = 0;
  bergerTotalPurchaseAmount: number = 0;
  
  tenantId: number = 0;
  
  paymentMethod: number = 1;
  mobileBankMethod?: number;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  
  isBergerItem?: boolean;
  isCompleted?: boolean;
  
  purchaseDetails: PurchaseDetail[] = [];
   pageIndex: number = 1;
  pageSize: number = 10;
}
export class PurchaseDetail {
  id: number = 0;
  purchaseOrderMasterId: number = 0;
  purchaseOrderDetailId: string = '';
  itemId: number = 0;
  uomId: number = 0;
  warehouseId: number = 0;
  supplierId: number = 0;
  
  invoiceQty: number = 0;
  remainingQty: number = 0;
  unitPrice: number = 0;
  totalAmount: number = 0;
  bergerPurchaseAmount: number = 0;
  
  orderStatus: string = '';
  purchaseDate: string = '';
  recievedDate: string = '';
}





