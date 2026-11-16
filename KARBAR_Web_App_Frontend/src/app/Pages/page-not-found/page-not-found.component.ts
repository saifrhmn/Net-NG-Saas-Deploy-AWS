import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../Services/auth.service';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [
    MatIconModule
  ],
  templateUrl: './page-not-found.component.html',
  styleUrl: './page-not-found.component.scss'
})
export class PageNotFoundComponent {

  constructor(
    private router: Router,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {

  }

  goHome() {
    this.router.navigate(['/']);
  }

  logout() {
    this.authService.logout();
  }
}
