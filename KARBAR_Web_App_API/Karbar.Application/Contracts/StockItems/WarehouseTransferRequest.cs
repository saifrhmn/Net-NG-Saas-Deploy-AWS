using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.StockItems
{
    public class WarehouseTransferRequest
    {
        public int ItemId { get; set; }
        public int FromWarehouseId { get; set; }
        public decimal ChangedQty { get; set; }
        public int ToWarehouseId { get; set; }
        public int TenantId { get; set; }
        public string? Remarks { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedTime { get; set; }
    }
}
