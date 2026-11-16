using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class Supplier : BaseEntity
    {
        public string SupplierId { get; set; }
        public string Name { get; set; }
        public string Contact { get; set; }
        public string Address { get; set; }
        public int TenantId { get; set; }
        public string PhoneNo { get; set; }
        public string Email { get; set; }
        public ICollection<PurchaseOrderDetail> PurchaseOrderDetail { get; set; } = new List<PurchaseOrderDetail>();
    }
}
