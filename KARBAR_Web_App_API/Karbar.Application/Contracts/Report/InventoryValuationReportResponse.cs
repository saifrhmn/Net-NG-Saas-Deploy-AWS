using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class InventoryValuationReportResponse
    {
        public string? MaterialCode { get; set; }
        public string? MaterialName { get; set; }
        public string? Category { get; set; }
        public string? PackSize { get; set; }
        public string? WarehouseName { get; set; }

        public decimal? StockQty { get; set; }
        public decimal? UnitCost { get; set; }
        public decimal? StockValue { get; set; }

        public string? ValuationMethod { get; set; }

        public DateTime? LastPurchaseDate { get; set; }

        public int? TotalRecords { get; set; }
    }
}
