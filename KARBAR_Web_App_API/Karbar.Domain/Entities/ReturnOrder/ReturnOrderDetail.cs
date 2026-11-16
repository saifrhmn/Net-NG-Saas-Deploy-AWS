using Karbar.Domain.Entities.SalesOrder;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.ReturnOrder
{
    public class ReturnOrderDetail : BaseEntity
    {
        public string ReturnOrderDetailId { get; set; }
        public int ReturnOrderId { get; set; }
        public int? ItemId { get; set; }
        public int? UomId { get; set; }
        public int? WarehouseId { get; set; }
        [NotMapped]
        public string? WarehouseName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        [ForeignKey(nameof(ReturnOrderId))]
        public ReturnOrderMaster ReturnOrderMaster { get; set; }
        public Item Item { get; set; }
        public Uom Uom { get; set; }
        public Warehouse Warehouse { get; set; }
    }
}
