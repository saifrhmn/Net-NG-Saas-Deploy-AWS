import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { AuthenticatedUser, AuthenticationService } from '../../Services/auth.service';
import { RecordStatus } from '../../Common/Enum/appEnums';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { MatPaginatorModule } from '@angular/material/paginator';
import { SupplierService } from '../../Services/supplier.service';
import { MatOption } from "@angular/material/core";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatSelect } from "@angular/material/select";
import { Supplier } from '../../Model/supplier';
import {BottomSheetComponent} from '../../Pages/bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-supplier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatOption,
    MatFormField,
    MatSelect,
    MatLabel
],
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent implements AfterViewInit {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;

  authService: AuthenticationService = inject(AuthenticationService);
  // authenticatedUser: AuthenticatedUser | any = this.authService.authenticateUser();
  authenticatedUser: AuthenticatedUser | null = null; // don't initialize from this.authService here
  lstSuppler: Supplier[] = [];
  searchText: string = '';
  isAdmin: boolean = false;
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  supplier: Supplier = new Supplier();
  totalItems: number = 0;
  timer: any;
  showSupplierModal: boolean = false;
  isEditMode: boolean = false;
  // model used for create / edit modal
  searchModelforCreate: Supplier = new Supplier();
  private lastFocusedElement: HTMLElement | null = null;

  constructor(
    private router: Router,
    private supplierService: SupplierService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchModelforCreate.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);

    this.getAllSuppliers(this.searchReq);
    this.setupKeyboardShortcuts();
    console.log(this.authenticatedUser.tenantId);
  }

  ngAfterViewInit() {
    // Lifecycle hook for view initialization
  }

  openCreateSupplier() {
    this.isEditMode = false;
    this.resetSupplierForm();
    this.openModalAndTrapFocus();
  }

  getAllSuppliers(model:any) {
    this.supplierService.fetchAllSuppliers(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstSuppler = res.result;
        this.totalItems = this.lstSuppler.length > 0 ? this.lstSuppler[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach(msg => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  onSearch(event: any) {
    debugger
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.target.value;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllSuppliers(this.searchReq);

    }, 500);
  }

  // editUser(user: User) {
  //   // this.router.navigate(['users/edit', user.userId]);
  // }

  editSupplier(supplier: Supplier) {
    this.isEditMode = true;
    // populate the modal model with a copy of the supplier
    this.searchModelforCreate = Object.assign(new Supplier(), supplier);
    this.openModalAndTrapFocus();
  }

  private openModalAndTrapFocus() {
    // Save the currently focused element to restore focus later
    this.lastFocusedElement = document.activeElement as HTMLElement;
    
    // Open the modal
    this.showSupplierModal = true;
    
    // Add class to body to prevent background scrolling
    document.body.classList.add('modal-open');
    
    // Focus the first field after the view updates
    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  createSupplier(model:any){
    this.supplierService.createSupplier(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeSupplierModal();
        this.getAllSuppliers(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach(msg => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  deleteSupplier(supplier: Supplier) {
    debugger
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Supplier';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.supplierService.deleteSupplier(supplier.id).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(res.statusCode, res.result);
            this.getAllSuppliers(this.searchReq);
          } else {
            if (res.errorMessage.length > 0) {
              res.errorMessage.forEach(msg => {
                this.messagHelper.showMessage(res.statusCode, msg);
              });
            }
          }
        });
      }
    });
  }

  checkIsAdmin() {
    return AuthenticationService.getIsAdmin()
  }

  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllSuppliers(this.searchReq);
  }

  closeSupplierModal() {
    this.showSupplierModal = false;
    this.resetSupplierForm();
    
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
      this.closeSupplierModal();
      return;
    }
    
    // Trap focus within modal on Tab key
    if (event.key === 'Tab') {
      const modalElement = (event.target as HTMLElement).closest('.modal-container');
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

  saveSupplier() {
    if (this.isEditMode) {
      console.log('Updating supplier:', this.searchModelforCreate);
      this.messagHelper.showMessage(200, 'Supplier updated successfully');
    } else {
      console.log('Creating supplier:', this.searchModelforCreate);
      this.messagHelper.showMessage(200, 'Supplier created successfully');
    }
    this.closeSupplierModal();
  }

  resetSupplierForm() {
    this.searchModelforCreate = new Supplier();
    this.searchModelforCreate.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.searchModelforCreate.status = 1;
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
    } else if (event.key === 'Control') {
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
      this.onSearchForBottomSheet(this.searchReq);
      (this.searchReq as any)[result.field] = result.query;
      

    }
  });
}

  onSearchForBottomSheet(event: any){
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.name;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllSuppliers(this.searchReq);
    
    }, 100);
  }
  closeBottomSheet() {
    this.bottomSheet.dismiss();
  }


}
