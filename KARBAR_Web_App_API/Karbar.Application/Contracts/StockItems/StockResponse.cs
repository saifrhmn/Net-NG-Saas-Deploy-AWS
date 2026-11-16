using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.StockItems
{
    public class StockResponse
    {
        public int Id { get; set; }
        public string StockId { get; set; }
        public double Quantity { get; set; }
        public int ItemId { get; set; }
        public string? ItemName { get; set; }
        public int WarehouseId { get; set; }
        public string? WarehouseName { get; set; }
        public int TenantId { get; set; }
        public int TotalCount { get; set; }
    }
}
