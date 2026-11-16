import { ComponentRef, EventEmitter, Injectable, Output, Type, ViewContainerRef } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import * as XLSX from 'xlsx';
import { AES, enc } from 'crypto-js';
import { environment } from '../../../environments/environment.prod';
import { SearchRequest } from '../../Model/DTO/searchRequest';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  destroyForm: BehaviorSubject<any> = new BehaviorSubject(false);
  data: any = {};
  isSidebarToggle: Subject<boolean> = new Subject<boolean>();
  isSidebarMenuToggle: Subject<boolean> = new Subject<boolean>();
  private secretKey = environment.ENCRYPTION_KEY;
  isSidebarOpen: boolean = false;
  isOpenMessageBox: boolean = false;
  isUserLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }

  setData(option: string, value: any): void {
    this.data[option] = value;
  }

  getData(option: string) {
    return this.data[option];
  }

  removeData(): void {
    this.data = {};
  }

  /**
   * get enum object to all name key of enums
   * @param enumObj target enum object
   * @returns
   */
  getEnumProperties = (enumObj: any) => {
    return Object.keys(enumObj).filter((item) => {
      return isNaN(Number(item));
    });
  }

  getEnumPropertiesWithValue = (enumObj: any) => {
    return Object.keys(enumObj)
      .filter((key) => isNaN(Number(key))) // get only the names like "Zone1", "Zone2"
      .map((key, index) => {
        const formattedLabel = key.replace(/([a-z])([A-Z])/g, '$1 $2'); // insert space between camelCase
        return {
          label: formattedLabel,
          value: index
        };
      });
  }


  /**
   * excel and csv file first sheet read and at least return output json
   * @param file accept excel,csv file
   * @returns return json
   */
  excelToJson(file: File): Observable<any[]> {
    return new Observable<any[]>(observable => {
      let fileReader = new FileReader();
      fileReader.onload = (e) => {
        let arrayBuffer: any = fileReader.result;
        var uint8Array = new Uint8Array(arrayBuffer);
        var arr = new Array();
        for (var i = 0; i != uint8Array.length; ++i) {
          arr[i] = String.fromCharCode(uint8Array[i])
        };
        var bstr = arr.join('');
        var workbook = XLSX.read(bstr, { type: 'binary' });
        var first_sheet_name = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[first_sheet_name];
        var excelJson = XLSX.utils.sheet_to_json(worksheet, { raw: true });

        observable.next(excelJson);
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  /**
   * Any file to cast as bye64
   * @param file
   * @returns return 64byte string
   */
  fileToByeString(file: File): Observable<{ fileName: string, size: number, byte64: string }> {
    return new Observable<{ fileName: string, size: number, byte64: string }>(observable => {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => observable.next({ fileName: file.name, size: file.size, byte64: reader.result as string });
    });
  }

  encrypt(text: string): string {
    const encrypted = AES.encrypt(text, this.secretKey).toString();
    return enc.Base64.stringify(enc.Utf8.parse(encrypted)).replace("=", "$");
  }

  decrypt(encryptText: string): string {
    const encryptedStr = enc.Base64.parse(encryptText.replace("$", "=")).toString(enc.Utf8);
    return AES.decrypt(encryptedStr, this.secretKey).toString(enc.Utf8);
  }

  getSpecific(start: number, end: number, item: any[]) {
    return item?.slice(start, end);
  }

  getSearchModel(searchReq: SearchRequest): string {
    if (searchReq == null) {
      return '';
    }

    let queryParams = '';

    if (searchReq.searchText) {
      queryParams += `?searchText=${encodeURIComponent(searchReq.searchText)}`;
    }
    if (searchReq.SearchMaterial) {
      queryParams += `?SearchMaterial=${searchReq.SearchMaterial}`;
    }
    if(searchReq.IsCustomerRecieved != null && searchReq.IsCustomerRecieved != undefined){
      queryParams += queryParams ? `&IsCustomerRecieved=${searchReq.IsCustomerRecieved}` : `?IsCustomerRecieved=${searchReq.IsCustomerRecieved}`;
    }
    if(searchReq.isCompleted != null && searchReq.isCompleted != undefined){
      queryParams += queryParams ? `&isCompleted=${searchReq.isCompleted}` : `?isCompleted=${searchReq.isCompleted}`;
    }

   

    if (searchReq.pageIndex) {
      queryParams += queryParams ? `&PageIndex=${searchReq.pageIndex}` : `?PageIndex=${searchReq.pageIndex}`;
    }
    if (searchReq.pageSize) {
      queryParams += queryParams ? `&PageSize=${searchReq.pageSize}` : `?PageSize=${searchReq.pageSize}`;
    }
    if (searchReq.IsDraft !== undefined && searchReq.IsDraft !== null) {
      queryParams += queryParams ? `&IsDraft=${searchReq.IsDraft}` : `?IsDraft=${searchReq.IsDraft}`;
    }
    if (searchReq.IsReturn !== undefined && searchReq.IsReturn !== null) {
      queryParams += queryParams ? `&IsReturn=${searchReq.IsReturn}` : `?IsReturn=${searchReq.IsReturn}`;
    }


    // if (searchReq.IsCustomerRecieved !== undefined && searchReq.IsCustomerRecieved !== null) {
    //   queryParams += queryParams ? `&IsCustomerRecieved=${searchReq.IsCustomerRecieved}` : `?IsCustomerRecieved=${searchReq.IsCustomerRecieved}`;
    // }
    if (searchReq.userType) {
      queryParams += queryParams ? `&UserType=${searchReq.userType}` : `?UserType=${searchReq.userType}`;
    }
    if (searchReq.SupplierType) {
      queryParams += queryParams ? `&SupplierType=${searchReq.SupplierType}` : `?SupplierType=${searchReq.SupplierType}`;
    }
    if (searchReq.categoryId) {
      queryParams += queryParams ? `&CategoryId=${searchReq.categoryId}` : `?CategoryId=${searchReq.categoryId}`;
    }
    if (searchReq.categoryId) {
      queryParams += queryParams ? `&CatagoryId=${searchReq.categoryId}` : `?CatagoryId=${searchReq.categoryId}`;
    }
    if (searchReq.userId) {
      queryParams += queryParams ? `&UserId=${searchReq.userId}` : `?UserId=${searchReq.userId}`;
    }
    if (searchReq.materialNo) {
      queryParams += queryParams ? `&MaterialNo=${searchReq.materialNo}` : `?MaterialNo=${searchReq.materialNo}`;
    }
    if (searchReq.warehouseId) {
      queryParams += queryParams ? `&WarehouseId=${searchReq.warehouseId}` : `?WarehouseId=${searchReq.warehouseId}`;
    }
    if (searchReq.invoiceNo) {
      queryParams += queryParams ? `&InvoiceNo=${searchReq.invoiceNo}` : `?InvoiceNo=${searchReq.invoiceNo}`;
    }
    if (searchReq.brandId) {
      queryParams += queryParams ? `&BrandId=${searchReq.brandId}` : `?BrandId=${searchReq.brandId}`;
    }
    if (searchReq.IsBergerItem === true || searchReq.IsBergerItem === false) {
    queryParams += queryParams ? `&IsBergerItem=${searchReq.IsBergerItem}` : `?IsBergerItem=${searchReq.IsBergerItem}`;
  }
    if (searchReq.IsCommonItem) {
      queryParams += queryParams ? `&IsCommonItem=${searchReq.IsCommonItem}` : `?IsCommonItem=${searchReq.IsCommonItem}`;
    }
    if (searchReq.role) {
      queryParams += queryParams ? `&role=${searchReq.role}` : `?role=${searchReq.role}`;
    }
    if (searchReq.roleId) {
      queryParams += queryParams ? `&RoleId=${searchReq.roleId}` : `?RoleId=${searchReq.roleId}`;
    }
    if (searchReq.status !== undefined && searchReq.status !== null) {
      queryParams += queryParams ? `&status=${searchReq.status}` : `?status=${searchReq.status}`;
    }
    if (searchReq.depot) {
      queryParams += queryParams ? `&depot=${searchReq.depot}` : `?depot=${searchReq.depot}`;
    }
    if (searchReq.territory) {
      queryParams += queryParams ? `&territory=${searchReq.territory}` : `?territory=${searchReq.territory}`;
    }
    if (searchReq.zone) {
      queryParams += queryParams ? `&zone=${searchReq.zone}` : `?zone=${searchReq.zone}`;
    }
    if (searchReq.dealer) {
      queryParams += queryParams ? `&dealer=${searchReq.dealer}` : `?dealer=${searchReq.dealer}`;
    }
    if (searchReq.purpose) {
      queryParams += queryParams ? `&purpose=${searchReq.purpose}` : `?purpose=${searchReq.purpose}`;
    }
    if (searchReq.fromDate) {
      queryParams += queryParams ? `&fromDate=${searchReq.fromDate}` : `?fromDate=${searchReq.fromDate}`;
    }
    if (searchReq.toDate) {
      queryParams += queryParams ? `&toDate=${searchReq.toDate}` : `?toDate=${searchReq.toDate}`;
    }
    if (searchReq.activity) {
      queryParams += queryParams ? `&activity=${searchReq.activity}` : `?activity=${searchReq.activity}`;
    }
    if (searchReq.isVolume) {
      queryParams += queryParams ? `&isVolume=${searchReq.isVolume}` : `?isVolume=${searchReq.isVolume}`;
    }
    if (searchReq.month !== undefined && searchReq.year !== null) {
      queryParams += queryParams ? `&month=${searchReq.month}` : `?month=${searchReq.month}`;
    }
    if (searchReq.year !== undefined && searchReq.year !== null) {
      queryParams += queryParams ? `&year=${searchReq.year}` : `?year=${searchReq.year}`;
    }
    if (searchReq.type !== undefined && searchReq.type !== null) {
      queryParams += queryParams ? `&type=${searchReq.type}` : `?type=${searchReq.type}`;
    }
    if (searchReq.userId) {
      queryParams += queryParams ? `&userId=${searchReq.userId}` : `?userId=${searchReq.userId}`;
    }
    if (searchReq.name) {
      queryParams += queryParams ? `&Name=${searchReq.name}` : `?Name=${searchReq.name}`;
    }
    if (searchReq.ItemName) {
      queryParams += queryParams ? `&ItemName=${searchReq.ItemName}` : `?ItemName=${searchReq.ItemName}`;
    }
    if (searchReq.number) {
      queryParams += queryParams ? `&PhoneNumber=${searchReq.number}` : `?PhoneNumber=${searchReq.number}`;
    }
    if (searchReq.address) {
      queryParams += queryParams ? `&Address=${searchReq.address}` : `?Address=${searchReq.address}`;
    }
    if (searchReq.tenantId) {
      queryParams += queryParams ? `&TenantId=${searchReq.tenantId}` : `?TenantId=${searchReq.tenantId}`;
    }
     if (searchReq.PartyType) {
      queryParams += queryParams ? `&PartyType=${searchReq.PartyType}` : `?PartyType=${searchReq.PartyType}`;
    }
    return queryParams;
  }
}
