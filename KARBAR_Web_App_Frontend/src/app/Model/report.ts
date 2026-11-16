import { BaseModel } from "./baseModel";

export class Report extends BaseModel {
  tenantId: number = 0;
  itemId: number = 0;
  brandId: number = 0;
  CategoryId: number = 0;
  InvoiceNo: number = 0;
  fromDate: string = '';
  toDate: string = '';
  pageIndex: number = 1;
  pageSize: number = 10;
}
