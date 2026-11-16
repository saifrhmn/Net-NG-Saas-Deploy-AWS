import {
  Component,
  effect,
  HostListener,
  inject,
  OnInit,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- ADD THIS
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressHttp } from 'ngx-progressbar/http';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../../Services/auth.service';
import { PermissionService } from '../../../Services/permissions.service';
import { NavigationEnd } from '@angular/router';
@Component({
  selector: 'app-home-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgProgressbar,
    NgProgressHttp,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule,
    MatExpansionModule,
    MatTooltipModule,
    NgClass,
  ],
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.scss'],
})
export class HomeLayoutComponent implements OnInit {
  // toggleSidebar() {
  // throw new Error('Method not implemented.');
  // }

  @ViewChild('sidenav') sidenav!: MatSidenav;
  events!: WritableSignal<string>;
  // menuItems: any[] = [];
  isCollapsed = true;
  expandedPanel: string | null = null;
  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | any = {};
  isOpened: boolean = true;
  isExpanded: boolean = true;
  /** Viewport is phone/tablet sized - sidenav becomes an overlay drawer. */
  isMobile = false;
  static readonly mobileBreakpoint = 991;

  menuItems: any[] = [
    {
      icon: 'home',
      label: 'Dashboard',
      route: 'dashboard',
    },
    {
      icon: 'swap_vert',
      label: 'Order',
      route: 'order',
    },
    {
      icon: 'shopping_cart',
      label: 'Purchase',
      route: 'purchase',
    },
    {
      icon: 'receipt_long',
      label: 'Sales',
      route: 'salesOrder',
    },
    {
      icon: 'inventory',
      label: 'Stock Management',
      route: 'stock-management',
    },
    {
      icon: 'money_off_csred',
      label: 'Expense Information',
      route: 'expenseInformation',
    },
    {
      icon: 'diversity_3',
      label: 'Supplier',
      route: 'supplier',
    },
    {
      icon: 'badge',
      label: 'Customer',
      route: 'customer',
    },
    {
      icon: 'group',
      label: 'Users',
      route: 'users',
    },
    {
      icon: 'settings',
      label: 'Settings',
      route: 'settings',
    },
    {
      icon: 'widgets',
      label: 'Item',
      route: 'item',
    },
    {
      icon: 'assignment_turned_in',
      label: 'Assign Item',
      route: 'assign-item',
    },
    {
      icon: 'payment',
      label: 'Payment',
      route: 'payment',
    },
    // {
    //   icon: 'money',
    //   label: 'Purchase Details',
    //   route: 'purchase-details'
    // },

    {
      icon: 'assessment',
      label: 'Reports',
      route: 'reports',
      subMenu: [
        { 
          icon: 'inventory',
          label: 'Stock Report', 
          route: 'stock-report' 
        },
        
        {
          icon: 'inventory',
          label: 'Inventory Report',
          route: 'inventory-movement-report',
        },
        {
          icon: 'trending_up',
          label: 'Top Sold Items',
          route: 'top-sold-items-report',
        },
            {
          icon: 'trending_down',
          label: 'Slow Moving',
          route: 'slow-moving-report',
        },
        {
          icon: 'swap_horiz',
          label: 'Stock Transfer',
          route: 'stock-transfer-report',
        },
        { 
          icon: 'bar_chart', 
          label: 'Sales Report', 
          route: 'sales-report' 
        },
        {
          icon: 'shopping_cart',
          label: 'Sales Return',
          route: 'sales-return',
        },
        {
          icon: 'account_balance',
          label: 'Customer Receivable',
          route: 'customer-receivable-report',
        },
        {
          icon: 'receipt_long',
          label: 'Customer Statement',
          route: 'customer-statement-report',
        },

        {
          icon: 'attach_money',
          label: 'Purchase Report',
          route: 'purchase-report',
        },        
        // {
        //   icon: 'assignment_return',
        //   label: 'Purchase Return',
        //   route: 'purchase-return',
        // },

        {
          icon: 'business-outline',
          label: 'Supplier Payable',
          route: 'supplier-payble-report',
        },
        
        {
          icon: 'wallet-outline',
          label: 'Supplier Statement',
          route: 'supplier-statement-report',
        },
        
        {
          icon: 'monitoring',
          label: 'Profit/Loss',
          route: 'profit-loss-report',
        },
        {
          icon: 'receipt-outline',
          label: 'Payment Collection',
          route: 'payment-collection-report',
        },
        
        {
          icon: 'history',
          label: 'User Login History',
          route: 'user-login',
        },
      ],
    },
    {
      icon: 'logout',
      label: 'Logout',
      route: 'logout',
    },
  ];

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private permissionService: PermissionService,
  ) {
    this.events = this.authService.readEvents();
    this.checkLogin();
  }

  // ngOnInit(): void {
  //   this.checkScreenSize();
  // }

  ngOnInit(): void {
    this.checkScreenSize();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = (event.urlAfterRedirects || event.url || '')
          .toString()
          .toLowerCase();

        this.isCollapsed = this.isMobile ? false : true;
        this.expandedPanel = this.isMobile ? this.expandedPanel : null;

      }
    });

    // Initial sync in case NavigationEnd already fired before subscription
    const initialUrl = (this.router.url || '').toString().toLowerCase();
    const initialIsDashboard =
      initialUrl.includes('/dashboard') ||
      initialUrl === '/dashboard' ||
      initialUrl.endsWith('/dashboard');
  }
  checkLogin() {
    effect(() => {
      if (this.events() == AuthenticationService.authenticationSuccessEvent) {
        console.log(AuthenticationService.authenticatedUser);
        this.authenticatedUser = AuthenticationService.authenticatedUser;

        if (this.authenticatedUser?.roleId == 4) {
          this.menuItems = [
            {
              icon: 'home',
              label: 'Dashboard',
              route: 'dashboard',
            },
            {
              icon: 'swap_vert',
              label: 'Order',
              route: 'order',
            },
            {
              icon: 'shopping_cart',
              label: 'Purchase',
              route: 'purchase',
            },
            {
              icon: 'receipt_long',
              label: 'Sales',
              route: 'salesOrder',
            },
            {
              icon: 'inventory',
              label: 'Stock Management',
              route: 'stock-management',
            },

            {
              icon: 'logout',
              label: 'Logout',
              route: 'logout',
            },
          ];
        } else if (
          this.authenticatedUser?.isAdmin == 'true' &&
          this.authenticatedUser?.unique_name == 'SCM Admin Berger'
        ) {
          this.menuItems = [
            {
              icon: 'home',
              label: 'Dashboard',
              route: 'dashboard',
            },
            {
              icon: 'assessment',
              label: 'Reports',
              route: 'reports',
              subMenu: [
                {
                  icon: 'bar_chart',
                  label: 'Sales Report',
                  route: 'sales-report',
                },
                {
                  icon: 'attach_money',
                  label: 'Purchase Report',
                  route: 'purchase-report',
                },
                {
                  icon: 'inventory',
                  label: 'Inventory Report',
                  route: 'inventory-movement-report',
                },
                // {
                //   icon: 'inventory',
                //   label: 'Stock Report',
                //   route: 'stock-report',
                // },
                // { icon: 'shopping_cart',  label: 'Sales Return', route: 'sales-return' },
                // { icon: 'inventory_2',    label: 'Sales Invoice List ',    route: 'sales-invoice-list' },
              ],
            },
            {
              icon: 'logout',
              label: 'Logout',
              route: 'logout',
            },
          ];
        }
        // this.router.navigateByUrl(`/dashboard`);
        // this.onLogin();
      } else if (this.events() == AuthenticationService.logoutSuccessEvent) {
        console.log(AuthenticationService.getRole());

        this.menuItems = [];
      }
    });

    const token = localStorage.getItem('accessToken');
    if (token) {
      this.authService.authenticateUser(token);
      this.onLogin();
    } else {
      this.logout();
    }
  }

  onLogin() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    if (!this.authenticatedUser?.nameid) return;

    // Assign Item is for admins only; dealers never see it.
    if (!AuthenticationService.isAdminUser()) {
      this.menuItems = this.menuItems.filter((item) => item.route !== 'assign-item');
    }

    if (Number(this.authenticatedUser.roleId) === 3) {
      this.menuItems = this.menuItems.filter((item) => item.route !== 'users');
      const reports = this.menuItems.find(
      item => item.route === 'reports'
    );

    if (reports?.subMenu) {
      reports.subMenu = reports.subMenu.filter(
        (item: any) => item.route !== 'user-login'
      );
    }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const mobile =
      typeof window !== 'undefined' &&
      window.innerWidth <= HomeLayoutComponent.mobileBreakpoint;
    if (mobile === this.isMobile) return;

    this.isMobile = mobile;
    if (mobile) {
      // Drawer starts closed on small screens and shows full labels when opened.
      this.isCollapsed = false;
      this.sidenav?.close();
    } else {
      this.isCollapsed = true;
      this.expandedPanel = null;
      this.sidenav?.open();
    }
  }

  closeSidenavOnMobile() {
    if (this.isMobile) {
      this.sidenav?.close();
    }
  }
  //  toggleSidebar() {
  //   this.isCollapsed = !this.isCollapsed;
  // }

  // isExpandedPanel(route: string) {
  //   // Optionally keep a specific panel open based on route
  //   return false;
  // }

  isExpandedPanel(route: string): boolean {
    return this.expandedPanel === route;
  }
  //   isExpandedPanel(route: string): boolean {
  //   return this.expandedPanel === route;
  // }

  togglePanel(route: string) {
    this.expandedPanel = this.expandedPanel === route ? null : route;
  }
  toggleSidebar() {
    if (this.isMobile) {
      this.sidenav?.toggle();
      return;
    }
    this.isCollapsed = !this.isCollapsed;
  }

  // isExpanded(url: string) {
  //   return this.router.url.includes(url);
  // }
}
