import { BaseModel } from "./baseModel";

export class User extends BaseModel {
  userId: string = '';
  userName: string = '';
  addressLine1: string = '';
  addressLine2: string = '';
  imageBase64: string = '';
  signatureImageBase64: string = '';
  phoneNumber: string = '';
  password: string = '';
  tenantCustomerNo: string = '';
  parentTenantId: number = 0;
  tenantId: number = 0;
  roleId: number = 0;
  roleName: string = '';
  count?: number;
}
