import { BaseModel } from "./baseModel";

export class Expense extends BaseModel {
//   id: number = 0;
  entryDate: any;
  expenseDate: string = '';
  forWhom: number = 0;
  parentCategoryName: string = '';
  name: string = '';
  expenseAmount: number = 0;
  expensePurpose: string = '';
  categoryName: string = '';
  subCategoryName: string = '';
  remarks: string = '';
  tenantId: number = 0;
}
