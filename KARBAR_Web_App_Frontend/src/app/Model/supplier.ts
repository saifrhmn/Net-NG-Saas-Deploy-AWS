import { BaseModel } from "./baseModel";

export class Supplier extends BaseModel {
  supplierId: string = '';
  brandId: number = 0;
  name: string = '';
  contact: string = '';
  phoneNo: string = '';
  email: string = '';
  address: string = '';
  tenantId: number = 0;
  tenantName?: string | null;
  override status: number = 1;
  statusDescription: string = '';
  totalCount?: number;
  createdDate: string = '';
  IsBergerItem: boolean;
  override createdBy: string = '';
  updatedDate?: string | null;
  override updatedBy: string = '';
}

