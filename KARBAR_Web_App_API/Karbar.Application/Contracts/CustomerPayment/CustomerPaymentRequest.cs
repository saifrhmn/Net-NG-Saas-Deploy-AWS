using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.CustomerPayment
{
    public class CustomerPaymentRequest
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string PaymentType { get; set; } = "Advance";
        public int? RequestOrderId { get; set; }
        public int? RequestOrderDetailId { get; set; }
        public string? OrderInvoiceNo { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? DueAmount { get; set; }
        public decimal Amount { get; set; }
        // Optional tenant information - include if your API requires it for multi-tenant scenarios
        public int? TenantId { get; set; }
    }
}
