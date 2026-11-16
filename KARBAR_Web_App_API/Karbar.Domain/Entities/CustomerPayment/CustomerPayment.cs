using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.CustomerPayment
{
    public class CustomerPayment : BaseEntity
    {
        public int CustomerId { get; set; }
        public string PaymentType { get; set; } = "Advance";
        public int? RequestOrderId { get; set; }
        public int? RequestOrderDetailId { get; set; }
        public string? OrderInvoiceNo { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? DueAmount { get; set; }
        public decimal Amount { get; set; }
    }
}
