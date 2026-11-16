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
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatOption } from "@angular/material/core";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatSelect } from "@angular/material/select";
import { Customer } from '../../Model/customer';
import { CustomerService } from '../../Services/customer.service';
import { RecordStatus } from '../../Common/Enum/appEnums';
import {BottomSheetComponent} from '../../Pages/bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-customer',
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
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})

export class CustomerComponent implements AfterViewInit {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;

  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | null = null; // don't initialize from this.authService here
  lstCustomer: Customer[] = [];
  searchText: string = '';
  isAdmin: boolean = false;
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  customer: Customer = new Customer();
  totalItems: number = 0;
  timer: any;
  showCustomerModal: boolean = false;
  isEditMode: boolean = false;
  // model used for create / edit modal
  searchModelforCreate: Customer = new Customer();
  private lastFocusedElement: HTMLElement | null = null;

  constructor(
    private router: Router,
    private customerService: CustomerService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchModelforCreate.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);

    this.getAllCustomers(this.searchReq);
    this.setupKeyboardShortcuts();
  }

  ngAfterViewInit() {
    // Lifecycle hook for view initialization
  }

  openCreateCustomer() {
    this.isEditMode = false;
    this.resetCustomerForm();
    this.openModalAndTrapFocus();
  }

  getAllCustomers(model:any) {
    this.customerService.fetchAllCustomers(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstCustomer = res.result;
        this.totalItems = this.lstCustomer.length > 0 ? this.lstCustomer[0].totalCount : 0;
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

      this.getAllCustomers(this.searchReq);

    }, 500);
  }

  editCustomer(customer: Customer) {
    this.isEditMode = true;
    this.searchModelforCreate = Object.assign(new Customer(), customer);
    this.openModalAndTrapFocus();
  }

  private openModalAndTrapFocus() {
    this.lastFocusedElement = document.activeElement as HTMLElement;
    
    this.showCustomerModal = true;
    
    document.body.classList.add('modal-open');
    
    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  createCustomer(model:any){
    this.customerService.createCustomer(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeCustomerModal();
        this.getAllCustomers(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach(msg => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  deleteCustomer(customer: Customer) {
    debugger
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Customer';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.deleteCustomer(customer.id).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(res.statusCode, res.result);
            this.getAllCustomers(this.searchReq);
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
    this.getAllCustomers(this.searchReq);
  }

  closeCustomerModal() {
    this.showCustomerModal = false;
    this.resetCustomerForm();

    document.body.classList.remove('modal-open');
    
    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
      }, 100);
    }
  }

  onModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeCustomerModal();
      return;
    }
    
    if (event.key === 'Tab') {
      const modalElement = (event.target as HTMLElement).closest('.modal-container');
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
      }
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  saveCustomer() {
    if (this.isEditMode) {
      console.log('Updating Customer:', this.searchModelforCreate);
      this.messagHelper.showMessage(200, 'Supplier updated successfully');
    } else {
      console.log('Creating Customer:', this.searchModelforCreate);
      this.messagHelper.showMessage(200, 'Customer created successfully');
    }
    this.closeCustomerModal();
  }

  resetCustomerForm() {
    this.searchModelforCreate = new Customer();
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

      this.getAllCustomers(this.searchReq);
    
    }, 100);
  }
  closeBottomSheet() {
    this.bottomSheet.dismiss();
  }
}
