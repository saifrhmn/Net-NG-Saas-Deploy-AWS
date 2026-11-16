using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Domain.Enums;

namespace Karbar.Domain.Entities
{
    public class PurchaseOrderMaster : BaseEntity
    {
        public string PurchaseOrderId { get; set; }
        public string PurchaseInvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime RecievedDate { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        //public string PaymentMethod { get; set; }
        //public string MobileBankMethod { get; set; }
        //public string PhoneNumber { get; set; }
        //public int BankId { get; set; }
        //public string CardNumber { get; set; }
        public int WarehouseId { get; set; }
        public int TenantId { get; set; }
        public bool? IsReturn { get; set; }
        public ICollection<PurchaseOrderDetail> PurchaseDetails { get; set; }
        public PaymentStatusEnum PaymentStatus { get; set; }
        public decimal SubTotal { get; set; }
    }
}
