import { BaseModel } from "./baseModel";

export class wareHouseTransfer extends BaseModel {
  itemId?: number;
  fromWarehouseId?: number;
  changedQty?: number;
  toWarehouseId?: number;
  remarks: string = '';
  tenantId: number = 0;
}
