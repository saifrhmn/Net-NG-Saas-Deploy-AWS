using System.ComponentModel.DataAnnotations.Schema;

namespace Karbar.Application.Contracts.Report
{
    public class ItemStockReportResponse
    {
        public int? TenantId { get; set; }
        public string? TenantCustomerNo { get; set; }
        public string? MaterialNumber { get; set; }
        public string? ItemName { get; set; }
        public string? Brand { get; set; }
        public string? Catagory { get; set; }
        public string? Warehouse { get; set; }

        public decimal? Quantity { get; set; }
        public string? Unit { get; set; }

        public double? MRP { get; set; }
        public double? SellingPrice { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? WeightedAvgPrice { get; set; }
        public decimal? WarehouseTotalQuantity { get; set; }
        public decimal? WarehouseTotalValue { get; set; }
        public decimal? WarehouseTotalWeightAvgValue { get; set; }
        public DateTime? StockDate { get; set; }

        // Quantity * PurchasePrice
        public decimal? StockValue { get; set; }
        // Quantity * WeightedAvgPrice (fallback PurchasePrice when 0)
        public decimal? WeightAvgStockValue { get; set; }

        public decimal? TotalStockValue { get; set; }
        public decimal? TotalStockQuantity { get; set; }
        public decimal? TotalWeightAvgStockValue { get; set; }

        //public decimal StockValue
        //{
        //    get
        //    {
        //        if (WeightedAvgPrice.HasValue && Quantity.HasValue)
        //        {
        //            return (WeightedAvgPrice.Value * Quantity.Value);
        //        }
        //        return 0;
        //    }
        //}
        public int TotalCount { get; set; }
    }
}
