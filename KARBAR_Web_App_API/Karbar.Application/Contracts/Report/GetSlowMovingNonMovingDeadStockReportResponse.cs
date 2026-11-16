using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetSlowMovingNonMovingDeadStockReportResponse
    {
        public int? ItemId { get; set; }

        public string? MaterialCode { get; set; }

        public string? MaterialName { get; set; }

        public string? Category { get; set; }

        public decimal? CurrentStock { get; set; }

        public decimal? UnitCost { get; set; }

        public decimal? StockValue { get; set; }

        public DateTime? LastPurchaseDate { get; set; }

        public DateTime? LastSaleDate { get; set; }

        public int? DaysSinceLastSale { get; set; }

        public decimal? SalesQty30Days { get; set; }

        public decimal? SalesQty60Days { get; set; }

        public decimal? SalesQty90Days { get; set; }

        public string? StockStatus { get; set; }

        public string? SuggestedAction { get; set; }

        public int? TotalCount { get; set; }
    }
}

