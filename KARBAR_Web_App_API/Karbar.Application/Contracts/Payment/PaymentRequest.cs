using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Payment
{
    public class PaymentRequest
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public int UserType { get; set; }
        public int UserId { get; set; }
        public int PaymentMethod { get; set; }
        public int PaymentType { get; set; }    // 1 = Purchase, 2 = Sales
        public int OrderId { get; set; }    // Refers to RequestOrderMaster / PurchaseOrderMaster Id or SalesOrder Id based on PaymentType
        public string OrderInvoiceNo { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public int? MobileBankMethod { get; set; }
        public string? PhoneNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
    }
}
