using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.StockItems
{
    public class StockResponseByWharehouse
    {
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string? MaterialCode { get; set; }
        public List<WarehouseStockResponse> Warehouse { get; set; } = new();
        public int? LowStock { get; set; }
        public int TotalCount { get; set; }
    }

    public class WarehouseStockResponse
    {
        public int StockId { get; set; }
        public int WarehouseId { get; set; }
        public string Warehouse { get; set; }
        public decimal ItemQty { get; set; }
        public int? TenantId { get; set; }
    }

}
