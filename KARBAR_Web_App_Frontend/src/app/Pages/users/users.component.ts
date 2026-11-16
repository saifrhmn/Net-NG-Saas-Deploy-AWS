import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../Services/user.service';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { User } from '../../Model/user';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../../Common/Component/confirmation-dialog/confirmation-dialog.component';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../Services/auth.service';
import { RecordStatus } from '../../Common/Enum/appEnums';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { BottomSheetComponent } from '../../Pages/bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SettingsService } from '../../Services/settings.service';
import { Settings } from 'jspdf-autotable';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, AfterViewInit {
  @ViewChild('firstModalField') firstModalField!: ElementRef<HTMLElement>;
  lstUser: User[] = [];
  searchText: string = '';
  isAdmin: boolean = false;
  statusEnum = RecordStatus;
  searchReq: SearchRequest = new SearchRequest();
  totalItems: number = 0;
  timer: any;
  authenticatedUser: AuthenticatedUser | null = null;

  showUserModal: boolean = false;
  showPasswordModal: boolean = false;
  isEditMode: boolean = false;
  private lastFocusedElement: HTMLElement | null = null;
  user: User = new User();
  passwordResetModel: any = { userId: 0, newPassword: '', confirmPassword: '' };
  lstRole: any[] = [];

  constructor(
    private router: Router,
    private settingsService: SettingsService,
    private userService: UserService,
    private messagHelper: MessageHelperService,
    private dialog: MatDialog,
    private bottomSheet: MatBottomSheet
  ) {}

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    // this.user.tenantId = this.authenticatedUser?.tenantId;
    // this.searchReq.tenantId = Number(this.authenticatedUser?.tenantId);
    this.getAllUser();
    this.setupKeyboardShortcuts();
    this.getAllRole({ tenantId: this.authenticatedUser?.tenantId });
  }

  ngAfterViewInit() {
    // Lifecycle hook for view initialization
  }

  openCreateUser() {
    this.isEditMode = false;
    this.resetUserForm();
    this.openModalAndTrapFocus();
  }

onImageUpload(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('Invalid file type. Please upload an image.');
    return;
  }

  const reader = new FileReader();
reader.onload = () => {
  const result = reader.result as string;

  const pureBase64 = result.split(',')[1]; // remove prefix

  this.user.imageBase64 = pureBase64;
};

  reader.onerror = () => {
    console.error('Error reading file:', reader.error);
  };

  reader.readAsDataURL(file);
}
onSignatureImageUpload(event: any) {
  debugger
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    console.error('Invalid file type. Please upload an image.');
    return;
  }

  const reader = new FileReader();
reader.onload = () => {
  const result = reader.result as string;

  const pureBase64 = result.split(',')[1]; // remove prefix

  this.user.signatureImageBase64 = pureBase64;
};

  reader.onerror = () => {
    console.error('Error reading file:', reader.error);
  };

  reader.readAsDataURL(file);
}

  getAllUser() {
    if (
      this.authenticatedUser.roleId == 1 ||
      this.authenticatedUser.roleId == 2
    ) {
      this.searchReq.tenantId = 0;

      this.userService
        .fetchAllUser(this.searchReq)
        .subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            debugger
            this.lstUser = res.result;
            this.totalItems =
              this.lstUser.length > 0 ? this.lstUser[0].count : 0;
          } else {
            if (res.errorMessage.length > 0) {
              res.errorMessage.forEach((msg) => {
                this.messagHelper.showMessage(res.statusCode, msg);
              });
            }
          }
        });
    } else {
      this.userService
        .fetchAllUser(this.searchReq)
        .subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.lstUser = res.result;
            this.totalItems =
              this.lstUser.length > 0 ? this.lstUser[0].count : 0;
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

  onSearch(event: any) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.target.value;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllUser();
    }, 500);
  }

  editUser(user: User) {
    debugger;
    this.isEditMode = true;
    this.user = Object.assign(new User(), user);
    this.openModalAndTrapFocus();
  }

  openPasswordModal(user: User) {
    this.user = Object.assign(new User(), user);
    this.passwordResetModel = { 
      userId: user.id, 
      newPassword: '', 
      confirmPassword: '' 
    };
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.showPasswordModal = true;
    document.body.classList.add('modal-open');
  }
  private openModalAndTrapFocus() {
    // Save the currently focused element to restore focus later
    this.lastFocusedElement = document.activeElement as HTMLElement;

    // Open the modal
    this.showUserModal = true;

    // Add class to body to prevent background scrolling
    document.body.classList.add('modal-open');

    // Focus the first field after the view updates
    setTimeout(() => {
      if (this.firstModalField) {
        this.firstModalField.nativeElement.focus();
      }
    }, 100);
  }

  createUser(model: any) {
    debugger;
    this.user.parentTenantId = this.user.tenantId;

    
    
    // Fix: If imageBase64 is a URL (not actual Base64), set to empty string
    if (this.user.imageBase64 && (this.user.imageBase64.startsWith('http://') || this.user.imageBase64.startsWith('https://'))) {
      this.user.imageBase64 = '';
    }
    
    // Fix: If signatureImageBase64 is a URL (not actual Base64), set to empty string
    if (this.user.signatureImageBase64 && (this.user.signatureImageBase64.startsWith('http://') || this.user.signatureImageBase64.startsWith('https://'))) {
      this.user.signatureImageBase64 = '';
    }

    if(model.id == undefined){
      model.tenantId = 0;
    }
    // model.tenantId = 0;
    this.userService.createUser(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, res.result);
        this.closeUserModal();
        this.getAllUser();
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  deleteUser(user: User) {
    debugger;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
    });
    dialogRef.componentInstance.title = 'Delete User';
    dialogRef.componentInstance.message = 'Are you sure you want to delete?';

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userService.deleteUser(user.id).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(res.statusCode, res.result);
            this.getAllUser();
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
  checkIsAdmin() {
    return AuthenticationService.getIsAdmin();
  }

  onPageChange(event: any) {
    this.searchReq.pageSize = event.pageSize;
    this.searchReq.pageIndex = event.pageIndex + 1;
    this.getAllUser();
  }

  closeUserModal() {
    this.showUserModal = false;
    this.resetUserForm();

    // Remove class from body to restore background scrolling
    document.body.classList.remove('modal-open');

    // Restore focus to the element that opened the modal
    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
      }, 100);
    }
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.passwordResetModel = { userId: 0, newPassword: '', confirmPassword: '' };

    // Remove class from body to restore background scrolling
    document.body.classList.remove('modal-open');

    // Restore focus to the element that opened the modal
    if (this.lastFocusedElement) {
      setTimeout(() => {
        this.lastFocusedElement?.focus();
      }, 100);
    }
  }

  resetPassword() {
    debugger;
    if (this.passwordResetModel.newPassword !== this.passwordResetModel.confirmPassword) {
      this.messagHelper.showMessage(400, 'Passwords do not match');
      return;
    }

    this.userService.resetPassword(this.passwordResetModel).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.messagHelper.showMessage(res.statusCode, 'Password reset successfully');
        this.closePasswordModal();
        this.getAllUser();
      } else {
        if (res.errorMessage.length > 0) {
          res.errorMessage.forEach((msg) => {
            this.messagHelper.showMessage(res.statusCode, msg);
          });
        }
      }
    });
  }

  onModalKeydown(event: KeyboardEvent) {
    // Close modal on Escape key
    if (event.key === 'Escape') {
      this.closeUserModal();
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

  saveUser() {
    debugger
    if (this.isEditMode) {
      console.log('Updating User:', this.user);
      this.messagHelper.showMessage(200, 'User updated successfully');
    } else {
      console.log('Creating User:', this.user);
      this.messagHelper.showMessage(200, 'User created successfully');
    }
    this.closeUserModal();
  }

  resetUserForm() {
    this.user = new User();
    this.user.tenantId = this.authenticatedUser?.tenantId ?? 0;
    this.user.status = 1;
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
        field: 'name', // Settings model uses 'name' property
        placeholder: 'Search by Name...',
        label: 'Search',
        initialValue: '', // optional
      },
    });
    debugger;
    ref
      .afterDismissed()
      .subscribe((result: { field: string; query: string } | null) => {
        if (result && result.query !== undefined && result.field) {
          this.onSearchForBottomSheet(this.searchReq);
          (this.searchReq as any)[result.field] = result.query;
        }
      });
  }

  onSearchForBottomSheet(event: any) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.name;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllUser();
    }, 100);
  }
  closeBottomSheet() {
    this.bottomSheet.dismiss();
  }

  getAllRole(model: any) {
    this.settingsService.fetchAllRoles(model).subscribe((res: ApiResponse) => {
      if (res.isSuccess) {
        this.lstRole = res.result;
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
