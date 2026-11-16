using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class Stock : BaseEntity
    {
        public string StockId { get; set; }
        public decimal Quantity { get; set; }
        public int ItemId { get; set; }
        public int WarehouseId { get; set; }
        public int? TenantId { get; set; }
        public Item Item { get; set; }
        public string? Remarks { get; set; }
        public Warehouse Warehouse { get; set; }
    }
}
