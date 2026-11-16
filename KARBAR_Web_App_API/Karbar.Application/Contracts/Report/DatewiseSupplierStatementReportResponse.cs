using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class DatewiseSupplierStatementReportResponse
    {
        public int? SlNo { get; set; }

        public DateTime? TranDate { get; set; }

        public string? VoucherNo { get; set; }

        public string? Reference { get; set; }

        public decimal? Payment { get; set; }

        public decimal? Purchase { get; set; }

        public decimal? Balance { get; set; }

        public int? AgingDays { get; set; }

        public int TotalCount { get; set; }
    }
}
