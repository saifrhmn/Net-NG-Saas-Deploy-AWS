import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [
    MatIcon,
    FormsModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './bottom-sheet.component.html',
  styleUrl: './bottom-sheet.component.scss'
})
export class BottomSheetComponent implements AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  query: string = '';

  // Available pages and their routes
  private pageMap: { [key: string]: string } = {
    'purchase': '/purchase',
    'purchase details': '/purchase-details',
    'purchase-details': '/purchase-details',
    'order': '/order',
    'sales order': '/salesOrder',
    'sales-order': '/salesOrder',
    'salesorder': '/salesOrder',
    'users': '/users',
    'user': '/users',
    'dashboard': '/dashboard',
    'settings': '/settings',
    'supplier': '/supplier',
    'suppliers': '/supplier',
    'customer': '/customer',
    'customers': '/customer',
    'item': '/item',
    'items': '/item',
    'expense': '/expenseInformation',
    'expense information': '/expenseInformation',
    'payment': '/payment',
    'stock': '/stock-management',
    'stock management': '/stock-management',
    'warehouse transfer': '/warehouse-transfer',
    'warehouse-transfer': '/warehouse-transfer',
    'reports': '/Reports',
    'purchase report': '/purchase-report',
    'sales invoice': '/sales-invoice-list',
    'search': '/search',
    'find': '/search',
  };

  // data: { field: string, placeholder?: string, label?: string, routeMap?: any }
  constructor(
    private bottomSheetRef: MatBottomSheetRef<BottomSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private router: Router
  ) {
    this.query = this.data?.initialValue || '';
  }

  ngAfterViewInit() {
    // Auto-focus the search input after view is ready
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 100);
  }

  // called on input keyup (enter will also apply)
  onKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.apply();
    }
  }

  apply() {
    const q = (this.query || '').toString().trim();
    if (!q) {
      this.bottomSheetRef.dismiss(null);
      return;
    }

    // Check if this is a page navigation request (data has field but no specific search handler)
    const isPageNavigation = this.data?.field === undefined || this.data?.isPageNavigation;
    
    if (isPageNavigation) {
      // Navigation mode: find best matching page using fuzzy matching
      const target = this.findBestMatchRoute(q);
      
      if (target) {
        this.router.navigateByUrl(target).then(
          () => this.bottomSheetRef.dismiss({ field: this.data?.field, query: this.query }),
          () => this.bottomSheetRef.dismiss({ field: this.data?.field, query: this.query })
        );
      } else {
        // No match found, still close the sheet
        this.bottomSheetRef.dismiss({ field: this.data?.field, query: this.query });
      }
    } else {
      // Search mode: return field and query for component to handle
      this.bottomSheetRef.dismiss({ field: this.data?.field, query: this.query });
    }
  }

  // Fuzzy matching: find the best matching route for user input
  private findBestMatchRoute(input: string): string | null {
    const q = input.toLowerCase().trim();
    
    // Custom route map from data takes priority
    if (this.data?.routeMap && this.data.routeMap[q]) {
      return this.data.routeMap[q];
    }

    // Exact match in pageMap
    if (this.pageMap[q]) {
      return this.pageMap[q];
    }

    // Fuzzy match: find the best match using Levenshtein distance or simple substring scoring
    let bestMatch: { key: string; route: string; score: number } | null = null;

    for (const [key, route] of Object.entries(this.pageMap)) {
      const score = this.calculateSimilarity(q, key);
      if (score > 0.6) { // threshold: 60% similarity
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { key, route, score };
        }
      }
    }

    return bestMatch ? bestMatch.route : null;
  }

  // Calculate similarity between two strings (0-1 scale)
  // Uses a combination of Levenshtein distance and substring matching
  private calculateSimilarity(input: string, target: string): number {
    // Exact match
    if (input === target) return 1.0;

    // Substring match (input is contained in target or vice versa)
    if (target.includes(input) || input.includes(target)) {
      return 0.9;
    }

    // Starts with match
    if (target.startsWith(input)) {
      return 0.8;
    }

    // Levenshtein distance based similarity
    const distance = this.levenshteinDistance(input, target);
    const maxLen = Math.max(input.length, target.length);
    return 1 - distance / maxLen;
  }

  // Calculate Levenshtein distance between two strings
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  close() {
    this.bottomSheetRef.dismiss(null);
  }
}
