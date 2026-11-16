import { Component, OnInit, OnDestroy, HostListener  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { BottomSheetComponent } from './Pages/bottom-sheet/bottom-sheet.component';
import { AuthGuard } from './Common/Auth/auth.guard';
import { FocusTrapDirective } from '../app/Common/Directives/focus-trap';
import { AuthenticationService } from './Services/auth.service';
import { TopScrollbarService } from './Common/Service/top-scrollbar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    FocusTrapDirective,
  ],
  providers: [
    AuthGuard,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Berger Karbar';
  timeout: any;
  idleTime = 60 * 60 * 1000;
  warningTimeout: any;

  constructor(
    private router: Router,
    private bottomSheet: MatBottomSheet,
    private authService: AuthenticationService,
    private topScrollbar: TopScrollbarService,
  ) {
    this.resetTimer();
  }

  ngOnInit() {
    this.setupGlobalKeyboardShortcuts();
    this.topScrollbar.start();
  }
  
  // @HostListener('window:mousemove')
  // @HostListener('window:keydown')
  // @HostListener('window:click')

  @HostListener('window:mousemove')
@HostListener('window:keydown')
@HostListener('window:click')
handleUserActivity() {
  this.resetTimer();
}

// resetTimer() {
//   clearTimeout(this.timeout);
//   this.timeout = setTimeout(() => {
//     this.logout();
//   }, this.idleTime);
// }
resetTimer() {
  clearTimeout(this.timeout);
  clearTimeout(this.warningTimeout); // add this line

  // Idle timer only matters while someone is logged in.
  if (!AuthenticationService.getAccessToken()) return;

  // Show warning 1 minute before logout
  this.warningTimeout = setTimeout(() => {
    alert('Session expiring soon!');
  // }, this.idleTime - 60000);
  }, this.idleTime - 60000);

  // Actual logout
  this.timeout = setTimeout(() => {
    this.logout();
  }, this.idleTime);
}
  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleGlobalKeyboard);
  }

  // Global Alt key handler to open bottom sheet for page navigation
  private handleGlobalKeyboard = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      event.preventDefault();
      this.openGlobalNavigationSheet();
    }
  };

  private setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', this.handleGlobalKeyboard);
  }

  //   resetTimer() {
  //   clearTimeout(this.timeout);
  //   this.timeout = setTimeout(() => {
  //     this.logout();
  //   }, this.idleTime);
  // }

  openGlobalNavigationSheet() {
    this.bottomSheet.open(BottomSheetComponent, {
      data: {
        isPageNavigation: true,
        label: 'Navigate to Page',
        placeholder: 'Type page name (e.g., purchase, order, users, dashboard)',
      },
    });
  }

// logout() {
//   localStorage.removeItem('karbar_token');
//   localStorage.removeItem('karbar_user');
//   sessionStorage.removeItem('karbar_session');

//   this.router.navigate(['/login']);
// }

logout() {
  // Deletes the access token + session data and navigates to /login.
  this.authService.logout();
}
// async logout() {
//   debugger
//     // Clear all local and session storage
//     localStorage.clear();
//     sessionStorage.clear();

//     // Delete all cookies
//     document.cookie.split(";").forEach((c) => {
//       document.cookie = c
//         .replace(/^ +/, "")
//         .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
//     });

//     // Clear browser cache using Cache API
//     if ('caches' in window) {
//       const cacheNames = await caches.keys();
//       await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
//     }

//     // Unregister service workers
//     if ('serviceWorker' in navigator) {
//       const registrations = await navigator.serviceWorker.getRegistrations();
//       await Promise.all(registrations.map(registration => registration.unregister()));
//     }

//     // Clear IndexedDB (if used)
//     if ('indexedDB' in window) {
//       const databases = await indexedDB.databases();
//       databases.forEach(db => {
//         if (db.name) {
//           indexedDB.deleteDatabase(db.name);
//         }
//       });
//     }

//     // Force reload to clear any in-memory state and navigate to login
//     window.location.href = '/login';
//   }
}