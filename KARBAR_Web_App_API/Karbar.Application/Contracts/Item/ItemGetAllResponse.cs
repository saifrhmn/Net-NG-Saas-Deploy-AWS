using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Item
{
    public class ItemGetAllResponse
    {
        public int Id { get; set; }
        public string? MaterialNumber { get; set; }
        public string? Name { get; set; }
        public string ItemDescription { get; set; }
        public string? BrandId { get; set; }
        public string? BrandName { get; set; }
        public string? CategoryName { get; set; }
        public string? UOMName { get; set; }
        public string? WarehouseName { get; set; }
        public int? TenantId { get; set; }
        public string? BaseUnitOfMeasure { get; set; }
        public string? SizeOrPackSize { get; set; }
        public decimal? Volume { get; set; }
        public decimal? InvoicePrice { get; set; }
        public string? VolumeUnit { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? MovingAveragePrice { get; set; }
        public decimal? StandardPrice { get; set; }
        public DateTime? LastChangedDate { get; set; }
        public string? FreightGroup { get; set; }
        public int? LowStock { get; set; }
        
        public int TotalCount { get; set; }
    }
}
