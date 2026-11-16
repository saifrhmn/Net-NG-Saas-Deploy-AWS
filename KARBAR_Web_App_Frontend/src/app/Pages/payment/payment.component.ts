import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { OrderService } from '../../Services/order.service';
import { Payment } from '../../Model/payment';
import { SalesOrderService } from '../../Services/salesOrderService';
import { ApiResponse } from '../../Model/VM/apiResponse';
import {
  AuthenticatedUser,
  AuthenticationService,
} from '../../Services/auth.service';
import { SearchRequest } from '../../Model/DTO/searchRequest';
import { CustomerService } from '../../Services/customer.service';
import { MessageHelperService } from '../../Common/Helper/message-helper.service';
import { PaymentService } from '../../Services/payment.service';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { SupplierService } from '../../Services/supplier.service';
import { PurchaseService } from '../../Services/purchase.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,  
    MatPaginatorModule
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss',
})
export class PaymentComponent {
  selectedType: number = 1; // Default to User
  payment: Payment = new Payment();

  paymentTypes = [
    { value: 1, label: 'Customer' },
    { value: 2, label: 'Supplier' },
  ];
  lstPayment: any[] = [];
  lstCustomer: any[] = [];
  lstSupplier: any[] = [];
  lstPurchase: any[] = [];
  authenticatedUser: AuthenticatedUser | null = null;
  searchText: string = '';
  searchReq: SearchRequest = new SearchRequest();
  timer: any;
  checkdue: boolean = false;
  totalItems: number = 0;
  // Customer search properties
  customerSearch: string = '';
  filteredResults: any[] = []; // Combined search results (orders + customers)
  showSearchDropdown: boolean = false;
  selectedCustomer: any = null;
  customerTotalDue: number = 0;
  totalDueRequestId: number = 0; // ignores out-of-order total due responses
  totalDueTimer: any;
  isTotalDueLoading: boolean = false;
  customerSearchTimeout: any;
  allPayments: any[] = []; // Store all payments for filtering

  // Payment details modal
  showPaymentModal: boolean = false;
  selectedPayment: any = null;
  backspaceDueAmount: number = 0;
  currentDiscountAmount: number = 0;

  isdisable: boolean = false;
  showPrintButton: boolean = false;
  lastSubmittedPayment: any = null;

  constructor(
    private salesOrderService: SalesOrderService,
    private customerService: CustomerService,
    private supplierService: SupplierService,
    private paymentService: PaymentService,
    private purchaseService: PurchaseService,
    private messagHelper: MessageHelperService,
    private bottomSheet: MatBottomSheet,
    private toastr: ToastrService,
    
  ) {}

  ngOnInit() {
    this.authenticatedUser = AuthenticationService.authenticatedUser;
    this.payment.tenantId = this.authenticatedUser?.tenantId;
    this.searchReq.tenantId = this.authenticatedUser?.tenantId;
    this.getAllPaymentList(this.searchReq);
    this.getAllCustomer({ tenantId: this.authenticatedUser?.tenantId });
    this.getCustomerTotalDue();
  }

  getAllPaymentList(filter: any) {
    filter.tenantId = this.authenticatedUser?.tenantId;
    filter.userType = this.selectedType;
    filter.pageIndex = Number(filter.pageIndex || this.searchReq.pageIndex || 1);
    filter.pageSize = Number(filter.pageSize || this.searchReq.pageSize || 10);

    this.paymentService
      .fetchAllOrder(filter)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstPayment = res.result;
          this.allPayments = res.result; // Store all payments
          this.totalItems = Number(
            res.totalCount ?? this.lstPayment[0]?.totalCount ?? this.lstPayment.length
          );
          this.searchReq.pageIndex = Number(filter.pageIndex || 1);
          this.searchReq.pageSize = Number(filter.pageSize || 10);
        } else {
          this.lstPayment = [];
          this.allPayments = [];
          this.totalItems = 0;
        }
      });
  }

onPageChange(event: any) {
  this.searchReq.pageSize = event.pageSize;
  this.searchReq.pageIndex = event.pageIndex + 1;
  this.getAllPaymentList(this.searchReq);
}

  onTypeChange(event: any) {
  this.payment.userType = event.value;
  this.searchReq.userType = event.value;
  this.searchReq.pageIndex = 1;
  this.getAllPaymentList(this.searchReq);
  
  // Load appropriate list based on type
  if (event.value === 1) {
    this.getAllCustomer({ tenantId: this.authenticatedUser?.tenantId });
  } else if (event.value === 2) {
    this.getAllSupplier({ tenantId: this.authenticatedUser?.tenantId });
  }
  
  // Clear selection when switching types
  this.clearSelection();
}
  getTotalQuantity(row: any): number {

    if (!row.salesOrderDetails || row.salesOrderDetails.length === 0) {
      return 0;
    }
    return row.salesOrderDetails.reduce((total: number, detail: any) => {
      return total + (Number(detail.quantity) || 0);
    }, 0);
  }
  getAllCustomer(model: any) {
    this.customerService
      .fetchAllCustomers(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstCustomer = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }
  getAllSupplier(model: any) {
    this.supplierService
      .fetchAllSuppliers(model)
      .subscribe((res: ApiResponse) => {
        if (res.isSuccess) {
          this.lstSupplier = res.result;
        } else {
          if (res.errorMessage.length > 0) {
            res.errorMessage.forEach((msg) => {
              this.messagHelper.showMessage(res.statusCode, msg);
            });
          }
        }
      });
  }
  onSearch(event: any) {

    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      var str = event.target.value;

      this.searchReq.searchText = str;
      this.searchReq.pageIndex = 1;

      this.getAllPaymentList(this.searchReq);
    }, 500);
  }


onSearchChange() {
  const q = (this.customerSearch || '').toLowerCase().trim();
  debugger
  this.searchReq.searchText = this.customerSearch;
  this.getAllPaymentList(this.searchReq);

  if (!q) {

    this.filteredResults = [];
    this.showSearchDropdown = false;
    this.lstPayment = this.allPayments;
    this.selectedCustomer = null;
    this.getCustomerTotalDue();
    return;
  }

  clearTimeout(this.totalDueTimer);
  this.totalDueTimer = setTimeout(() => this.getCustomerTotalDue(), 400);

  debugger
  const orderMatches = (this.allPayments || []).filter((order: any) => {
    const invoiceNo = (order.orderInvoiceNo ?? order.invoiceNo ?? '').toString().toLowerCase();
    const customerName = (order.customerName ?? order.supplierName ?? '').toString().toLowerCase();
    const customerPhone = (order.customerPhone ?? order.supplierPhone ?? '').toString().toLowerCase();

    return (
      invoiceNo.includes(q) ||
      customerName.includes(q) ||
      customerPhone.includes(q)
    );
  });

  // Map userId -> customer/supplier from lstCustomer/lstSupplier based on selectedType
  const userList = this.selectedType === 1 ? this.lstCustomer : this.lstSupplier;
  
  this.filteredResults = orderMatches.map((order: any) => {
    const userId = order.customerId ?? order.supplierId ?? order.userId ?? order.userID ?? order.user?.id;
    const user = (userList || []).find((c: any) =>
      c.id === userId || c.customerId === userId || c.supplierId === userId || c.userId === userId
    );

    const customerName = user?.name ?? order.customerName ?? order.supplierName ?? '';
    const customerPhone = user?.phone ?? user?.contact ?? order.customerPhone ?? order.supplierPhone ?? '';
    const customerAddress = user?.address ?? order.customerAddress ?? order.supplierAddress ?? '';

    return {
      type: 'order',
      orderInvoiceNo: order.orderInvoiceNo ?? order.invoiceNo ?? '',
      invoiceNo: order.invoiceNo ?? order.orderInvoiceNo ?? '',
      customerName,
      customerPhone,
      customerAddress,
      customerId: userId,
      order: order,
    };
  });

  // Deduplicate by customerId or invoice
  const seen = new Set();
  this.filteredResults = this.filteredResults.filter((item: any) => {
    const key = item.customerId ?? item.orderInvoiceNo ?? item.invoiceNo;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  this.showSearchDropdown = true;
}

selectSearchResult(result: any) {
  const custId = result.customerId;
  const userList = this.selectedType === 1 ? this.lstCustomer : this.lstSupplier;
  const user = (userList || []).find((c: any) =>
    c.id === custId || c.customerId === custId || c.supplierId === custId || c.userId === custId
  );

  this.selectedCustomer = {
    id: custId,
    name: user?.name ?? result.customerName,
    phone: user?.phone ?? user?.contact ?? result.customerPhone,
    contact: user?.phone ?? user?.contact ?? result.customerPhone,
    address: user?.address ?? result.customerAddress ?? '',
  };

  this.customerSearch = result.orderInvoiceNo || result.invoiceNo || result.customerName || '';
  this.showSearchDropdown = false;

  if (custId) {
    this.lstPayment = (this.allPayments || [])
      .filter((order: any) => {
        const userId = order.customerId ?? order.supplierId ?? order.userId ?? order.userID ?? order.user?.id;
        return userId === custId;
      })
      .map((o: any) => ({
        ...o,
        invoiceNo: o.invoiceNo ?? o.orderInvoiceNo,
      }));
  } else if (result.order) {
    const o = result.order;
    this.lstPayment = [{ ...o, invoiceNo: o.invoiceNo ?? o.orderInvoiceNo }];
  } else {
    this.lstPayment = [];
  }

  this.getCustomerTotalDue();
}

/**
 * Cumulative due across ALL records (every page), not just the visible page:
 * - customer selected  -> that customer's due
 * - search text only   -> due of everything matching the search
 * - nothing            -> due of all customers/suppliers
 */
getCustomerTotalDue() {
  const customer = this.selectedCustomer;
  const searchText = customer ? (customer.phone || customer.name || '') : (this.customerSearch || '').trim();
  const requestId = ++this.totalDueRequestId;
  const pageSize = 1000;
  let runningTotal = 0;

  this.isTotalDueLoading = true;

  const loadPage = (pageIndex: number) => {
    const filter: any = {
      tenantId: this.authenticatedUser?.tenantId,
      userType: this.selectedType,
      searchText,
      pageIndex,
      pageSize,
    };

    this.paymentService.fetchAllOrder(filter).subscribe({
      next: (res: ApiResponse) => {
        if (requestId !== this.totalDueRequestId) return; // a newer request has started
        if (!res.isSuccess) {
          this.isTotalDueLoading = false;
          return;
        }

        const rows: any[] = res.result || [];
        runningTotal += rows
          .filter((order: any) => {
            if (!customer?.id) return true;
            const userId = order.customerId ?? order.supplierId ?? order.userId ?? order.userID ?? order.user?.id;
            return userId === customer.id;
          })
          .reduce((total: number, order: any) => total + (Number(order.dueAmount) || 0), 0);

        const totalCount = Number(res.totalCount ?? rows[0]?.totalCount ?? rows.length);
        if (rows.length > 0 && pageIndex * pageSize < totalCount) {
          loadPage(pageIndex + 1);
        } else {
          this.customerTotalDue = runningTotal;
          this.isTotalDueLoading = false;
        }
      },
      error: () => {
        if (requestId === this.totalDueRequestId) this.isTotalDueLoading = false;
      },
    });
  };

  loadPage(1);
}

get totalDueCaption(): string {
  if (this.selectedCustomer) return this.selectedCustomer.name || '';
  if (this.customerSearch?.trim()) return 'Matching search';
  return this.selectedType === 2 ? 'All suppliers' : 'All customers';
}


  onSearchFocus() {
    if (this.customerSearch) {
      this.onSearchChange();
    }
  }



  clearSelection() {
    this.selectedCustomer = null;
    clearTimeout(this.totalDueTimer);
    this.customerSearch = '';
    this.lstPayment = this.allPayments;
    this.filteredResults = [];
    this.getCustomerTotalDue(); // back to the all-customers total
  }

  hideSearchDropdown() {
    setTimeout(() => {
      this.showSearchDropdown = false;
    }, 200);
  }

  // Payment details modal methods
openPaymentDetails(row: any) {
  debugger
  this.backspaceDueAmount = row.dueAmount;
  this.getTotalQuantity(row);
  if (!row) return;
  if (!row.invoiceNo && row.orderInvoiceNo) row.invoiceNo = row.orderInvoiceNo;

  // Populate selectedCustomer if not already set
  if (!this.selectedCustomer) {
    const userId = row.customerId ?? row.supplierId ?? row.userId ?? row.userID;
    const userList = this.selectedType === 1 ? this.lstCustomer : this.lstSupplier;
    const user = (userList || []).find((c: any) =>
      c.id === userId || c.customerId === userId || c.supplierId === userId || c.userId === userId
    );
    
    this.selectedCustomer = {
      id: userId,
      name: user?.name ?? row.customerName ?? row.supplierName ?? row.userName ?? '',
      phone: row.userPhone ?? row.customerPhone ?? row.supplierPhone ?? row.phoneNumber ?? '',
      contact:  row.userPhone ?? row.supplierPhone ?? row.phoneNumber ?? '',
      address: user?.address ??row. userAddress ?? row.customerAddress ?? row.supplierAddress ?? '',
    };
  }
console.log(this.selectedCustomer);
  // Normalize possible item arrays from different API shapes into `salesOrderDetails`
  let items: any =
    row.salesOrderDetails ||
    row.requestOrderDetails ||
    row.purchaseOrderDetails ||
    row.orderDetails ||
    row.requestOrderDetail ||
    row.requestOrderItems ||
    row.items ||
    [];

  if (!Array.isArray(items)) {
    items = Object.keys(items || {}).map((k) => (items as any)[k]).filter(Boolean);
  }

  console.log('openPaymentDetails - row data:', row);
  console.log('openPaymentDetails - extracted items:', items);

  const payment = {
    ...row,
    salesOrderDetails: Array.isArray(items) ? [...items] : [],
    invoiceNo: row.invoiceNo ?? row.orderInvoiceNo ?? '',
    originalPaidAmount: row.paidAmount || 0,  // Store the already-paid amount
    existingDiscount: row.discountAmount || 0,
    discountAmount:  0,
    // discountAmount: row.discountAmount || 0,
    };

  this.selectedPayment = payment;
  this.showPaymentModal = true;

  // If salesOrderDetails is empty, fetch from appropriate API by invoice
  if ((!payment.salesOrderDetails || payment.salesOrderDetails.length === 0) && payment.invoiceNo) {
    
    console.log('Fetching order details for invoice:', payment.invoiceNo, 'Type:', this.selectedType);
    
    // Only fetch for customers (type 1) since supplier details aren't in SalesOrder API
    if (this.selectedType === 1) {
      const searchReq: any = {
        searchText: payment.invoiceNo,
        tenantId: this.authenticatedUser?.tenantId,
        IsDraft:false,
        IsReturn:false
      };
      
      this.salesOrderService.fetchAllSalesOrder(searchReq).subscribe((res: ApiResponse) => {
        console.log('API Response:', res);
        if (res.isSuccess && res.result && res.result.length > 0) {
          const order = res.result[0];
          console.log('Order details:', order);
          const orderItems = order.salesOrderDetails || order.requestOrderDetails || order.purchaseDetails || order.purchaseOrderDetails || order.orderDetails || [];
          console.log('Extracted order items:', orderItems);
          this.selectedPayment = {
            ...this.selectedPayment,
            salesOrderDetails: Array.isArray(orderItems) ? orderItems : [],
          };
          this.selectedPayment = {
            ...this.selectedPayment,
            purchaseOrderDetails: Array.isArray(orderItems) ? orderItems : [],
          };
          console.log('Updated selectedPayment:', this.selectedPayment);
        } else {
          console.log('No results found or unsuccessful response');
        }
      }, (error) => {
        console.error('Error fetching order details:', error);
      });
    } else {
      // For suppliers, items are not available via API currently
      console.log('Supplier order items not available via API');
         const searchReq: any = {
        searchText: payment.invoiceNo,
        tenantId: this.authenticatedUser?.tenantId,
      };
   this.purchaseService.fetchAllPurchase(searchReq).subscribe((res: ApiResponse) => {
        console.log('API Response:', res);
        if (res.isSuccess && res.result && res.result.length > 0) {
          const order = res.result[0];
          console.log('Order details:', order);
          const orderItems = order.salesOrderDetails || order.requestOrderDetails || order.purchaseDetails || order.purchaseOrderDetails || order.orderDetails || [];
          console.log('Extracted order items:', orderItems);
          this.selectedPayment = {
            ...this.selectedPayment,
            salesOrderDetails: Array.isArray(orderItems) ? orderItems : [],
          };
          this.selectedPayment = {
            ...this.selectedPayment,
            purchaseOrderDetails: Array.isArray(orderItems) ? orderItems : [],
          };
          console.log('Updated selectedPayment:', this.selectedPayment);
        } else {
          console.log('No results found or unsuccessful response');
        }
      }, (error) => {
        console.error('Error fetching order details:', error);
      });
    }

      // Create a dummy item so the payment fields can still be shown
      this.selectedPayment = {
        ...this.selectedPayment,
        salesOrderDetails: [{
          itemName: 'Payment',
          quantity: '-',
          paymentType: this.selectedPayment.paymentMethod || 1
        }],
      };
    }


}

  closePaymentModal() {
    this.showPaymentModal = false;
    this.selectedPayment = null;
    this.showPrintButton = false;
    this.lastSubmittedPayment = null;
  }


printReceipt() {
  if (!this.lastSubmittedPayment) return;
  debugger
  const payment = this.lastSubmittedPayment;
  const partyLabel = this.selectedType === 2 ? 'Supplier' : 'Customer';
  const printContent = `
    <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 20px; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td { padding: 8px; border: 1px solid #ccc; }
          .label { font-weight: bold; width: 30%; }
          .value { width: 70%; }
          .header-row { background-color: #f0f0f0; font-weight: bold; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          .center { text-align: center; }
          .right { text-align: right; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 45%; text-align: center; border-top: 1px solid #000; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PAYMENT RECEIPT</h1>
          
          <div class="section">
            <table>
              <tr>
                <td class="label">Receipt No</td>
                <td class="value">${payment.orderInvoiceNo || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Receipt Date</td>
                <td class="value">${payment.createdDate || new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td class="label">Payment Date</td>
                <td class="value">${payment.paymentDate || new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td class="label">${partyLabel} Name</td>
                <td class="value">${this.selectedCustomer.name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Contact</td>
                <td class="value">${this.selectedCustomer.phone || this.selectedCustomer.contact}</td>
              </tr>
              <tr>
                <td class="label">${partyLabel} Address</td>
                <td class="value">${this.selectedCustomer.address || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <table>
              <tr class="header-row">
                <td>Invoice No</td>
                <td>Invoice Date</td>
                <td>Item Name</td>
                <td class="right">Invoice Amount</td>
                <td class="right">Paid Amount</td>
                <td class="right">Discount Amount</td>
                <td class="right">Due After Payment</td>
              </tr>
              ${payment.salesOrderDetails && payment.salesOrderDetails.length > 0 
? payment.salesOrderDetails.map((detail: any, index: number) => `
  <tr>
    ${index === 0 ? `
      <td rowspan="${payment.salesOrderDetails.length}">${payment.orderInvoiceNo || 'N/A'}</td>
      <td rowspan="${payment.salesOrderDetails.length}">
${payment.createdDate
  ? new Date(payment.createdDate).toLocaleDateString('en-GB')
  : 'N/A'}
</td>
    ` : ''}
    <td class="right">${detail.itemName || 'N/A'}</td>
     ${index === 0 ? `
      <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.totalAmount || 0}</td>
      <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.newPaidAmount || 0}</td>
      <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.discountAmount || 0}</td>
      <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.newDueAmount || 0}</td>
    ` : ''}
  </tr>
`).join('')
: '<tr><td colspan="6">No details available</td></tr>'}


              
            </table>
            
            <table style="margin-top: 10px;">
              <tr class="total-row">
                <td style="width: 60%;"></td>
                <td class="label">Total Paid Amount</td>
                <td class="value right">${payment.newPaidAmount || payment.totalAmount || 0}</td>
              </tr>
            </table>

            <table style="margin-top: 10px;">
              <tr>
                <td class="label">Payment Mode</td>
                <td class="value">${payment.paymentMethodName || 'Cash'}</td>
              </tr>
              ${payment.paymentMethod === 4 ? `
              <tr>
                <td class="label">Bank Name</td>
                <td class="value">${payment.bankName || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Transaction Ref</td>
                <td class="value">${payment.transactionRef || 'N/A'}</td>
              </tr>
              ` : ''}
              ${payment.paymentMethod === 3 ? `
              <tr>
                <td class="label">Mobile Number</td>
                <td class="value">${payment.mobileNumber || 'N/A'}</td>
              </tr>
              ` : ''}
              <tr>
                <td class="label">Collected By</td>
                <td class="value">${this.authenticatedUser?.unique_name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Remarks</td>
                <td class="value">${payment.remarks || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <p>Authorized Signature</p>
            </div>
            <div class="signature-box">
              <p>Customer Signature</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}


// Add this new method to fetch order details
private fetchOrderDetailsForPrint(invoiceNo: string, paymentData: any): Promise<any> {
  return new Promise((resolve) => {
    // If already has details, return as is
    if (paymentData.salesOrderDetails && paymentData.salesOrderDetails.length > 0) {
      resolve(paymentData);
      return;
    }

    // For customers (type 1), fetch from SalesOrderService
    if (this.selectedType === 1) {
      const searchReq: any = {
        searchText: invoiceNo,
        tenantId: this.authenticatedUser?.tenantId,
        IsDraft: false,
        IsReturn: false
      };
      
      this.salesOrderService.fetchAllSalesOrder(searchReq).subscribe((res: ApiResponse) => {
        if (res.isSuccess && res.result && res.result.length > 0) {
          const order = res.result[0];
          const orderItems = order.salesOrderDetails || order.requestOrderDetails || order.purchaseDetails || order.purchaseOrderDetails || order.orderDetails || [];
          paymentData.salesOrderDetails = Array.isArray(orderItems) ? orderItems : [];
        }
        resolve(paymentData);
      }, (error) => {
        console.error('Error fetching order details:', error);
        resolve(paymentData);
      });
    } else {
      // For suppliers (type 2), fetch from PurchaseService
      const searchReq: any = {
        searchText: invoiceNo,
        tenantId: this.authenticatedUser?.tenantId,
      };
      
      this.purchaseService.fetchAllPurchase(searchReq).subscribe((res: ApiResponse) => {
        if (res.isSuccess && res.result && res.result.length > 0) {
          const order = res.result[0];
          const orderItems = order.salesOrderDetails || order.requestOrderDetails || order.purchaseDetails || order.purchaseOrderDetails || order.orderDetails || [];
          paymentData.salesOrderDetails = Array.isArray(orderItems) ? orderItems : [];
        }
        resolve(paymentData);
      }, (error) => {
        console.error('Error fetching purchase details:', error);
        resolve(paymentData);
      });
    }
  });
}


async print(payment?: any) {
  debugger
  let paymentData = payment || this.lastSubmittedPayment;
  if (!paymentData) return;

  // Fetch order details if missing
  const invoiceNo = paymentData.orderInvoiceNo || paymentData.invoiceNo;
  paymentData = await this.fetchOrderDetailsForPrint(invoiceNo, paymentData);

  const partyLabel = this.selectedType === 2 ? 'Supplier' : 'Customer';

  // Get customer info - from selectedCustomer if available, otherwise from payment row
  const customerInfo = this.selectedCustomer || {
    name: paymentData.userName || paymentData.customerName || paymentData.supplierName || 'N/A',
    phone: paymentData.userPhone || paymentData.customerPhone || paymentData.supplierPhone || 'N/A',
    address: paymentData.userAddress || paymentData.supplierAddress || 'N/A',
  };

  // Get payment details - use actual details if available, otherwise create a summary row
  const orderDetails = paymentData.salesOrderDetails && paymentData.salesOrderDetails.length > 0 
    ? paymentData.salesOrderDetails 
    : [{ itemName: 'Payment Made', quantity: '-' }];

    debugger
  // Convert payment method number to name
  const getPaymentMethodLabel = (method: any) => {
    const methodNum = Number(method);
    switch (methodNum) {
      case 1: return 'Cash';
      case 2: return 'Credit Card';
      case 3: return 'Mobile Banking';
      case 4: return 'Bank Transfer';
      default: return paymentData.paymentMethodName || 'Cash';
    }
  };
  const paymentMethodLabel = getPaymentMethodLabel(paymentData.paymentMethod);
  debugger
  const paidAmount = paymentData.newPaidAmount || paymentData.paidAmount || 0;
  const dueAmount = paymentData.newDueAmount !== undefined ? paymentData.newDueAmount : (paymentData.dueAmount || 0);
  const discountAmount = paymentData.discountAmount || 0;

  const detailRowsHTML = orderDetails.map((detail: any, index: number) => `
    <tr>
      ${index === 0 ? `
        <td rowspan="${orderDetails.length}">${paymentData.orderInvoiceNo || paymentData.invoiceNo || 'N/A'}</td>
        <td rowspan="${orderDetails.length}">
          ${paymentData.createdDate ? new Date(paymentData.createdDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
        </td>
      ` : ''}
      <td>${detail.itemName || 'N/A'}</td>
      <td>${detail.quantity || '-'}</td>
      ${index === 0 ? `
        <td class="right">${paymentData.totalAmount || 0}</td>
        <td class="right">${paidAmount}</td>
        <td class="right">${discountAmount}</td>
        <td class="right">${dueAmount}</td>
      ` : ''}
    </tr>
  `).join('');

  const printContent = `
    <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 20px; }
          h1 { text-align: center; font-size: 24px; margin-bottom: 10px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td { padding: 8px; border: 1px solid #ccc; }
          .label { font-weight: bold; width: 30%; }
          .value { width: 70%; }
          .header-row { background-color: #f0f0f0; font-weight: bold; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          .center { text-align: center; }
          .right { text-align: right; }
          .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { width: 45%; text-align: center; border-top: 1px solid #000; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PAYMENT RECEIPT</h1>
          
          <div class="section">
            <table>
              <tr>
                <td class="label">Receipt No</td>
                <td class="value">${paymentData.orderInvoiceNo || paymentData.invoiceNo || 'N/A'}</td>
              </tr>
             <tr>
  <td class="label">Receipt Date</td>
  <td class="value">
    ${
      payment.createdDate
        ? new Date(payment.createdDate).toLocaleDateString('en-US')
        : new Date().toLocaleDateString('en-US')
    }
  </td>
</tr>
                <tr>
                  <td class="label">Payment Date</td>
                  <td class="value">${payment.paymentDate || new Date().toLocaleDateString()}</td>
                </tr>
              <tr>
                <td class="label">${partyLabel} Name</td>
                <td class="value">${customerInfo.name}</td>
              </tr>
              <tr>
                <td class="label">Contact</td>
                <td class="value">${customerInfo.phone}</td>
              </tr>
              <tr>
                <td class="label">${partyLabel} Address</td>
                <td class="value">${customerInfo.address || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
                         <table>
                <tr class="header-row">
                  <td>Invoice No</td>
                  <td>Invoice Date</td>
                  <td>Item Name</td>
                  <td class="right">Invoice Amount</td>
                  <td class="right">Paid Amount</td>
                  <td class="right">Discount Amount</td>
                  <td class="right">Due After Payment</td>
                </tr>
                ${
                  payment.salesOrderDetails &&
                  payment.salesOrderDetails.length > 0
                    ? payment.salesOrderDetails
                        .map(
                          (detail: any, index: number) => `
    <tr>
      ${
        index === 0
          ? `
        <td rowspan="${payment.salesOrderDetails.length}">${payment.orderInvoiceNo || 'N/A'}</td>
        <td rowspan="${payment.salesOrderDetails.length}">
  ${
    payment.createdDate
      ? new Date(payment.createdDate).toLocaleDateString('en-GB')
      : 'N/A'
  }
</td>
      `
          : ''
      }
      <td class="right">${detail.itemName || 'N/A'}</td>
       ${
         index === 0
           ? `
        <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.totalAmount || 0}</td>
        <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.newPaidAmount || 0}</td>
        <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.discountAmount || 0}</td>
        <td class="right" rowspan="${payment.salesOrderDetails.length}">${payment.newDueAmount || 0}</td>
      `
           : ''
       }
    </tr>
  `,
                        )
                        .join('')
                    : '<tr><td colspan="6">No details available</td></tr>'
                }


                
              </table>
            
            <table style="margin-top: 10px;">
              <tr class="total-row">
                <td style="width: 60%;"></td>
                <td class="label">Total Paid Amount</td>
                <td class="value right">${paidAmount}</td>
              </tr>
            </table>

            <table style="margin-top: 10px;">
              <tr>
                <td class="label">Payment Mode</td>
                <td class="value">${paymentMethodLabel}</td>
              </tr>
              ${
                paymentData.paymentMethod === 4
                  ? `
              <tr>
                <td class="label">Bank Name</td>
                <td class="value">${paymentData.bankName || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Transaction Ref</td>
                <td class="value">${paymentData.transactionRef || 'N/A'}</td>
              </tr>
              `
                  : ''
              }
              ${
                paymentData.paymentMethod === 3
                  ? `
              <tr>
                <td class="label">Mobile Number</td>
                <td class="value">${paymentData.mobileNumber || 'N/A'}</td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td class="label">Collected By</td>
                <td class="value">${this.authenticatedUser?.unique_name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Remarks</td>
                <td class="value">${paymentData.remarks || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <p>Authorized Signature</p>
            </div>
            <div class="signature-box">
              <p>Customer Signature</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
onDiscountChange(discountAmount: number): void {
  debugger

  // this.currentDiscountAmount = discountAmount || 0;
  this.selectedPayment.discountAmount = discountAmount;
  if (!this.selectedPayment) return;

  // Ensure discount doesn't exceed total amount
  // if (discountAmount > this.selectedPayment.totalAmount) {
  if (discountAmount > this.selectedPayment.dueAmount) {
    this.selectedPayment.discountAmount = this.selectedPayment.dueAmount;
    // this.selectedPayment.discountAmount = this.selectedPayment.totalAmount;
    return;
  }

  // Recalculate due amount after discount
  // const discountedTotal = this.selectedPayment.totalAmount - (discountAmount || 0);
  const discountedTotal = this.selectedPayment.dueAmount - (discountAmount || 0);
  this.selectedPayment.dueAmount = discountedTotal - (this.selectedPayment.paymentAmount || 0);
}
onPaymentKeydown(event: KeyboardEvent) {
  debugger
  if (event.key === 'Backspace' || event.keyCode === 8) {
    // Check if field will be empty after backspace
    const input = event.target as HTMLInputElement;
    if (input.value.length === 1) {
      this.selectedPayment.paymentAmount = null;
      this.selectedPayment.dueAmount = this.backspaceDueAmount;
      this.selectedPayment.paidAmount = this.selectedPayment.originalPaidAmount || 0;
      this.isdisable = false;
      this.checkdue = true;

    }
  }
}



onPaymentAmountChange(value: any) {
  debugger
  if (!this.selectedPayment) return;

  const paymentAmount = Number(this.selectedPayment.paymentAmount) || 0;
  const originalDue = Number(this.backspaceDueAmount) || 0;  // Already after existing discount
  const originalPaid = Number(paymentAmount) || 0;
  // const originalPaid = Number(this.selectedPayment.originalPaidAmount) || 0;
  
  // 
  // Only subtract the NEW discount being added in this session
  const newDiscountAmount = Number(this.selectedPayment.discountAmount) || 0;
  const dueAfterAdditionalDiscount = originalDue - newDiscountAmount;

  // Empty or zero input
  if (paymentAmount <= 0) {
    this.selectedPayment.paymentAmount = 0;
    this.selectedPayment.dueAmount = dueAfterAdditionalDiscount;
    this.selectedPayment.paidAmount = originalPaid;
    this.isdisable = false;
    this.checkdue = true;
    return;
  }

  // Prevent paying more than due
  if (paymentAmount > dueAfterAdditionalDiscount) {
    this.messagHelper.showMessage(400, 'Payment amount cannot exceed due amount');
    this.isdisable = true;
    this.checkdue = false;
    return;
  }

  // Real-time calculation
  this.selectedPayment.paymentAmount = paymentAmount;
  this.selectedPayment.dueAmount = +(dueAfterAdditionalDiscount - paymentAmount).toFixed(2);
  this.selectedPayment.paidAmount = Number( paymentAmount).toFixed(2);
  // this.selectedPayment.paidAmount = +(originalPaid + paymentAmount).toFixed(2);

  this.isdisable = false;
  this.checkdue = this.selectedPayment.dueAmount > 0;
}



  submitPayment() {
    
    this.isdisable = true;
    const amount = Number(this.selectedPayment.paymentAmount) || 0;
    const paidSoFar = Number(this.selectedPayment.originalPaidAmount) || 0;
    const total = Number(this.selectedPayment.totalAmount) || 0;
    const discount = Number(this.selectedPayment.discountAmount) || 0;
    debugger;
    const newPaid = Math.round((paidSoFar + amount) * 100) / 100;
    const newDue = Math.max(
      0,
      Math.round((total - discount - newPaid) * 100) / 100,
    );
    console.log('Submitting payment with due amount:', this.selectedPayment);
    // if (this.selectedPayment && this.checkdue) {
      // Get payment method details from first item in salesOrderDetails
      const firstItem = this.selectedPayment.salesOrderDetails?.[0] || {};
      if(this.selectedPayment.userType == 1){
        this.selectedPayment.paymentType = 2;
      }else{
        this.selectedPayment.paymentType = 1;
      }
      debugger
      const updateObj = {
        // id: this.selectedPayment.id,
        // id:  this.selectedPayment.id,
        id:  0,
        userId: this.selectedPayment.userId,
        userType: this.selectedPayment.userType,
      
        paymentType: this.selectedPayment.paymentType,
        discountAmount: discount,
        requestOrderId: this.selectedPayment.id,
        requestOrderDetailId: this.selectedPayment.requestOrderDetailId,
        orderInvoiceNo: this.selectedPayment.orderInvoiceNo,
        totalAmount: this.selectedPayment.totalAmount,
        paidAmount: Number(this.selectedPayment.paidAmount) || 0,
        dueAmount: this.selectedPayment.dueAmount,
        amount: Number(this.selectedPayment.paidAmount),
        paymentMethod: firstItem.paymentType || this.selectedPayment.paymentMethodName,
        mobileBankMethod: firstItem.mobileBankMethod || this.selectedPayment.mobileBankMethod,
        phoneNumber: firstItem.phoneNumber || this.selectedPayment.phoneNumber,
        bankName: firstItem.bankName || this.selectedPayment.bankName,
        accountNumber: firstItem.accountNumber || this.selectedPayment.accountNumber,

        tenantId: this.authenticatedUser?.tenantId,
      };
      debugger
      if(updateObj.paymentMethod == 0 || updateObj.paidAmount == 0){
        this.messagHelper.showMessage(400, 'Please select a payment method and enter a valid amount');
        // this.toastr.error('Please select a payment method and enter a valid amount');
      }else{
        this.paymentService
        .updateCustomerDueAmount(updateObj)
        .subscribe((res: ApiResponse) => {
          if (res.isSuccess) {
            this.messagHelper.showMessage(
              200,
              'Due amount updated successfully.'
            );
            
            // Store payment data for printing and show print button
            this.lastSubmittedPayment = {
              ...this.selectedPayment,
              paymentAmount: amount,
              newPaidAmount: newPaid,
              newDueAmount: newDue,
              paymentDate: new Date().toLocaleDateString('en-GB'),
              paymentMethod: Number(updateObj.paymentMethod) || 1,
              paymentMethodName: this.getPaymentMethodName(updateObj.paymentMethod),
              bankName: updateObj.bankName,
              mobileNumber: updateObj.phoneNumber,
              transactionRef: updateObj.accountNumber,

            };
            this.selectedPayment.discountAmount = 0;
            this.showPrintButton = true;
            
            this.getAllPaymentList(this.payment);
            this.getCustomerTotalDue();
            this.checkdue = false;
            this.isdisable = false;
           
          } else {
            if (res.errorMessage.length > 0) {
              res.errorMessage.forEach((msg) => {
                this.messagHelper.showMessage(res.statusCode, msg);
              });
            }
          }
        });
      }
      
    // }
  }
getPaymentMethodName(method: any): string {
  const methodNum = Number(method);
  switch (methodNum) {
    case 1: return 'Cash';
    case 2: return 'Credit';
    case 3: return 'Mobile Banking';
    case 4: return 'Bank Transfer';
    default: return 'Cash';
  }
}

onItemPaymentMethodChange(item: any) {
  // Initialize fields when payment method changes
  if (item.paymentType === 3) {
    item.mobileBankMethod = item.mobileBankMethod || '';
    item.mobileNumber = item.mobileNumber || '';
  } else if (item.paymentType === 4) {
    item.bankName = item.bankName || '';
    item.accountNumber = item.accountNumber || '';
  }
}
      openNavigationSheet() {
      const ref = this.bottomSheet.open(BottomSheetComponent, {
        data: {
          isPageNavigation: true,
          label: 'Navigate to Page',
          placeholder: 'Type page name (e.g., purchase, order, users)',
        },
      });
  
      ref.afterDismissed().subscribe((result: any) => {
      });
    }
}
