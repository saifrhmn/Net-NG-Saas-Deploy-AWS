using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.SalesOrder
{
    public class SalesOrderDetail : BaseEntity
    {
        public string? SalesOrderDetailId { get; set; }
        public int SalesOrderId { get; set; }

        public int? ItemId { get; set; }
        public int? UomId { get; set; }
        public int? WarehouseId { get; set; }
        [NotMapped]
        public string? WarehouseName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string? ShadesName { get; set; }
        public bool? IsReturn { get; set; }
        

        [ForeignKey(nameof(SalesOrderId))]
        public SalesOrderMaster SalesOrderMaster { get; set; }
        public Item Item { get; set; }
        public Uom Uom { get; set; }
        public Warehouse Warehouse { get; set; }
    } 
}
