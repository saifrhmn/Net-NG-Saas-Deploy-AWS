using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Domain.Enums;

namespace Karbar.Domain.Entities.RequestOrder
{
    public class RequestOrderMaster : BaseEntity
    {
        public string PurchaseOrderId { get; set; }
        public string PurchaseInvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        //public string PaymentMethod { get; set; }
        //public string MobileBankMethod { get; set; }
        //public string PhoneNumber { get; set; }
        //public int BankId { get; set; }
        //public string CardNumber { get; set; }
        public int TenantId { get; set; }
        public bool? IsBerger { get; set; }
        public string? OrderStatus { get; set; }
        public DateTime? ReceivedDate { get; set; }
        public ICollection<RequestOrderDetail> RequestOrderDetails { get; set; }
        public PaymentStatusEnum PaymentStatus { get; set; }
        public Tenant Tenant { get; set; }
    }

}
