import { BaseModel } from "./baseModel";

export class Customer extends BaseModel {
  customerId: string = '';
  name: string = '';
  contact: string = '';
  phone: string = '';
  address: string = '';
  addressLine1: string = '';
  addressLine2: string = '';
  tenantId: number = 0;
  tenantName?: string | null;
  statusDescription: string = '';
  totalCount?: number;
  createdDate: string = '';
  override createdBy: string = '';
  updatedDate?: string | null;
  override updatedBy: string = '';
}
