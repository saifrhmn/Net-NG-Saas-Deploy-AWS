using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.StockItems
{
    public class StockRequest
    {
        public int ItemId { get; set; }

        public List<WarehouseRequest> Warehouse { get; set; } = new();
        public int TenantId { get; set; }
        public string? Remarks { get; set; }
    }
    public class WarehouseRequest
    {
        public int StockId { get; set; }
        public int WarehouseId { get; set; }
        public double Quantity { get; set; }
    }
}
