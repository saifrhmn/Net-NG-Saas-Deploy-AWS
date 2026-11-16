export class SearchRequest {

  pageIndex: number = 1;
  pageSize: number = 10;
  PartyType: number = 1;
  searchText: string = '';
  SearchMaterial: string = '';
  IsBergerItem: boolean;
  status: number;
  role: string = '';
  roleId: number = 0;
  depot: string;
  territory: string;
  zone: string = '';
  dealer: string = '';
  purpose: string = '';
  fromDate: string = '';
  toDate: string = '';
  activity: string = '';
  isVolume!: boolean;
  month: number;
  year: number;
  type: number;
  userId: string = '';
  name: string = '';
  number: string = '';
  address: string = '';
  ItemName: string = '';
  tenantId: number = 0;
  brandId: number = 0;
  warehouseId: number = 0;
  categoryId: number = 0;
  invoiceNo: number = 0;
  customerId: number = 0;
  materialNo: number = 0;
  userType: number = 0;
  SupplierType: number = 0;
  IsCommonItem: number = 0;
  IsCustomerRecieved: boolean;
  IsDraft: boolean;
  IsReturn: boolean;
  isCompleted: boolean;
  
  // userId: number = 0;
  // number of trailing spaces after the search text (useful when trailing spaces are significant)
  trailingSpaces: number = 0;
  
}
