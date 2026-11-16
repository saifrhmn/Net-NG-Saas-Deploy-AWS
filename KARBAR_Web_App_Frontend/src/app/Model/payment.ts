import { BaseModel } from "./baseModel";

export class Payment extends BaseModel {
  customerId: number = 0;
  paymentType: string = '';
  userType: number = 1;
  requestOrderId: number = 0;
  requestOrderDetailId: number = 0;
  orderInvoiceNo: string = '';
  totalAmount: number = 0;
  paidAmount: number = 0;
  dueAmount: number = 0;
  amount: number = 0;
  tenantId: number = 0;
}
