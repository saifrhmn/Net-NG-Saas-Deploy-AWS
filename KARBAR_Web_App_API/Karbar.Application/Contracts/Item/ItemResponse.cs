using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Item
{
    public class ItemResponse
    {
        public int Id { get; set; }
        public string ItemId { get; set; }
        public string? MaterialNumber { get; set; }
        public string ItemDescription { get; set; }
        public string Name { get; set; }
        public double MRP { get; set; }
        public double SellingPrice { get; set; }
        public double PurchasePrice { get; set; }
        public string Barcode { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int BrandId { get; set; }
        public string BrandName { get; set; }
        public int UomId { get; set; }
        public string UomName { get; set; }
        public int WarehouseId { get; set; }
        public string WarehouseName { get; set; }
        public int TenantId { get; set; }
        public string TenantName { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? BaseUnitOfMeasure { get; set; }
        public string? SizeOrPackSize { get; set; }
        public decimal? Volume { get; set; }
        public string? VolumeUnit { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? MovingAveragePrice { get; set; }
        public decimal? InvoicePrice { get; set; }
        public decimal? StandardPrice { get; set; }
        public DateTime? LastChangedDate { get; set; }
        public string? FreightGroup { get; set; }
        public decimal? WeightedAveragePrice { get; set; }
        public DateTime? WeightedAveragePriceUpdatedDate { get; set; }
        public StatusEnum Status { get; set; }

        public string StatusDescription
        {
            get
            {
                var res = "";

                switch (Status)
                {
                    case StatusEnum.Inactive:
                        res = "Inactive";
                        break;
                    case StatusEnum.Active:
                        res = "Active";
                        break;
                    case StatusEnum.Pending:
                        res = "Pending";
                        break;
                    case StatusEnum.Deleted:
                        res = "Deleted";
                        break;
                    default:
                        break;
                }

                return res;
            }
        }
        public int? LowStock { get; set; }
        public int TotalCount { get; set; }
        public List<WarehouseStockResponse> Warehousestk { get; set; } = new();
    }
    public class WarehouseStockResponse
    {
        public int ItemId { get; set; }
        public int StockId { get; set; }
        public int WarehouseId { get; set; }
        public string Warehouse { get; set; }
        public decimal ItemQty { get; set; }
    }
}
