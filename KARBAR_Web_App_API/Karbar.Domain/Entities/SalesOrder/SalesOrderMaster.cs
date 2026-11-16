using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Domain.Enums;

namespace Karbar.Domain.Entities.SalesOrder
{
    public class SalesOrderMaster : BaseEntity
    {
        public string SalesOrderId { get; set; }
        public string InvoiceNo { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.Now;
        public int? CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public string? Remarks { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? DueAmount { get; set; }

        public PaymentMethodEnum? PaymentMethod { get; set; }
        public int WarehouseId { get; set; }
        public int TenantId { get; set; }
        public ICollection<SalesOrderDetail> SalesOrderDetails { get; set; }
        public Customer Customer { get; set; }
        public PaymentStatusEnum PaymentStatus { get; set; }
        public decimal SubTotal { get; set; }
        public decimal? DeliveryCharge { get; set; }
        
        public bool? IsReturn { get; set; }
        public bool? IsDraft { get; set; }
    }
}
