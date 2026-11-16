using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetInventoryMovementReportResponse
    {
        public string? MaterialCode { get; set; }
        public string? MaterialName { get; set; }
        public decimal? OpeningStockQty { get; set; }
        public decimal? ReceivedQty { get; set; }
        public decimal? SalesQty { get; set; }
        public decimal? ClosingStockQty { get; set; }
        public int? TotalCount { get; set; }
    }
}
