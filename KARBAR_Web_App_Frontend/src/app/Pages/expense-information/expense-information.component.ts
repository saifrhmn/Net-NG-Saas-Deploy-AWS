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
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from '@angular/material/input';
import {BottomSheetComponent} from '../../Pages/bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ExpenseService } from '../../Services/expense';
import { Expense } from '../../Model/expense';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { exportToExcel } from '../../Common/Utils/utils';

@Component({
  selector: 'app-expense-information',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatOptionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatBadgeModule, // if using matBadge
    MatChipsModule,
  ],
  templateUrl: './expense-information.component.html',
  styleUrl: './expense-information.component.scss'
})

export class ExpenseInformationComponent  {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;

  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | null = null; // don't initialize from this.authService here
  // lstExpense: any[] = [];
  lstExpense: Expense[] = [];
  lstExpenseCategories: any[] = [];
  searchText: string = '';
  isAdmin: boolean = false;
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  expense: Expense = new Expense();
  totalItems: number = 0;
  timer: any;
  showExpenseModal: boolean = false;
  isEditMode: boolean = false;
  Search: Expense = new Expense();
  private lastFocusedElement: HTMLElement | null = null;
  today: Date = new Date();
  showCategoryModal = false;
  isDownloading = false;


newCategory: { id?: string; name?: string } = { name: '' };
  hasParent: boolean = false;
  
  expenseCategoryModel: {
    name: string;
    expenseCategoryId: string | '';
    tenantId: number | 0;
    parentId: string | '';
    status: number;
  } = { name: '',expenseCategoryId: '', tenantId: 0, parentId: '', status: 1 };

  constructor(
    private router: Router,
    private expenseService: ExpenseService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit() {
    this.Search.entryDate = this.today;
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.Search.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);
    this.getAllExpense(this.searchReq);
    this.getAllExpenseCategory(this.searchReq);
    this.setupKeyboardShortcuts();
    console.log(this.authenticatedUser.tenantId);
  }

  ngAfterViewInit() {
    // Lifecycle hook for view initialization
  }

  openCreateExpense() {
    this.isEditMode = false;
    this.resetExpenseForm();
    this.openModalAndTrapFocus();
  }

onParentChange(parentId: number) {
  debugger
  console.log('Selected parent id:', parentId);

  this.expenseCategoryModel.parentId = parentId.toString();

}

  getAllExpense(model:any) {
    this.expenseService.fetchAllExpenses(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstExpense = res.result;
        // this.totalItems = this.lstExpense.length > 0 ? this.lstExpense[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach(msg => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }
  /** Downloads every expense matching the current search (all pages) as Excel, like the reports. */
  onExportAllExcel() {
    if (this.isDownloading) return;
    this.isDownloading = true;
    const date = new DatePipe('en-US');

    this.expenseService
      .fetchAllExpenses({ ...this.searchReq, pageIndex: 1, pageSize: 100000 })
      .subscribe({
        next: (res: ApiResponse) => {
          const data: any[] = res?.result || [];
          if (!data.length) {
            this.messagHelper.showMessage(400, 'No data found to export');
            this.isDownloading = false;
            return;
          }

          const rows = data.map((e: any) => ({
            EntryDate: date.transform(e.entryDate, 'dd-MM-yyyy') ?? '',
            ExpenseDate: date.transform(e.expenseDate, 'dd-MM-yyyy') ?? '',
            Category: e.categoryName ?? '',
            SubCategory: e.subCategoryName ?? '',
            Amount: Number(e.expenseAmount ?? 0),
            Purpose: e.expensePurpose ?? '',
          }));

          exportToExcel(rows, 'Expense Information.xlsx');
          this.messagHelper.showMessage(200, 'Export completed');
          this.isDownloading = false;
        },
        error: () => {
          this.messagHelper.showMessage(500, 'Failed to fetch data');
          this.isDownloading = false;
        },
      });
  }

  getAllExpenseCategory(model:any) {
    this.expenseService.fetchAllExpensesCategory(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstExpenseCategories = res.result;
        // this.totalItems = this.lstExpense.length > 0 ? this.lstExpense[0].totalCount : 0;
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach(msg => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }
  createExpenseCategory(model:any) {
    this.expenseCategoryModel.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.expenseService.createNewExpenseCategory(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {

        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeCategoryModal();
        this.getAllExpenseCategory(this.searchReq);
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

      this.getAllExpense(this.searchReq);

    }, 500);
  }

  // editUser(user: User) {
  //   // this.router.navigate(['users/edit', user.userId]);
  // }

  editExpense(supplier: Expense) {
    this.isEditMode = true;
    // populate the modal model with a copy of the supplier
    this.Search = Object.assign(new Expense(), supplier);
    this.openModalAndTrapFocus();
  }

  private openModalAndTrapFocus() {
    // Save the currently focused element to restore focus later
    this.lastFocusedElement = document.activeElement as HTMLElement;
    
    // Open the modal
    this.showExpenseModal = true;
    
    // Add class to body to prevent background scrolling
    document.body.classList.add('modal-open');
    
    // Focus the first field after the view updates
    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  createExpense(model:any){
    debugger
    this.Search.entryDate = this.today;
    this.expenseService.createExpense(model).subscribe((res: ApiResponse) => {
      debugger
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeExpenseModal();
        this.getAllExpense(this.searchReq);
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach(msg => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }
getSelectedCategoryName(id: any): string {
  const cat = (this.lstExpenseCategories || []).find(c => c.id === id);
  return cat ? cat.name : '';
}
  openCategoryModal() {
  this.newCategory = { name: '' };
  this.showCategoryModal = true;
}
closeCategoryModal() {
  this.showCategoryModal = false;
}

// create handler (replace with API call if desired)
createCategory(category: any) {
  const name = (category?.name || '').toString().trim();
  if (!name) {
    this.messagHelper.showMessage(400, 'Category name is required.');
    return;
  }
  this.createExpenseCategory(category);
  // // If you have an API/service, call it here. For quick local behavior:
  // // e.g. push to a local list if you later change the select to use *ngFor
  // this.lstExpenseCategories = this.lstExpenseCategories || [];
  // const created = { id: Date.now(), name };
  // this.lstExpenseCategories.push(created);

  this.messagHelper.showMessage(200, 'Category created.');

  this.closeCategoryModal();
}

  deleteExpense(expense: Expense) {
    debugger
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete Expense';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.expenseService.deleteExpense(expense.id).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(res.statusCode, res.result);
            this.getAllExpense(this.searchReq);
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
    this.getAllExpense(this.searchReq);
  }

  closeExpenseModal() {
    this.showExpenseModal = false;
    this.resetExpenseForm();
    
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
      this.closeExpenseModal();
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
      console.log('Updating supplier:', this.Search);
      this.messagHelper.showMessage(200, 'Expense updated successfully');
    } else {
      console.log('Creating supplier:', this.Search);
      this.messagHelper.showMessage(200, 'Expense created successfully');
    }
    this.closeExpenseModal();
  }

  resetExpenseForm() {
    this.Search = new Expense();
    this.Search.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.Search.status = 1;
  }

    showBottomSheet() {
    this.bottomSheet.open(BottomSheetComponent);
  }

  private handleKeyboard = (event: KeyboardEvent) => {
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

      this.getAllExpense(this.searchReq);
    
    }, 100);
  }
  closeBottomSheet() {
    this.bottomSheet.dismiss();
  }


}