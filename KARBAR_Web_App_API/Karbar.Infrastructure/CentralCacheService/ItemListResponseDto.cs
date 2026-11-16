using Karbar.Application.Contracts.Item;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;

namespace Karbar.Infrastructure.CentralCacheService
{
    public class ItemListResponseDto
    {
        public int Id { get; set; }
        public string ItemId { get; set; }
        public string MaterialNumber { get; set; }
        public string Name { get; set; }
        public double MRP { get; set; }
        public double SellingPrice { get; set; }
        public double PurchasePrice { get; set; }
        public decimal? InvoicePrice { get; set; }
        public string Barcode { get; set; }
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int? BrandId { get; set; }
        public string BrandName { get; set; }
        public int? UomId { get; set; }
        public string UomName { get; set; }
        public int? WarehouseId { get; set; }
        public string WarehouseName { get; set; }
        public int TenantId { get; set; }
        public StatusEnum Status { get; set; }
        public int? LowStock { get; set; }
        public string ImageUrl { get; set; }
        public decimal? WeightedAveragePrice { get; set; }
        public DateTime? WeightedAveragePriceUpdatetdDate { get; set; }
        public List<WarehouseStockResponse> Warehousestk { get; set; }
        public int TotalCount { get; set; }
    }
}