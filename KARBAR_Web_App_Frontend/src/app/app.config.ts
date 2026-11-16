import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { CustomToastComponent } from './Common/Layout/custom-toast/custom-toast.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { progressInterceptor } from 'ngx-progressbar/http';
import { routes } from './app.routes';
import { HttpClientInterceptor } from './Common/Interceptors/http-client.interceptor';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { DEFAULT_TIMEOUT, TimeoutInterceptor } from './Common/Interceptors/timeout-interceptor.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideToastr({
      toastComponent: CustomToastComponent,
      closeButton: true,
      positionClass: 'toast-top-right',
      newestOnTop: false,
      timeOut: 6000,
      extendedTimeOut: 3000,
      easeTime: 300,
    }),
    provideHttpClient(withInterceptors([
      progressInterceptor, HttpClientInterceptor, TimeoutInterceptor
    ])),
     { provide: DEFAULT_TIMEOUT, useValue: 32000 },
    importProvidersFrom(MatBottomSheetModule), 
  ]
};
