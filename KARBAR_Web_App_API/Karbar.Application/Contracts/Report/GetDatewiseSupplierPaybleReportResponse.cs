using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetDatewiseSupplierPaybleReportResponse
    {
        public long SlNo { get; set; }

        //public string? SupplierCode { get; set; } = string.Empty;

        public string? SupplierContractNo { get; set; } = string.Empty;

        public string? SupplierName { get; set; } = string.Empty;

        public string? InvoicePONo { get; set; } = string.Empty;

        public DateTime? InvoicePODate { get; set; }

        public DateTime? DueDate { get; set; }

        public decimal? InvoicePOAmount { get; set; }

        public decimal? Paid { get; set; }

        public decimal? Outstanding { get; set; }

        //public int? AgingDays { get; set; }

        public int TotalCount { get; set; }

        public decimal? TotalOutstanding { get; set; }
    }
}
