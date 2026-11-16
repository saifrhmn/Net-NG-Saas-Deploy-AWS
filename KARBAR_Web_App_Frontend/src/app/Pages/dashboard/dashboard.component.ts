
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthenticatedUser, AuthenticationService } from '../../Services/auth.service';
import { Router } from '@angular/router';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { DashboardService } from '../../Services/dashboard.service';
import { MatDialog } from '@angular/material/dialog';
import { ApiResponse } from '../../Model/VM/apiResponse';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { Chart } from 'chart.js/auto';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // KPIs
  todaySale = 0;
  todayBergerPurchase = 0;
  todayNonBergerPurchase = 0;
  todayDue = 0;
  chart: any;

  // Lists
  payables: any[] = [];

  receivables: any[] = [];

  // Expense chart (weekly)
  expensesWeekly: any[] = [];
  maxExpense = 1;

  // Summary cards
  expenseSummary = { supplier: 0, customer: 0, others: 0 };
  todayTotalExpense = 0;
  last7DaysTotalExpense = 0;
  last30DaysTotalExpense = 0;

  // Selected expense period
  selectedExpensePeriod: 'today' | '7days' | '30days' = 'today';
  currentExpenseAmount = 0;

  // Low stock table
  lowStockItems: any[] = [];

  // User manual PDFs (built from docs/user-manual)
  readonly manualUrls = {
    en: 'assets/manual/Karbar-User-Manual-EN.pdf',
    bn: 'assets/manual/Karbar-User-Manual-BN.pdf',
  };

  // Animation state
  animatedBars = false;
  authService: AuthenticationService = inject(AuthenticationService);
  authenticatedUser: AuthenticatedUser | null = null; 
  data: any[] = [];
  searchReq: SearchRequest = new SearchRequest();



    constructor(
      private router: Router,
      private messagHelper: MessageHelperService,
      private dashboard: DashboardService,
      private dialog: MatDialog
    ) {}

  ngOnInit() {

    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;
    this.getAllDashboardData(this.searchReq);
    
    // Trigger bar animation after a short delay
    setTimeout(() => {
      this.animatedBars = true;
    }, 100);
  }

  getAllDashboardData(model: any) {
     this.dashboard.fetchAllDashboardData(model).subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.data = res.result;
            
            if (this.data && this.data.length > 0) {
              const dashboardData = this.data[0];
              
              // Map KPIs
              this.todaySale = dashboardData.todayTotalSales || 0;
              this.todayBergerPurchase = dashboardData.todayTotalBergerPurchases || 0;
              this.todayNonBergerPurchase = dashboardData.todayTotalNonBergerPurchases || 0;
              this.todayDue = dashboardData.todayDues || 0;
              setTimeout(() => this.createChart(), 100);
              // Map Receivables
              this.receivables = (dashboardData.listOfReceivables || []).map((item: any) => ({
                name: item.name,
                amount: item.totalAmount,
                month: '' // You can add month logic if needed
              }));
              
              // Map Low Stock Items
              this.lowStockItems = (dashboardData.lowStocks || []).map((item: any) => ({
                itemName: item.itemName,
                materialNo: item.materialNumber,
                warehouse: item.warehouse,
                currentStock: item.currentStock
              }));
              
              // Map Expenses
              if (dashboardData.listOfExpenses && dashboardData.listOfExpenses.length > 0) {
                const expenses = dashboardData.listOfExpenses[0];
                this.todayTotalExpense = expenses.todayTotalExpense || 0;
                this.last7DaysTotalExpense = expenses.last7DaysTotalExpense || 0;
                this.last30DaysTotalExpense = expenses.last30DaysTotalExpense || 0;
                
                // Update current expense based on selected period
                this.updateCurrentExpense();
              }
              
              // Update maxExpense based on all expense values
              this.maxExpense = Math.max(this.todayTotalExpense, this.last7DaysTotalExpense, this.last30DaysTotalExpense) || 1;
            }
    
            } else {
            if (res.errorMessage.length > 0) {
              res.errorMessage.forEach((msg) => {
                this.messagHelper.showMessage(res.statusCode, msg);
              });
            }
          }
        });
  }

  createChart() {

  if (this.chart) {
    this.chart.destroy();
  }

  this.chart = new Chart("salesChart", {
    type: "doughnut",
    data: {
      labels: [
        "Sales",
        "Berger Purchase",
        "Non Berger Purchase",
        "Customer Due"
      ],
      datasets: [{
        data: [
          this.todaySale,
          this.todayBergerPurchase,
          this.todayNonBergerPurchase,
          this.todayDue
        ],
        backgroundColor: [
          "#00C853",
          "#2196F3",
          "#FF9800",
          "#F44336"
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

}

  barHeight(amount: number): number {
    if (!this.animatedBars) return 0;
    return Math.round((amount / this.maxExpense) * 140);
  }

  format(n: number | undefined | null): string {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString('en-IN');
  }

  selectExpensePeriod(period: 'today' | '7days' | '30days'): void {
    this.selectedExpensePeriod = period;
    this.updateCurrentExpense();
  }

  updateCurrentExpense(): void {
    switch (this.selectedExpensePeriod) {
      case 'today':
        this.currentExpenseAmount = this.todayTotalExpense;
        break;
      case '7days':
        this.currentExpenseAmount = this.last7DaysTotalExpense;
        break;
      case '30days':
        this.currentExpenseAmount = this.last30DaysTotalExpense;
        break;
    }
  }

  getScatterPoints(): any[] {
    const chartHeight = 200;
    const maxValue = this.maxExpense || 1;
    
    const calculateY = (value: number): number => {
      if (maxValue === 0) return chartHeight - 10;
      const ratio = value / maxValue;
      return chartHeight - (ratio * (chartHeight - 20)) - 10;
    };
    
    const points = [
      {
        x: -80,
        y: calculateY(this.todayTotalExpense),
        amount: this.todayTotalExpense,
        label: 'Today',
        period: 'today',
        active: this.selectedExpensePeriod === 'today'
      },
      {
        x: 200,
        y: calculateY(this.last7DaysTotalExpense),
        amount: this.last7DaysTotalExpense,
        label: '7 Days',
        period: '7days',
        active: this.selectedExpensePeriod === '7days'
      },
      {
        x: 300,
        y: calculateY(this.last30DaysTotalExpense),
        amount: this.last30DaysTotalExpense,
        label: '30 Days',
        period: '30days',
        active: this.selectedExpensePeriod === '30days'
      }
    ];
    return points;
  }

  getLinePath(): string {
    const points = this.getScatterPoints();
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    return path;
  }

  getAreaPath(): string {
    const points = this.getScatterPoints();
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x},200`;
    path += ` L ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x},${points[i].y}`;
    }
    path += ` L ${points[points.length - 1].x},200 Z`;
    return path;
  }
}