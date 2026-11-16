using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class Warehouse : BaseEntity
    {
        public string WarehouseId { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public int TenantId { get; set; }
        public ICollection<PurchaseOrderDetail> PurchaseOrderDetail { get; set; } = new List<PurchaseOrderDetail>();
    }
}
