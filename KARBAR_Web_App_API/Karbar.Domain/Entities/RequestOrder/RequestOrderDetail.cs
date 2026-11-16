using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.RequestOrder
{
    public class RequestOrderDetail : BaseEntity
    {
        public string RequestOrderDetailId { get; set; }
        public int? ItemId { get; set; }
        public int? UomId { get; set; }
        public int? WarehouseId { get; set; }
        public int? SupplierId { get; set; }
        public int? RequestOrderMasterId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public RequestOrderMaster RequestOrderMaster { get; set; }
        public Item Item { get; set; }
        public Uom Uom { get; set; }
        public Warehouse Warehouse { get; set; }
        public Supplier Supplier { get; set; }
    }
}
