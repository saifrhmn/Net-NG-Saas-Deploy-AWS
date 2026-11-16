using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class PaymentCollectionReportResponse
    {
        public string? CustomerId { get; set; }
        public string? Name { get; set; }
        public string? Contact { get; set; }
        public string? Address { get; set; }

        public string? OrderInvoiceNo { get; set; }

        public DateTime? InvoiceDate { get; set; }
        public DateTime? PaymentDate { get; set; }

        public decimal? InvoiceAmount { get; set; }
        public decimal? ReturnAmount { get; set; }
        public decimal? AmountRecieved { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? BalanceAfterReceipt { get; set; }

        public string? PaymentMethod { get; set; }
        public string? CollectedBy { get; set; }
        public int? TotalCount { get; set; } = 0;
    }
}
