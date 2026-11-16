import { BaseModel } from "./baseModel";

export class Item extends BaseModel {

  // Core fields
  // id: number = 0;
  itemId: string = "";
  name: string = "";
  materialNumber: string = "";
  itemDescription: string = "";
  materialDescription: string = "";
  materialGroup: string = "";
  materialGroupDescription: string = "";
  // Prices
  mrp: number = 0;
  sellingPrice: number = 0;
  purchasePrice: number = 0;

  // Barcode / image
  barcode: string = "";
  imageUrl: string = "";
  imageBase64: string = "";

  // Category
  categoryId: number = 0;
  categoryName: string | null = null;

  // Low stock
  lowStock: number = 0;

  // weightedAveragePrice
  weightedAveragePrice: number = 0;
  
  // Brand
  brandId: number = 0;
  brandName: string | null = null;

  // UOM
  uomId: number = 0;
  uomName: string | null = null;

  // Warehouse (default warehouse)
  warehouseId: number = 0;
  warehouseName: string | null = null;

  // All warehouse stock list (important!)
  warehousestk: WarehouseStock[] = [];

  // Tenant
  tenantId: number = 0;
  tenantName: string | null = null;

  // Status and counts
  // status: number = 1;
  statusDescription: string = "";
  totalCount?: number = 0;
// 
  // Metadata
  createdDate?: string | null;
  // createdBy: string = "";
  updatedDate?: string | null;
  // updatedBy: string = "";
}


// Adds warehouse stock details from API
export class WarehouseStock {
  itemId: number = 0;
  stockId: number = 0;
  warehouseId: number = 0;
  warehouse: string = "";
  itemQty: number = 0;
}
