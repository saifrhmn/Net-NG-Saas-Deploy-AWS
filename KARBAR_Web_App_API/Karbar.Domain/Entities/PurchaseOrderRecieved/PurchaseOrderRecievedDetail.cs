using Karbar.Domain.Entities.RequestOrder;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.PurchaseOrderRecieved
{
    public class PurchaseOrderRecievedDetail : BaseEntity
    {
        public string PurchaseOrderDetailId { get; set; }
        public int? ItemId { get; set; }
        public int? UomId { get; set; }
        public int? WarehouseId { get; set; }
        public int? SupplierId { get; set; }
        [ForeignKey(nameof(PurchaseOrderRecievedMaster))]
        public int? PurchaseOrderMasterId { get; set; }
        public decimal? InvoiceQty { get; set; }
        public decimal? RemainingQty { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? BergerPurchaseAmount { get; set; }
        public string? OrderStatus { get; set; }
        public PurchaseOrderRecievedMaster PurchaseOrderRecievedMaster { get; set; }
        public Item Item { get; set; }
        public Uom Uom { get; set; }
        public Warehouse Warehouse { get; set; }
        public Supplier Supplier { get; set; }
    }
}
