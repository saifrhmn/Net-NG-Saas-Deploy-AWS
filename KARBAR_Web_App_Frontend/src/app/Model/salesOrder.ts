import { BaseModel } from "./baseModel";

export class SalesOrder extends BaseModel {
  invoiceNo: string = "";
  customerName: string = "";
  customerPhone: number = 0;
  customerAddress: string = "";
  addressLine1: string = "";
  addressLine2: string = "";
  salesOrderId: string = "";
  salesOrderDate: string = "";
  discountType: string = "";
  remarks: string = "";
  totalAmount: number = 0;
  discountAmount: number = 0;
  paidAmount: number = 0;
  dueAmount: number = 0;
  deliveryCharge: number = 0;
  tax: number = 0;
  vat: number = 0;
  paymentMethod: number = 1;
  mobileBankMethod: number;
  phoneNumber: string = "";
  // bankId: number = 0;
  bankName: string;
  accountNumber: string;
  // cardNumber: string = "";
  customerId: number = 0;
  tenantId: number = 0;
  salesOrderDetails: SalesOrderDetail[] = [];
  subTotal: number = 0;
  isReturn: boolean = false;
  isDraft: boolean = false;
}

export class SalesOrderDetail {
  id: number = 0;
  salesOrderDetailId: string = "";
  itemName: string = "";
  warehouseName: string = "";
  shadesName: string = "";
  itemId: number = 0;
  uomId: number = 0;
  warehouseId: number = 0;
  quantity: number = 0;
  returnQuantity: number = 0;
  sellingPrice: number = 0;
  salesreturnQuantity: number = 0;
  unitPrice: number = 0;
  totalAmount: number = 0;
  returnTotalAmount: number = 0;
  availableStock?: number;
  weightedAveragePrice?: number;
  isSelected?: boolean;

}
