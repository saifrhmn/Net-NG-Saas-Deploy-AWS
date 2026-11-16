import { BaseModel } from "./baseModel";

export class Settings extends BaseModel {
  override id: number = 0;
  roleId: string = '';
  isAdmin: boolean = false;
  name: string = '';
  tenantId: number = 0;
  // override status: number = 1;
  statusDescription: string = '';
  uomId: string = '';
  warehouseId: string = '';
  location: string = '';
  brandId: string = '';
  categoryId: string = '';
  parentCategoryName: string = '';
  hasParent: boolean = false;
  parentCategoryId: string = '';
  accountName: string = '';
  accountNumber: string = '';
  bankName: string = '';
  branchName: string = '';
  totalCount?: number;
}
