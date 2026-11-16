import { Injectable } from '@angular/core';
import { GlobalConfig } from 'rxjs';
import * as appEnums from '../Enum/appEnums'
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class MessageHelperService {

  private options: GlobalConfig | undefined;

  constructor(
    private toastr: ToastrService
  ) { }

  showMessage(code: number, message: string) {
    if (code === appEnums.ResponseStatus.success) {
      this.toastr.success(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-success"
      });
    }
    else if (code === appEnums.ResponseStatus.warning) {
      this.toastr.warning(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-warning"
      });
    }
    else if (code === appEnums.ResponseStatus.info) {
      this.toastr.info(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-info"
      });
    }
    else if (code === appEnums.ResponseStatus.fail) {
      this.toastr.error(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-error"
      });
    }
    else if (code === appEnums.ResponseStatus.clientError) {
      this.toastr.error(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-error"
      });
    }
    else if (code === appEnums.ResponseStatus.internalServerError) {
      this.toastr.error(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-error"
      });
    }
    else if (code === appEnums.ResponseStatus.unAuthorize) {
      this.toastr.error(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-error"
      });
    }
    else if (code === null) {
      this.toastr.error(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-error"
      });
    }
    else {
      this.toastr.error(message, '', {
        // disableTimeOut: true,
        // tapToDismiss: false,
        toastClass: "toast-icon custom-toast-error"
      });
    }
  }
}
