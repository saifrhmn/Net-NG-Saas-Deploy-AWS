import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class BottomSheetService {
  constructor(private router: Router) {}

  openSearchSheet() {
    // Navigate to search page instead of opening a sheet
    this.router.navigate(['/search']);
  }
}
