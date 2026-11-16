import { Routes } from '@angular/router';
// import { AuthGuard } from './Common/Auth/auth.guard';
import { LoginLayoutComponent } from './Common/Layout/login-layout.component';
import { HomeLayoutComponent } from './Common/Layout/home-layout/home-layout.component';
import { AuthGuard, PermissionGuard } from './Common/Auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '',
    component: LoginLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./Pages/login/login.component').then(m => m.LoginComponent) },
      {
        path: '',
        canActivate: [AuthGuard],
        component: HomeLayoutComponent,
        children: [
          {
            path: 'dashboard',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
          },
          {
            path: 'purchase',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/purchase/purchase.component').then((m) => m.PurchaseComponent),
          },
          {
            path: 'salesOrder',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/sales-order/sales-order.component').then((m) => m.SalesOrderComponent),
          },
          {
            path: 'order',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/order/order.component').then((m) => m.OrderComponent),
          },
          {
            path: 'expenseInformation',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/expense-information/expense-information.component').then((m) => m.ExpenseInformationComponent),
          },
          {
            path: 'supplier',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/supplier/supplier.component').then((m) => m.SupplierComponent),
          },
          {
            path: 'customer',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/customer/customer.component').then((m) => m.CustomerComponent),
          },
          {
            path: 'users',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/users/users.component').then((m) => m.UsersComponent),
          },
          {
            path: 'settings',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/settings/settings.component').then((m) => m.SettingsComponent),
          },
          {
            path: 'payment',
            // canActivate: [PermissionGuard],
            loadComponent: () => import('./Pages/payment/payment.component').then((m) => m.PaymentComponent),
          },
          {
            path: 'item',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/item/item.component').then((m) => m.ItemComponent),
          },
          {
            path: 'stock-management',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/stock/stock.component').then((m) => m.StockComponent),
          },
          {
            path: 'assign-item',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/assign-item/assign-item.component').then((m) => m.AssignItemComponent),
          },
          {
            path: 'purchase-details',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/purchase-details/purchase-details.component').then((m) => m.PurchaseDetailsComponent),
          },
          {
            path: 'purchase-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/purchase-report/purchase-report.component').then((m) => m.PurchaseReportComponent),
          },
          {
            path: 'sales-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/sales-report/sales-report.component').then((m) => m.SalesReportComponent),
          },
          {
            path: 'inventory-movement-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/inventory-movement-report/inventory-movement-report.component').then((m) => m.InventoryMovementReportComponent),
          },
          {
            path: 'payment-collection-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/payment-collection/payment-collection.component').then((m) => m.PaymentCollectionComponent),
          },
          {
            path: 'sales-return',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/sales-return/sales-return.component').then((m) => m.SalesReturnComponent),
          },
          {
            path: 'stock-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/all-product-stock-report/all-product-stock-report.component').then((m) => m.AllProductStockReportComponent),
          },
          {
            path: 'supplier-payble-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/supplier-payble-report/supplier-payble-report.component').then((m) => m.SupplierPaybleReportComponent),
          },
          {
            path: 'supplier-statement-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/supplier-statement-report/supplier-statement-report.component').then((m) => m.SupplierStatementReportComponent),
          },
          {
            path: 'top-sold-items-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/top-item-sold/top-item-sold.component').then((m) => m.TopItemSoldComponent),
          },
          {
            path: 'customer-receivable-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/customer-receivable-report/customer-receivable-report.component').then((m) => m.CustomerReceivableReportComponent),
          },
          {
            path: 'profit-loss-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/profit-loss/profit-loss.component').then((m) => m.ProfitLossComponent),
          },
          {
            path: 'stock-transfer-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/stock-transfer-report/stock-transfer-report.component').then((m) => m.StockTransferReportComponent),
          },
          {
            path: 'customer-statement-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/customer-statement-report/customer-statement-report.component').then((m) => m.CustomerStatementReportComponent),
          },
          {
            path: 'slow-moving-report',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/slow-moving-report/slow-moving-report.component').then((m) => m.SlowMovingReportComponent),
          },
          {
            path: 'user-login',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/user-login/user-login.component').then((m) => m.UserLoginComponent),
          },
          
          {
            path: 'purchase-return',
            // canActivate: [PermissionGuard],
            loadComponent: () =>
              import('./Pages/Reports/purchase-return/purchase-return.component').then((m) => m.PurchaseReturnComponent),
          },
          
       
        ]
      },
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./Pages/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent)
  },
  { path: "**", redirectTo: "unauthorized" },
];
