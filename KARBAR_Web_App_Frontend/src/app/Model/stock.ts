export class Stocks {
  id: number;
  itemId: number;
  itemName: string;
  materialNumber: string;
  stockId: string;
  warehouseId: number;
  warehouseName: string;
  tenantId: number;
  lowStock: number;
  quantity: number;
  warehouse: any[]; // Added this line
  remarks: string;
}
