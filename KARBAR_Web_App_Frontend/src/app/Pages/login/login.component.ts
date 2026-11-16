import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginRequest } from '../../Model/DTO/loginRequest';
import { AuthenticationService } from '../../Services/auth.service';
import { Router } from '@angular/router';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { MatIconModule } from '@angular/material/icon';
import { PermissionService } from '../../Services/permissions.service';
import { UserService } from '../../Services/user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginRequest: LoginRequest = new LoginRequest();
  togglePassword: boolean = false;
  checked: boolean = null;
  isLoading: boolean = false;

  showForgetPasswordModal: boolean = false;
  isResettingPassword: boolean = false;
  toggleNewPassword: boolean = false;
  toggleConfirmPassword: boolean = false;
  forgetPasswordModel: any = { phoneNumber: '', newPassword: '', confirmPassword: '', rawPassword: '' };

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private messageHelper: MessageHelperService,
    private permissionService: PermissionService,
    private userService: UserService
  ) { }

  ngOnInit() {
  }



  onSubmit() {
 this.isLoading = true;
  this.authService.login(this.loginRequest).subscribe({
    next: (res: ApiResponse) => {
      this.isLoading = false;
      if (res.isSuccess) {
        this.checked = true;
        const token = (res.result && (res.result.accessToken ?? (res.result[0] && res.result[0].accessToken))) || null;
        if (token) {
          this.authService.authenticateUser(token);
          this.router.navigateByUrl('/dashboard');
        }
      } else {
        this.checked = false;
         this.isLoading = false;
        this.messageHelper.showMessage(res.statusCode, 'Login Failed');
      }
    },
    error: (err) => {
      console.error('Login error', err);
      this.checked = false;
      this.isLoading = false;
      this.messageHelper.showMessage(0, 'Login Failed');
    }
  });
}

  openForgetPasswordModal() {
    this.forgetPasswordModel = { phoneNumber: '', newPassword: '', confirmPassword: '', rawPassword: '' };
    this.showForgetPasswordModal = true;
  }

  closeForgetPasswordModal() {
    this.showForgetPasswordModal = false;
    this.forgetPasswordModel = { phoneNumber: '', newPassword: '', confirmPassword: '', rawPassword: '' };
  }

  submitForgetPassword() {
    if (this.forgetPasswordModel.newPassword !== this.forgetPasswordModel.confirmPassword) {
      this.messageHelper.showMessage(400, 'Passwords do not match');
      return;
    }

    this.forgetPasswordModel.rawPassword = this.forgetPasswordModel.newPassword;

    this.isResettingPassword = true;
    this.userService.resetPassword(this.forgetPasswordModel).subscribe({
      next: (res: ApiResponse) => {
        this.isResettingPassword = false;
        if (res.isSuccess) {
          this.messageHelper.showMessage(res.statusCode, 'Password reset successfully');
          this.closeForgetPasswordModal();
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messageHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      },
      error: (err) => {
        console.error('Reset password error', err);
        this.isResettingPassword = false;
        this.messageHelper.showMessage(0, 'Failed to reset password');
      }
    });
  }

}
