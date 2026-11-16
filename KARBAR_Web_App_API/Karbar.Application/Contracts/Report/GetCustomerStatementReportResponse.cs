using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetCustomerStatementReportResponse
    {
        public int SlNo { get; set; }

        public string? CustomerId { get; set; }

        public string CustomerName { get; set; }

        public string Address { get; set; }
        public string CustomerNumber { get; set; }

        public DateTime Date { get; set; }

        public string InvoiceNo { get; set; }

        public decimal Debit { get; set; }

        public decimal Credit { get; set; }

        public decimal Balance { get; set; }

        public int TotalCount { get; set; }
    }
}
