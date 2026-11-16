import { BaseModel } from "./baseModel";

export class Order extends BaseModel {
  orderNo: string = '';
  purchaseOrderId: string = '';
  purchaseDate: string = '';
  totalAmount: number = 0;
  discountAmount: number = 0;
  tax: number = 0;
  vat: number = 0;
  paymentMethod: string = '';
  mobileBankMethod: string = '';
  phoneNumber: string = '';
  bankId: number = 0;
  cardNumber: string = '';
  tenantId: number = 0;
  IsBergerItem:boolean;
  requestOrderDetails: OrderDetail[] = [];
}

export class OrderDetail {
  id: number = 0;
  purchaseOrderDetailId: string = '';
  itemId: number = 0;
  uomId: number = 0;
  itemName: string = '';
  uomName: string = '';
  materialNumber: string = '';
  warehouseId: number = 0;
  supplierId: number = 0;
  quantity: number = 0;
  unitPrice: number = 0;
  totalAmount: number = 0;
}


