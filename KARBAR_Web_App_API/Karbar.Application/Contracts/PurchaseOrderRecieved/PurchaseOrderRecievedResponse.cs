using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.PurchaseOrderRecieved
{
    public class PurchaseOrderRecievedResponse
    {
        public int Id { get; set; }
        public string? RecievedOrderId { get; set; }
        public string? RecievedNo { get; set; }
        public DateTime? RecievedDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        
        public decimal? PaidAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? BergerTotalPurchaseAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Vat { get; set; }
        public string? RequestOrderNo { get; set; }
        public int? TenantId { get; set; }

        public List<PurchaseOrderRecievedDetailResponse> PurchaseDetails { get; set; } = new();
        public bool IsCompleted { get; set; }
        public int TotalCount { get; set; }
    }

    public class PurchaseOrderRecievedDetailResponse
    {
        public int Id { get; set; }
        public string PurchaseOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty; // Populate via join if needed

        public int UomId { get; set; }
        public string UomName { get; set; } = string.Empty; // Optional - join to UOM table

        public int WarehouseId { get; set; }
        public string WarehouseName { get; set; } 
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty; // Optional - join to Supplier table

        public decimal? InvoiceQty { get; set; }
        public decimal? RemainingQty { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? BergerPurchaseAmount { get; set; }
        public string? OrderStatus { get; set; }

        public DateTime PurchaseDate { get; set; }
        public DateTime RecievedDate { get; set; }
        public decimal? WeightedAveragePrice { get; set; }
        public DateTime? WeightedAveragePriceUpdatetdDate { get; set; }
    }
}
