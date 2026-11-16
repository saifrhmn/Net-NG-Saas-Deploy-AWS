using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetCustomerReceivableReportResponse
    {
        public long SLNo { get; set; }

        public string? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public string? InvoiceNo { get; set; }

        public DateTime? InvoiceDate { get; set; }

        public DateTime? DueDate { get; set; }

        public decimal InvoiceAmount { get; set; }

        public decimal Paid { get; set; }

        public decimal Outstanding { get; set; }

        public int? AgingDays { get; set; }

        public int TotalCount { get; set; }
    }
}
