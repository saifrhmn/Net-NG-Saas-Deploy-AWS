using Karbar.Domain.Entities.RequestOrder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.PurchaseOrderRecieved
{
    public class PurchaseOrderRecievedMaster : BaseEntity
    {
        public string? RecievedOrderId { get; set; }
        public string? RecievedNo { get; set; }
        public decimal? PaidAmount { get; set; }
        public DateTime? RecievedDate { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? BergerTotalPurchaseAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Vat { get; set; }
        public string? RequestOrderNo { get; set; }
        public int TenantId { get; set; }
        public ICollection<PurchaseOrderRecievedDetail> PurchaseOrderDetails { get; set; } 
    }
}
