import {
  Component,
  inject,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../Common/Component/confirmation-dialog/confirmation-dialog.component';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../Services/auth.service';
import { RecordStatus } from '../../Common/Enum/appEnums';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Supplier } from '../../Model/supplier';
import { ItemService } from '../../Services/item.service';
import { Item } from '../../Model/item';
import { SettingsService } from '../../Services/settings.service';
import { Settings } from '../../Model/settings';
import { MatChipsModule } from '@angular/material/chips';
import { exportToExcel } from '../../Common/Utils/utils';
import * as XLSX from 'xlsx';
import { TypeableSelectionDropdownComponent } from '../../Common/Component/typeable-selection-dropdown/typeable-selection-dropdown.component';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    MatChipsModule,
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    TypeableSelectionDropdownComponent
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss',
})
export class ItemComponent implements AfterViewInit {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;

  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | null = null; // don't initialize from this.authService here
  lstItem: Item[] = [];
  lstCategories: any[] = [];
  lstSubCategories: any[] = [];
  lstBrands: any[] = [];
  lstUnits: any[] = [];
  lstWarehouses: any[] = [];
  selectedCategory: string = 'all';
  selectedBrand: string = 'all';
  searchText: string = '';
  isAdmin: boolean = false;
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  totalItems: number = 0;
  itemNameSuggestions: string[] = [];
  showItemNameSuggestions = false;
  matNoSuggestions: string[] = [];
  showMatNoSuggestions = false;
  timer: any;
  showItemModal: boolean = false;
  showViewModal: boolean = false;
  viewItem: Item = new Item();
  isEditMode: boolean = false;
  searchModel: Item = new Item();
  imagePreview: string | '' = '';
  selectedFile: File | null = null;

    filteredBrands: any[] = [];
  selectedBrandName: string = '';
  selectedCategoryName: string = '';
filteredCategories: any[] = [];


  showPriceInfo: boolean = false;
  showPricePasswordModal: boolean = false;
  pricePasswordInput: string = '';
  pricePasswordError: string = '';
  verifyingPricePassword: boolean = false;
  private lastFocusedElement: HTMLElement | null = null;

  searchModelSettings: Settings = new Settings();

  showUOMModal: boolean = false;
  isEditUOMModel: boolean = false;

  showBrandModal: boolean = false;
  isEditBrandMode: boolean = false;

  showWarehouseModal: boolean = false;
  isEditWarehouseModel: boolean = false;

  showCategoryModal: boolean = false;
  isEditCategoryMode: boolean = false;
  hasParentCategory: boolean = false;


  public viewMode: 'grid' | 'list' = 'grid';



  // pageIndex = 0;
  // pageSize = 12;
  // pageSizeOptions = [8, 12, 24, 48];
  // pagedItems: any[] = [];

  constructor(
    private router: Router,
    private itemService: ItemService,
    private settingsService: SettingsService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchModel.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);
    // this.searchReq.pageIndex = this.searchReq.pageIndex || 1;
    // this.searchReq.pageSize = this.searchReq.pageSize || this.pageSize;
    this.getAllCategory(this.searchReq);
    this.getAllItems(this.searchReq);
    this.getAllBrand(this.searchReq);
    this.getAllWarehouse(this.searchReq);
    this.getAllUOM(this.searchReq);
    console.log(this.authenticatedUser.tenantId);
  }

  ngAfterViewInit() { }

  openCreateItem() {
    this.isEditMode = false;
    this.resetItemForm();
    this.openItemModalAndTrapFocus();
  }

  toggleView() {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }
  refreshItemlist() {
    this.selectedBrand = '';
    this.selectedCategory = '';
    this.searchReq.categoryId = 0;
    this.searchReq.brandId = 0;
    this.selectedBrand = '';
    this.selectedBrandName = '',
    this.selectedCategoryName = '';
    this.selectedCategory = '';
    this.getAllItems(this.searchReq);
  }
onBrandSearch(searchValue: any) {
  const query = (searchValue || '').toLowerCase().trim();
  
  if (query === '') {
    this.filteredBrands = this.lstBrands;
  } else {
    this.filteredBrands = this.lstBrands.filter(brand =>
      brand.name.toLowerCase().includes(query)
    );
  }
}

onBrandOptionSelected(event: any) {
  const selectedBrand = event.fullObject;
  const brandId = selectedBrand?.id;
  const brandName = selectedBrand?.name;
  
  this.selectedBrandName = brandName;
  this.searchModel.brandId = brandId;  
  this.onBrandChange(brandId, brandName);
}

onBrandChange(brandId: any, brandName: string) {
  this.searchReq.brandId = brandId;
  this.selectedBrandName = brandName;
  debugger
  if(this.showItemModal == false){
    this.getAllItems(this.searchReq);
  }else{
    return;
  }
}
  
  /**
   * Download items as Excel file
   */
  downloadItemsExcel() {
    const rows = (this.lstItem || []).map((item: any) => ({
      'Item Name': item.name ?? '',
      'Material Number': item.materialNumber ?? '',
      'Description': item.itemDescription ?? '',
      'Category': item.categoryName ?? '',
      'Brand': item.brandName ?? '',
      'Unit': item.uomName ?? '',
      'MRP': Number(item.mrp ?? 0),
      'Purchase Price': Number(item.purchasePrice ?? 0),
      'Selling Price': Number(item.sellingPrice ?? 0),
      'Safety Stock': Number(item.lowStock ?? 0),
    }));

    if (!rows.length) {
      this.messagHelper.showMessage(400, 'No items to download');
      return;
    }

    // Use the Excel export utility
    exportToExcel(rows);
    this.messagHelper.showMessage(200, 'Items downloaded successfully');
  }
handleViewClick(event: Event, itemId: any) {
  event.stopPropagation();
  this.openViewModal(itemId);
}

handleEditClick(event: Event, item: any) {
  event.stopPropagation();
  this.editItem(item);
}
  /**
   * Upload items from Excel/CSV file
   */
  // onFileUpload(event: any) {
  //   const file = event.target.files?.[0];
  //   if (!file) {
  //     console.warn('No file selected');
  //     return;
  //   }

  //   console.log('File selected:', file.name, 'size:', file.size);
  //   const fileName = file.name.toLowerCase();
    
  //   // Check if it's an Excel file
  //   const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.xlsm');
    
  //   const reader = new FileReader();
    
  //   reader.onerror = (error) => {
  //     console.error('FileReader error:', error);
  //     this.messagHelper.showMessage(500, 'Error reading file');
  //     event.target.value = '';
  //   };

  //   reader.onload = (e: any) => {
  //     try {
  //       let headers: string[] = [];
  //       let rows: any[] = [];

  //       if (isExcel) {
  //         // Parse Excel file
  //         const data = new Uint8Array(e.target.result);
  //         const workbook = XLSX.read(data, { type: 'array' });
  //         const sheet = workbook.Sheets[workbook.SheetNames[0]];
  //         const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          
  //         if (jsonData.length === 0) {
  //           this.messagHelper.showMessage(400, 'Excel file is empty');
  //           event.target.value = '';
  //           return;
  //         }

  //         // Get headers from first row keys
  //         headers = Object.keys(jsonData[0]).map(h => h.toLowerCase().trim());
          
  //         // Convert to row format
  //         rows = jsonData.map((obj: any) => 
  //           Object.keys(jsonData[0]).map(key => obj[key]?.toString() || '')
  //         );

  //         console.log('Excel file parsed. Headers:', headers, 'Rows:', rows.length);
  //       } else {
  //         // Parse CSV file
  //         const csv = e.target.result;
  //         console.log('File loaded, length:', csv.length);
  //         const lines = csv.split('\n').filter((line: string) => line.trim().length > 0);

  //         // Parse CSV properly - handle quoted values
  //         const parseCSVLine = (line: string) => {
  //           const values = [];
  //           let current = '';
  //           let inQuotes = false;

  //           for (let i = 0; i < line.length; i++) {
  //             const char = line[i];
  //             const nextChar = line[i + 1];

  //             if (char === '"') {
  //               if (inQuotes && nextChar === '"') {
  //                 current += '"';
  //                 i++; // Skip next quote
  //               } else {
  //                 inQuotes = !inQuotes;
  //               }
  //             } else if (char === ',' && !inQuotes) {
  //               values.push(current.trim());
  //               current = '';
  //             } else {
  //               current += char;
  //             }
  //           }
  //           values.push(current.trim());
  //           return values;
  //         };

  //         // Parse headers - normalize to lowercase
  //         const headerLine = lines[0];
  //         headers = parseCSVLine(headerLine).map((h: string) => h.toLowerCase().trim());
          
  //         // Parse data rows
  //         for (let i = 1; i < lines.length; i++) {
  //           rows.push(parseCSVLine(lines[i]));
  //         }
  //       }

  //       const itemsToCreate: any[] = [];

  //       // Process rows
  //       for (let i = 0; i < rows.length; i++) {
  //         const values = rows[i];
          
  //         if (!values || (Array.isArray(values) && values.every(v => !v))) continue; // Skip empty rows

  //         // Create mapping for flexible column names
  //         const getColumnValue = (columnName: string) => {
  //           const index = headers.findIndex(h => 
  //             h.includes(columnName.toLowerCase()) || 
  //             columnName.toLowerCase().includes(h)
  //           );
  //           return index >= 0 ? values[index]?.toString().trim() || '' : '';
  //         };

  //         const item = {
  //           name: getColumnValue('name') || getColumnValue('item name') || '',
  //           materialNumber: getColumnValue('material') || getColumnValue('material number') || getColumnValue('material no'),
  //           itemDescription: getColumnValue('description') || getColumnValue('desc') || '',
  //           categoryName: getColumnValue('category') || '',
  //           brandName: getColumnValue('brand') || '',
  //           uomName: getColumnValue('uom') || getColumnValue('unit') || '',
  //           mrp: Number(getColumnValue('mrp')) || 0,
  //           purchasePrice: Number(getColumnValue('purchase')) || Number(getColumnValue('purchase price')) || 0,
  //           sellingPrice: Number(getColumnValue('selling')) || Number(getColumnValue('selling price')) || 0,
  //           lowStock: Number(getColumnValue('safety')) || Number(getColumnValue('safety stock')) || Number(getColumnValue('low stock')) || 0,
  //         };

  //         // Validate required fields
  //         if (!item.name || !item.materialNumber) {
  //           this.messagHelper.showMessage(400, `Row ${i + 2} missing Item Name or Material Number - skipping`);
  //           continue;
  //         }

  //         itemsToCreate.push(item);
  //       }

  //       if (itemsToCreate.length === 0) {
  //         console.warn('No valid items found in file');
  //         this.messagHelper.showMessage(400, 'No valid items found in file');
  //         event.target.value = '';
  //         return;
  //       }

  //       console.log('Parsed items:', itemsToCreate.length);
  //       this.messagHelper.showMessage(200, `Uploading ${itemsToCreate.length} items...`);
  //       this.createItemsBulk(itemsToCreate);
        
  //     } catch (error) {
  //       console.error('Error parsing file:', error);
  //       this.messagHelper.showMessage(500, 'Error parsing file: ' + (error as any).message);
  //       event.target.value = '';
  //     } finally {
  //       // Always reset file input
  //       event.target.value = '';
  //     }
  //   };

  //   if (isExcel) {
  //     reader.readAsArrayBuffer(file);
  //   } else {
  //     reader.readAsText(file);
  //   }
  // }
  onFileUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('File', file);

  this.itemService.createBulkItem(formData).subscribe({
    next: (res: ApiResponse) => {
      if (res.isSuccess) {
        this.getAllItems(this.searchReq);
        this.messagHelper.showMessage(200, res.result || 'Upload successful');
        event.target.value = ''; // Reset file input
      } else {
        this.messagHelper.showMessage(400, res.result || 'Upload failed');
      }
    },
    error: (err: any) => {
      let errorMsg = 'Upload error';
      if (err?.error?.message) {
        errorMsg = err.error.message;
      } else if (err?.error?.result) {
        errorMsg = err.error.result;
      } else if (err?.message) {
        errorMsg = err.message;
      } else if (err?.statusText) {
        errorMsg = err.statusText;
      }
      console.error('Upload failed:', err);
      this.messagHelper.showMessage(500, errorMsg);
    }
  });
}
  /**
   * Create items in bulk from uploaded file
   */
  // private createItemsBulk(items: any[]) {
  //   if (!items.length) return;
  //   console.log('Creating bulk items:', items.length, 'items');

  //   // Transform parsed items to Item objects with lookups
  //   const itemsToUpload: Item[] = items.map((itemData: any) => {
  //     const item = new Item();
  //     item.name = itemData.name;
  //     item.materialNumber = itemData.materialNumber;
  //     item.itemDescription = itemData.itemDescription;
  //     item.mrp = Number(itemData.mrp) || 0;
  //     item.purchasePrice = Number(itemData.purchasePrice) || 0;
  //     item.sellingPrice = Number(itemData.sellingPrice) || 0;
  //     item.lowStock = Number(itemData.lowStock) || 0;
  //     item.tenantId = Number(this.authenticatedUser?.tenantId) || 0;

  //     // Look up and set categoryId, brandId, uomId based on names
  //     const category = this.lstCategories.find(c => 
  //       c.name?.toLowerCase() === itemData.categoryName?.toLowerCase()
  //     );
  //     const brand = this.lstBrands.find(b => 
  //       b.name?.toLowerCase() === itemData.brandName?.toLowerCase()
  //     );
  //     const unit = this.lstUnits.find(u => 
  //       u.name?.toLowerCase() === itemData.uomName?.toLowerCase()
  //     );

  //     item.categoryId = category?.id ?? 0;
  //     item.brandId = brand?.id ?? 0;
  //     item.uomId = unit?.id ?? 0;

  //     return item;
  //   });

  //   // Call bulk API with all items wrapped in payload
  //   // const payload = { items: itemsToUpload };
  //   const payload = itemsToUpload;
  //   console.log('Sending bulk upload:', payload);
  //   this.itemService.createBulkItem(payload).subscribe({
  //     next: (res: ApiResponse) => {
  //       if (res.isSuccess) {
  //         this.getAllItems(this.searchReq);
  //         this.messagHelper.showMessage(200, `Successfully uploaded ${itemsToUpload.length} items`);
  //       } else {
  //         this.messagHelper.showMessage(400, `Upload failed: ${res.errorMessage || 'Unknown error'}`);
  //       }
  //     },
  //     error: (err: any) => {
  //       let errorMessage = 'Network error';
  //       if (err?.error?.message) {
  //         errorMessage = err.error.message;
  //       } else if (err?.message) {
  //         errorMessage = err.message;
  //       } else if (err?.statusText) {
  //         errorMessage = err.statusText;
  //       }
  //       this.messagHelper.showMessage(500, `Error uploading items: ${errorMessage}`);
  //       console.error('Bulk upload error:', err);
  //     }
  //   });
  // }


  private getUniqueItemNames(): string[] {
    return Array.from(
      new Set(
        (this.lstItem || [])
          .map(i => (i?.name ?? '').trim())
          .filter(n => n.length > 0)
      )
    );
  }

  private getUniqueMaterialNumbers(): string[] {
    return Array.from(
      new Set(
        (this.lstItem || [])
          .map(i => (i?.materialNumber ?? '').trim())
          .filter(n => n.length > 0)
      )
    );
  }

  onItemNameInput(value: string) {
    const q = (value || '').trim().toLowerCase();
    if (!q) {
      this.itemNameSuggestions = [];
      this.showItemNameSuggestions = false;
      return;
    }
    const names = this.getUniqueItemNames();
    this.itemNameSuggestions = names
      .filter(n => n.toLowerCase().includes(q))
      .slice(0, 8);
    this.showItemNameSuggestions = this.itemNameSuggestions.length > 0;
  }

  selectItemNameSuggestion(name: string) {
    this.searchModel.name = name;
    this.showItemNameSuggestions = false;
    this.itemNameSuggestions = [];
  }
  selectMatNoSuggestion(name: string) {
    this.searchModel.materialNumber = name;
    this.showMatNoSuggestions = false;
    this.matNoSuggestions = [];
  }

  onItemNameBlur() {
    // Delay so click on suggestion can register before closing
    setTimeout(() => {
      this.showItemNameSuggestions = false;
    }, 150);
  }

  onMaterialNumberInput(value: string) {
    const q = (value || '').trim().toLowerCase();
    if (!q) {
      this.matNoSuggestions = [];
      this.showMatNoSuggestions = false;
      return;
    }
    const materialNumbers = this.getUniqueMaterialNumbers();
    this.matNoSuggestions = materialNumbers
      .filter(n => n.toLowerCase().includes(q))
      .slice(0, 8);
    this.showMatNoSuggestions = this.matNoSuggestions.length > 0;
  }

  onMaterialNumberBlur() {
    // Delay so click on suggestion can register before closing
    setTimeout(() => {
      this.showMatNoSuggestions = false;
    }, 150);
  }
  getAllItems(model: any) {
    this.itemService.fetchAllItems(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstItem = res.result;
        this.totalItems = Number(res.totalCount ?? (this.lstItem[0]?.totalCount) ?? this.lstItem.length);
        this.searchReq.pageIndex = Number(model.pageIndex || this.searchReq.pageIndex || 1);

      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  // Generic handlers for numeric fields to prevent negative values
  onNumericKeydown(event: KeyboardEvent, field: string) {
    const key = event.key;
    const val = Number((this.searchModel as any)?.[field] ?? 0);
    if (key === 'ArrowDown' && val <= 0) {
      event.preventDefault();
      return;
    }
    if (key === '-' || key === 'Subtract') {
      event.preventDefault();
      return;
    }
  }

  onNumericInput(field: string) {
    if (!this.searchModel) return;
    const v = Number((this.searchModel as any)[field]);
    if (isNaN(v) || v < 0) {
      (this.searchModel as any)[field] = 0;
    }
  }

  onNumericPaste(event: ClipboardEvent, field: string) {
    const paste = event.clipboardData?.getData('text') ?? '';
    if (paste.trim().startsWith('-')) {
      event.preventDefault();
      return;
    }
    const num = Number(paste);
    if (isNaN(num)) {
      event.preventDefault();
      return;
    }
    if (num < 0) {
      event.preventDefault();
    }
  }

  onNumericWheel(event: WheelEvent) {
    const active = document.activeElement as HTMLElement | null;
    if (active && active.tagName === 'INPUT' && active.classList.contains('form-input')) {
      event.preventDefault();
    }
  }

    getAllItemDetails(id: number) {
      debugger
    //   if(id != null && id != undefined ){
    //   this.isEditMode = true;
    // }
    this.itemService.fetchAllItemDetails(id).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
              debugger
      
        // this.viewItem = res.result;
        // if (this.isEditMode == true) {
        //   this.searchModel = Object.assign(new Item(), this.viewItem);
        //   this.openItemModalAndTrapFocus();
        //   this.searchModel = { ...this.viewItem };

        this.viewItem = res.result;
if (this.isEditMode == true) {
  this.searchModel = Object.assign(new Item(), this.viewItem);
  this.searchModel = { ...this.viewItem };

  // populate the typeable dropdowns for edit mode
  this.selectedBrandName = this.viewItem.brandName ?? '';
  this.selectedCategoryName = this.viewItem.categoryName ?? '';

  this.openItemModalAndTrapFocus();

  // If the item already has a base64 or image URL, show it
  if (this.viewItem.imageBase64) {

          // If the item already has a base64 or image URL, show it
          if (this.viewItem.imageBase64) {
            this.imagePreview =
              'data:image/png;base64,' + this.viewItem.imageBase64;
          } else if (this.viewItem.imageUrl) {
            this.imagePreview = this.viewItem.imageUrl;
          } else {
            this.imagePreview = '';
          }
        }
        // this.isEditMode = false;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    }});
  }
  togglePrice(event?: Event) {
    if (event) {
      event.stopPropagation(); // prevent modal/card click side-effects
    }
    if (this.showPriceInfo) {
      this.showPriceInfo = false;
      return;
    }
    this.pricePasswordInput = '';
    this.pricePasswordError = '';
    this.showPricePasswordModal = true;
  }

  closePricePasswordModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showPricePasswordModal = false;
    this.pricePasswordInput = '';
    this.pricePasswordError = '';
  }

  confirmPricePassword(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!this.pricePasswordInput) {
      this.pricePasswordError = 'Password is required';
      return;
    }
    this.verifyingPricePassword = true;
    this.authService
      .login({ phoneNo: this.authenticatedUser?.phoneNumber, password: this.pricePasswordInput })
      .subscribe({
        next: (res: ApiResponse) => {
          this.verifyingPricePassword = false;
          if (res.isSuccess) {
            this.showPriceInfo = true;
            this.closePricePasswordModal();
          } else {
            this.pricePasswordError = 'Incorrect password';
          }
        },
        error: () => {
          this.verifyingPricePassword = false;
          this.pricePasswordError = 'Incorrect password';
        },
      });
  }
  // onSearch(event: any) {
  //   debugger;
  //   clearTimeout(this.timer);
  //   this.timer = setTimeout(() => {
  //     var str = event.target.value;

  //     this.searchReq.searchText = str;
  //     this.searchReq.pageIndex = 1;

  //     this.getAllItems(this.searchReq);
  //   }, 500);
  // }

  onSearch(event: any) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const raw = (event?.target?.value ?? '') as string;

      // If input is empty or only spaces, clear searchText and trailingSpaces
      if (!raw || raw.trim().length === 0) {
        this.searchReq.searchText = '';
        this.searchReq.trailingSpaces = 0;
      } else {
        // Compute trailing spaces count (keeps track of spaces after text)
        const withoutTrailing = raw.trimEnd();
        const trailingCount = raw.length - withoutTrailing.length;

        // Store text without trailing spaces and the count separately
        this.searchReq.searchText = withoutTrailing;
        this.searchReq.trailingSpaces = trailingCount;
      }

      this.searchReq.pageIndex = 1;
      this.getAllItems(this.searchReq);
    }, 500);
  }



  convertImageUrlToBase64(imageUrl: string): Promise<string> {
    return fetch(imageUrl)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
  }

  editItem(item: Item) {
    debugger
    this.getAllItemDetails(item.id);
    this.isEditMode = true;
    if (item.imageUrl == null) {
      item.imageUrl = '';
    } else {
      //  item.imageUrl ='data:image/png;base64,' + item.imageBase64;
    }
  }

  private openItemModalAndTrapFocus() {
    this.lastFocusedElement = document.activeElement as HTMLElement;

    // Open the modal
    this.showItemModal = true;

    document.body.classList.add('modal-open');

    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  createItem(model: any) {
    debugger
    model.warehouseId = 0;
    model.barcode = '';
    if(model.id != null && model.id != undefined && model.id != ''){
      this.isEditMode = true;
    }
    if(model.brandId == 0 || model.categoryId == 0 || model.uomId == 0){
      this.messagHelper.showMessage(400, 'Please select category, brand, and unit of measure');
    } else{
          if (model.imageUrl != '' && model.itemId != '') {
          let payload = { ...model };
          const { imageUrl, ...rest } = payload;
          payload = rest; //


      this.itemService.createItem(payload).subscribe((res: ApiResponse) => {
        
        if (res.isSuccess) {
          this.messagHelper.showMessage(res.statusCode, res.result);
          this.closeItemModal();
          this.getAllItems(this.searchReq);
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      }
    );
    } else {
      this.itemService.createItem(model).subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.messagHelper.showMessage(res.statusCode, res.result);
          this.closeItemModal();
          this.getAllItems(this.searchReq);
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
    }
    }

  }

  deleteItem(item: Item) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Item';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.itemService.deleteItem(item.id).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(res.statusCode, res.result);
            this.getAllItems(this.searchReq);
          } else {
            if (res.errorMessage.length > 0) {
              res.errorMessage.forEach((msg) => {
                this.messagHelper.showMessage(res.statusCode, msg);
              });
            }
          }
        });
      }
    });
  }

  getPerWarehouseStocks(item: any): Array<{ warehouseId: number; name: string; qty: number }> {
    const stocks = item.warehousestk ?? item.wareHouseStk ?? item.warehouseStock ?? [];
    if (!Array.isArray(stocks) || stocks.length === 0) {
      return [
        { warehouseId: 0, name: 'All', qty: Number(item.totalCount ?? item.availableStock ?? item.stock ?? 0) },
      ];
    }
    return stocks.map((s: any) => {
      const wid = Number(s.warehouseId ?? 0);
      const name = (this.lstWarehouses || []).find((w: any) => Number(w.id) === wid)?.name ?? `W${wid}`;
      const qty = Number(s.itemQty ?? s.qty ?? 0);
      return { warehouseId: wid, name, qty };
    });
  }

  checkIsAdmin() {
    return AuthenticationService.getIsAdmin();
  }

  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllItems(this.searchReq);
  }

  closeItemModal() {
    this.showItemModal = false;
    this.resetItemForm();
    this.selectedBrandName = '';
    this.selectedCategoryName = '';
    // Remove class from body to restore background scrolling
    document.body.classList.remove('modal-open');

    // Restore focus to the element that opened the modal
    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
      }, 100);
    }
  }

  onModalKeydown(event: KeyboardEvent) {
    // Close modal on Escape key
    if (event.key === 'Escape') {
      this.closeItemModal();
      return;
    }

    // Trap focus within modal on Tab key
    if (event.key === 'Tab') {
      const modalElement = (event.target as HTMLElement).closest(
        '.modal-container'
      );
      if (!modalElement) return;

      // Get all focusable elements in the modal
      const focusableElements = modalElement.querySelectorAll<HTMLElement>(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If Shift+Tab on first element, go to last element
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
      // If Tab on last element, go to first element
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  resetItemForm() {
    this.searchModel = new Item();
    this.searchModel.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.searchModel.status = 1;
    this.imagePreview = '';
    this.selectedFile = null;
  }

  // onCategoryChange(id: any) {
  //   this.searchReq.categoryId = id;
  //   this.getAllItems(this.searchReq);
  // }
  // onBrandChange(id: any) {
  //   this.searchReq.brandId = id;
  //   this.getAllItems(this.searchReq);
  // }

  onCategorySearch(searchValue: any) {
  const query = (searchValue || '').toLowerCase().trim();
  
  if (query === '') {
    this.filteredCategories = this.lstCategories;
  } else {
    this.filteredCategories = this.lstCategories.filter(category =>
      category.name.toLowerCase().includes(query)
    );
  }
}

onCategoryOptionSelected(event: any) {
  const selectedCategory = event.fullObject;
  const categoryId = selectedCategory?.id;
  const categoryName = selectedCategory?.name;
  
  this.selectedCategoryName = categoryName;
  this.searchModel.categoryId = categoryId;
  this.onCategoryChange(categoryId, categoryName);
}

onCategoryChange(categoryId: any, categoryName?: string) {
  this.searchReq.categoryId = categoryId;
  if (categoryName) {
    this.selectedCategoryName = categoryName;
  }
    if(this.showItemModal == false){
    this.getAllItems(this.searchReq);
  }else{
    return;
  }
  // this.getAllItems(this.searchReq);
}

  handleImageError(event: any) {
    const defaultImage = 'assets/img/berger-pack-img.png';
    // Prevent infinite loop by checking if we're already showing the default image
    if (event.target.src.indexOf(defaultImage) === -1) {
      event.target.src = defaultImage;
    }
  }

  // handleImageError(event: Event): void {
  //   debugger
  //   const img = event.target as HTMLImageElement | null;
  //   const fallback = 'assets/img/no-image.webp';
  //   if (img && !img.src.includes(fallback)) {
  //     img.src = fallback;
  //   }
  // }

  getItemImage(item: Item): string {
    // Return imageBase64 if available, otherwise imageUrl, otherwise the default fallback image
    if (item.imageBase64 && item.imageBase64.trim() !== '') {
      return item.imageBase64;
    }
    if (item.imageUrl && item.imageUrl.trim() !== '') {
      return item.imageUrl;
    }
    return 'assets/img/berger-pack-img.png';
  }

  // getItemImage(item: Item): string {
  //   const fallback = 'assets/img/no-image.webp';
  //   if (!item) return fallback;

  //   // Prefer base64 if present; ensure proper data: prefix
  //   if (item.imageBase64 && item.imageBase64.toString().trim() !== '') {
  //     const v = item.imageBase64.toString().trim();
  //     return v.startsWith('data:') ? v : `data:image/png;base64,${v}`;
  //   }

  //   if (item.imageUrl && item.imageUrl.toString().trim() !== '') {
  //     return item.imageUrl.toString().trim();
  //   }

  //   return fallback;
  // }

  openViewModal(id: number) {
    // this.viewItem = item;
    debugger
    this.isEditMode = false;
    this.getAllItemDetails(id);
    this.showViewModal = true;
    // this.lastFocusedElement = document.activeElement as HTMLElement;
    // document.body.classList.add('modal-open');
  }

  closeViewModal() {
    this.showViewModal = false;
    this.showPriceInfo = false;
    this.closePricePasswordModal();
    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      this.lastFocusedElement.focus();
    }
  }

  getAllCategory(model: any) {
    this.searchReq.pageSize = null;
    this.settingsService
      .fetchAllCategory(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstCategories = res.result;
          this.totalItems =
            this.lstCategories.length > 0
              ? this.lstCategories[0].totalCount
              : 0;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }
  getAllBrand(model: any) {

    this.searchReq.pageSize = null;
    this.settingsService.fetchAllBrands(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstBrands = res.result;
        this.totalItems =
          this.lstBrands.length > 0 ? this.lstBrands[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }
  getAllWarehouse(model: any) {
    this.settingsService
      .fetchAllWarehouses(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstWarehouses = res.result;
          this.totalItems =
            this.lstWarehouses.length > 0
              ? this.lstWarehouses[0].totalCount
              : 0;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }
  getAllUOM(model: any) {
    this.settingsService.fetchAllUOMs(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstUnits = res.result;
        this.totalItems =
          this.lstUnits.length > 0 ? this.lstUnits[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;

        // 🔹 Remove 'data:image/...;base64,' part if backend expects pure base64
        const base64Data = e.target.result.split(',')[1];

        this.searchModel.imageBase64 = base64Data;
      };
      reader.readAsDataURL(file);
    }
  }

  openAddCategory() {
    this.isEditCategoryMode = false;
    this.resetSettingsForm();
    this.openModalAndTrapFocus('category');
  }

  openAddSubCategory() {
    // TODO: Implement add sub category modal
    this.messagHelper.showMessage(
      200,
      'Add Sub Category functionality to be implemented'
    );
  }

  createBrand(model: any) {
    this.settingsService.createBrand(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeBrandModal();
        this.getAllBrand(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
  }

  // closeBrandModal() {
  //   this.showBrandModal = false;
  //   this.resetItemForm();

  //   document.body.classList.remove('modal-open');
  //   if (this.lastFocusedElement) {
  //     setTimeout(() => this.lastFocusedElement?.focus(), 100);
  //   }
  // }

  closeBrandModal() {
    this.showBrandModal = false;
    this.resetSettingsForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  openAddBrand() {
    this.isEditBrandMode = false;
    this.resetSettingsForm();
    this.openModalAndTrapFocus('brand');
  }

  openAddUnit() {
    this.isEditUOMModel = false;
    this.resetSettingsForm();
    this.openModalAndTrapFocus('uom');
  }

  openAddWarehouse() {
    this.isEditWarehouseModel = false;
    this.resetSettingsForm();
    this.openModalAndTrapFocus('warehouse');
  }

  private openModalAndTrapFocus(
    modal: 'brand' | 'uom' | 'warehouse' | 'category'
  ) {
    this.lastFocusedElement = document.activeElement as HTMLElement;

    this.showBrandModal = modal === 'brand';
    this.showUOMModal = modal === 'uom';
    this.showWarehouseModal = modal === 'warehouse';
    this.showCategoryModal = modal === 'category';

    document.body.classList.add('modal-open');

    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  resetSettingsForm() {
    this.searchModelSettings = new Settings();
    this.searchModelSettings.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.searchModelSettings.status = 1;
  }

  createUOM(model: any) {
    this.settingsService.createUOM(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeUOMModal();
        this.getAllUOM(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
  }

  closeUOMModal() {
    this.showUOMModal = false;
    this.resetSettingsForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  createWarehouse(model: any) {
    this.settingsService
      .createWarehouse(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.messagHelper.showMessage(res.statusCode, res.result);
          this.closeWarehouseModal();
          this.getAllWarehouse(this.searchReq);
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) =>
              this.messagHelper.showMessage(res.statusCode, msg)
            );
          }
        }
      });
  }

  closeWarehouseModal() {
    this.showWarehouseModal = false;
    this.resetSettingsForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  createCategory(model: any) {
    this.settingsService.createCategory(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeCategoryModal();
        this.getAllCategory(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.resetSettingsForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }



}
