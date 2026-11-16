import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatTabChangeEvent, MatTabsModule } from "@angular/material/tabs";
import { MatIconModule } from "@angular/material/icon";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthenticatedUser, AuthenticationService } from '../../Services/auth.service';
import { Settings } from '../../Model/settings';
import { RecordStatus } from '../../Common/Enum/appEnums';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { SettingsService } from '../../Services/settings.service';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { ConfirmationDialogComponent } from '../../Common/Component/confirmation-dialog/confirmation-dialog.component';
import {BottomSheetComponent} from '../../Pages/bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | null = null; // don't initialize from this.authService here
  canShowRoleTab: boolean = true;

  lstRole: Settings[] = [];
  lstBrand: Settings[] = [];
  lstWarehouse: Settings[] = [];
  lstUOM: Settings[] = [];
  lstCategory: Settings[] = [];
  lstBank: Settings[] = [];

  searchText: string = '';
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  totalItems: number = 0;
  timer: any;

  showRoleModal: boolean = false;
  isEditRoleModel: boolean = false;

  showUOMModal: boolean = false;
  isEditUOMModel: boolean = false;

  showBrandModal: boolean = false;
  isEditBrandMode: boolean = false;

  showWarehouseModal: boolean = false;
  isEditWarehouseModel: boolean = false;

  showCategoryModal: boolean = false;
  isEditCategoryModel: boolean = false;
 
  showBankModal: boolean = false;
  isEditBankModel: boolean = false;

  searchModel: Settings = new Settings();
  private lastFocusedElement: HTMLElement | null = null;

  hasParentCategory: boolean = false;

  constructor(
    private settingsService: SettingsService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet
  ) {}

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchModel.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);
    this.getAllUOM(this.searchReq);
    // this.getAllRole(this.searchReq);
    const roleId = Number(this.authenticatedUser?.roleId);
    this.canShowRoleTab = roleId !== 3;

    if (this.canShowRoleTab) {
      this.getAllRole(this.searchReq);
    }
    this.setupKeyboardShortcuts();
  }

    ngOnDestroy() {
    // Clean up keyboard listener
    document.removeEventListener('keydown', this.handleKeyboard);
  }

  private openModalAndTrapFocus( modal: 'role' | 'uom' | 'brand' | 'warehouse' | 'category' | 'bank') {
    debugger;
    this.lastFocusedElement = document.activeElement as HTMLElement;

    // open only the requested modal
    this.showRoleModal = modal === 'role';
    this.showUOMModal = modal === 'uom';
    this.showBrandModal = modal === 'brand';
    this.showWarehouseModal = modal === 'warehouse';
    this.showCategoryModal = modal === 'category';
    this.showBankModal = modal === 'bank';

    document.body.classList.add('modal-open');

    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  openCreateRole() {
    this.isEditRoleModel = false;
    this.resetForm();
    this.openModalAndTrapFocus('role');
  }

  onTabChange(event: MatTabChangeEvent) {
    const tabLabel = event.tab.textLabel;
    this.searchReq = new SearchRequest();
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);
    // this.searchReq.searchText = '';
    // this.searchReq.pageIndex = 1;

    if(tabLabel === 'Role'){
      this.getAllRole(this.searchReq);
    }
    else if (tabLabel === 'UOM') {
      this.getAllUOM(this.searchReq);
    } else if (tabLabel === 'WareHouse') {
      this.getAllWarehouse(this.searchReq);
    } else if (tabLabel === 'Category') {
      this.getAllCategories(this.searchReq);
    } else if (tabLabel === 'Brand') {
      this.getAllBrand(this.searchReq);
    }else if (tabLabel === 'Bank Information') {
      this.getAllBanks(this.searchReq);
    }
  }

  resetForm() {
    this.searchModel = new Settings();
    this.searchModel.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.searchModel.status = 1;
  }

allowOnlyText(event: KeyboardEvent) {
  debugger
  const charCode = event.which ? event.which : event.keyCode;

  // Allow A-Z, a-z, space
  if (
    (charCode >= 65 && charCode <= 90) || // A-Z
    (charCode >= 97 && charCode <= 122) || // a-z
    charCode === 32 // space
  ) {
    return true;
  }

  event.preventDefault(); 
  return false;
}

preventPasteNumbers(event: ClipboardEvent) {
  const pastedText = event.clipboardData?.getData('text') || '';
  
  if (/[^A-Za-z\s]/.test(pastedText)) {
    event.preventDefault(); // ❌ block paste if contains number/symbol
  }
}

  getAllRole(model: any) {
    this.settingsService.fetchAllRoles(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstRole = res.result;
        this.totalItems =
          this.lstRole.length > 0 ? this.lstRole[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  createRole(model: any) {
    this.settingsService.createRole(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeRoleModal();
        this.getAllRole(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  // UOM Methods
  openCreateUOM() {
    this.isEditUOMModel = false;
    this.resetForm();
    this.openModalAndTrapFocus('uom');
  }

  getAllUOM(model: any) {
    this.settingsService.fetchAllUOMs(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstUOM = res.result;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
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

  editUOM(uom: Settings) {
    this.isEditUOMModel = true;
    this.searchModel = Object.assign(new Settings(), uom);
    this.openModalAndTrapFocus('uom');
  }

  deleteUOM(uom: Settings) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete UOM';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService.deleteUOM(uom.id).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(res.statusCode, res.result);
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
    });
  }

  closeUOMModal() {
    this.showUOMModal = false;
    this.resetForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  // Brand Methods
  openCreateBrand() {
    this.isEditBrandMode = false;
    this.resetForm();
    this.openModalAndTrapFocus('brand');
  }

  getAllBrand(model: any) {
    this.settingsService.fetchAllBrands(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstBrand = res.result;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
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

  editBrand(brand: Settings) {
    debugger
    this.isEditBrandMode = true;
    this.searchModel = Object.assign(new Settings(), brand);
    this.openModalAndTrapFocus('brand');
  }

  deleteBrand(brand: Settings) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Brand';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService
          .deleteBrand(brand.id)
          .subscribe((res: ApiResponse) => {
            if (res.isSuccess) {
              this.messagHelper.showMessage(res.statusCode, res.result);
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
    });
  }

  closeBrandModal() {
    this.showBrandModal = false;
    this.resetForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  // Warehouse Methods
  openCreateWarehouse() {
    this.isEditWarehouseModel = false;
    this.resetForm();
    this.openModalAndTrapFocus('warehouse');
  }

  getAllWarehouse(model: any) {
    this.settingsService
      .fetchAllWarehouses(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstWarehouse = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) =>
              this.messagHelper.showMessage(res.statusCode, msg)
            );
          }
        }
      });
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

  editWarehouse(wh: Settings) {
    debugger
    this.isEditWarehouseModel = true;
    this.searchModel = Object.assign(new Settings(), wh);
    this.openModalAndTrapFocus('warehouse');
  }

  deleteWarehouse(wh: Settings) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Warehouse';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService
          .deleteWarehouse(wh.id)
          .subscribe((res: ApiResponse) => {
            if (res.isSuccess) {
              this.messagHelper.showMessage(res.statusCode, res.result);
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
    });
  }

  closeWarehouseModal() {
    this.showWarehouseModal = false;
    this.resetForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  editRole(role: Settings) {
    this.isEditRoleModel = true;
    this.searchModel = Object.assign(new Settings(), role);
    this.openModalAndTrapFocus('role');
  }

  deleteRole(role: Settings) {
    debugger;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Role';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService
          .deleteRole(role.id)
          .subscribe((res: ApiResponse) => {
            if (res.isSuccess) {
              this.messagHelper.showMessage(res.statusCode, res.result);
              this.getAllRole(this.searchReq);
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

  closeRoleModal() {
    this.showRoleModal = false;
    this.resetForm();

    document.body.classList.remove('modal-open');

    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
      }, 100);
    }
  }

  onModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeRoleModal();
      return;
    }

    if (event.key === 'Tab') {
      const modalElement = (event.target as HTMLElement).closest(
        '.modal-container'
      );
      if (!modalElement) return;

      const focusableElements = modalElement.querySelectorAll<HTMLElement>(
        'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  onSearch(event: any) {
    debugger;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.target.value;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllRole(this.searchReq);
      this.getAllBrand(this.searchReq);
      this.getAllUOM(this.searchReq);
      this.getAllCategories(this.searchReq);
      this.getAllWarehouse(this.searchReq);
    }, 500);
  }

  // onSearchForBottomSheet(event: any){
  //   clearTimeout(this.timer);
  //   this.timer = setTimeout(() => {
  //     var str = event.name;

  //     this.searchReq.searchText = str;
  //     this.searchReq.pageIndex = 1;

  //     this.getAllRole(this.searchReq);
  //     this.getAllBrand(this.searchReq);
  //     this.getAllUOM(this.searchReq);
  //     this.getAllCategories(this.searchReq);
  //     this.getAllWarehouse(this.searchReq);
  //   }, 100);
  // }

    openNavigationSheet() {
    const ref = this.bottomSheet.open(BottomSheetComponent, {
      data: {
        isPageNavigation: true,
        label: 'Navigate to Page',
        placeholder: 'Type page name (e.g., purchase, order, users)',
      },
    });

    ref.afterDismissed().subscribe((result: any) => {
    });
  }


  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllRole(this.searchReq);
  }

  openCreateCategory() {
    this.isEditCategoryModel = false;
    this.resetForm();
    this.openModalAndTrapFocus('category');
  }

  getAllCategories(model: any) {
    this.settingsService
      .fetchAllCategory(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstCategory = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) =>
              this.messagHelper.showMessage(res.statusCode, msg)
            );
          }
        }
      });
  }

  createCategory(model: any) {
    debugger;
    this.settingsService.createCategory(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeCategoryModal();
        this.getAllCategories(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
  }

  editCategory(wh: Settings) {
    this.isEditCategoryModel = true;
    this.searchModel = Object.assign(new Settings(), wh);
    this.openModalAndTrapFocus('category');
  }

  deleteCategory(wh: Settings) {
    debugger;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Category';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService
          .deleteCategory(wh.id)
          .subscribe((res: ApiResponse) => {
            if (res.isSuccess) {
              this.messagHelper.showMessage(res.statusCode, res.result);
              this.getAllCategories(this.searchReq);
            } else {
              if (res.errorMessage.length > 0) {
                res.errorMessage.forEach((msg) =>
                  this.messagHelper.showMessage(res.statusCode, msg)
                );
              }
            }
          });
      }
    });
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.resetForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }
  openCreateBank() {
    this.isEditBankModel = false;
    this.resetForm();
    this.openModalAndTrapFocus('bank');
  }

  getAllBanks(model: any) {
    this.settingsService.fetchAllBank(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstBank = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) =>
              this.messagHelper.showMessage(res.statusCode, msg)
            );
          }
        }
      });
  }

  createBank(model: any) {
    debugger;
    this.settingsService.createBank(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeBankModal();
        this.getAllBanks(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) =>
            this.messagHelper.showMessage(res.statusCode, msg)
          );
        }
      }
    });
  }

  editBank(wh: Settings) {
    this.isEditBankModel = true;
    this.searchModel = Object.assign(new Settings(), wh);
    this.openModalAndTrapFocus('bank');
  }

  deleteBank(wh: Settings) {
    debugger;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Bank';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.settingsService
          .deleteBank(wh.id)
          .subscribe((res: ApiResponse) => {
            if (res.isSuccess) {
              this.messagHelper.showMessage(res.statusCode, res.result);
              this.getAllBanks(this.searchReq);
            } else {
              if (res.errorMessage.length > 0) {
                res.errorMessage.forEach((msg) =>
                  this.messagHelper.showMessage(res.statusCode, msg)
                );
              }
            }
          });
      }
    });
  }

  closeBankModal() {
    this.showBankModal = false;
    this.resetForm();

    document.body.classList.remove('modal-open');
    if (this.lastFocusedElement) {
      setTimeout(() => this.lastFocusedElement?.focus(), 100);
    }
  }

  showBottomSheet() {
    this.bottomSheet.open(BottomSheetComponent);
  }

  private handleKeyboard = (event: KeyboardEvent) => {
    // F2 key opens bottom sheet
    // if (event.key === 'F2') {
    if (event.key === 'Alt') {
      event.preventDefault();
      this.openSearchForItemName();
    }
    else if (event.key === 'Control') {
      this.closeBottomSheet();
    }
  };

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleKeyboard);
  }

  openSearchForItemName() {
  const ref = this.bottomSheet.open(BottomSheetComponent, {
    data: {
      field: 'name',  // Settings model uses 'name' property
      placeholder: 'Search by Name...',
      label: 'Search',
      initialValue: '' // optional
    }
  });
  debugger
  ref.afterDismissed().subscribe((result: { field: string; query: string } | null) => {
    if (result && result.query !== undefined && result.field) {
      // this.onSearchForBottomSheet(this.searchReq);
      (this.searchReq as any)[result.field] = result.query;
      

    }
  });
}
  closeBottomSheet() {
    this.bottomSheet.dismiss();
  }
}
