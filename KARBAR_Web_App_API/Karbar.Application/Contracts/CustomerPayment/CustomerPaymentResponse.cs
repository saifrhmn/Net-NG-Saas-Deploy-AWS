using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.CustomerPayment
{
    public class CustomerPaymentResponse
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

        // audit fields from BaseEntity
        public DateTime? CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }
        public StatusEnum Status { get; set; }
    }
}
