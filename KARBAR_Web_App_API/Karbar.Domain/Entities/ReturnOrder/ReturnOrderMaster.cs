using Karbar.Domain.Entities.SalesOrder;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities.ReturnOrder
{
    public class ReturnOrderMaster : BaseEntity
    {
        public string ReturnOrderId { get; set; }
        public string SalesInvoiceNo { get; set; }
        public DateTime SalesDate { get; set; } = DateTime.Now;
        public int? CustomerId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public string PaymentMethod { get; set; }
        public string MobileBankMethod { get; set; }
        public string PhoneNumber { get; set; }
        public int BankId { get; set; }
        public string CardNumber { get; set; }
        public int WarehouseId { get; set; }
        public int TenantId { get; set; }
        public string? Remarks { get; set; }
        public ICollection<ReturnOrderDetail> ReturnOrderDetails { get; set; }
        public Customer Customer { get; set; }
    }
}
