using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class Item : BaseEntity
    {
        public string ItemId { get; set; }
        public string? MaterialNumber { get; set; }
        public string? Name { get; set; }
        public string? ItemDescription { get; set; }
        public double? MRP { get; set; }
        public double? SellingPrice { get; set; }
        public double? PurchasePrice { get; set; }
        public string? Barcode { get; set; }
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public int? UomId { get; set; }
        public int? WarehouseId { get; set; }
        public int? TenantId { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageName { get; set; }

        // New properties from your ALTER TABLE
        public string? BaseUnitOfMeasure { get; set; }
        public string? SizeOrPackSize { get; set; }
        public decimal? Volume { get; set; }
        public string? VolumeUnit { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? MovingAveragePrice { get; set; }
        public decimal? StandardPrice { get; set; }
        public decimal? InvoicePrice { get; set; }
        public DateTime? LastChangedDate { get; set; }
        public string? FreightGroup { get; set; }
        public int? LowStock { get; set; } = 0;
        public decimal? WeightedAveragePrice { get; set; }
        public DateTime? WeightedAveragePriceUpdatetdDate { get; set; }
        public Category Category { get; set; }
        public Brand Brand { get; set; }
        public Uom Uom { get; set; }
        public Warehouse Warehouse { get; set; }
        public ICollection<PurchaseOrderDetail> PurchaseOrderDetail { get; set; } = new List<PurchaseOrderDetail>();
    }
}
