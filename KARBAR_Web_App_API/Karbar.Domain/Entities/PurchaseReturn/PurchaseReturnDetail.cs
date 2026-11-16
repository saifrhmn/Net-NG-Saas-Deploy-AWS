using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Karbar.Domain.Entities.PurchaseReturn
{
    public class PurchaseReturnDetail : BaseEntity
    {
        public string PurchaseReturnDetailId { get; set; }
        public int PurchaseReturnId { get; set; }
        public int? ItemId { get; set; }
        public int? UomId { get; set; }
        public int? WarehouseId { get; set; }
        [NotMapped]
        public string? WarehouseName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        [ForeignKey(nameof(PurchaseReturnId))]
        public PurchaseReturnMaster PurchaseReturnMaster { get; set; }
        public Item Item { get; set; }
        public Uom Uom { get; set; }
        //public Supplier Supplier { get; set; }
        public Warehouse Warehouse { get; set; }
    }
}

