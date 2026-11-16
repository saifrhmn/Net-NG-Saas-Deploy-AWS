using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.PurchaseOrder
{
    public class PurchaseOrderRequest
    {
        public int Id { get; set; }
        public string? PurchaseInvoiceNo { get; set; }
        public string? PurchaseOrderId { get; set; }
        public DateTime PurchaseDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public int? PaymentMethod { get; set; }
        public int? MobileBankMethod { get; set; }
        public string PhoneNumber { get; set; }
        //public int BankId { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        //public string CardNumber { get; set; }
        public int TenantId { get; set; }

        public List<PurchaseOrderDetailRequest>? PurchaseDetails { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal ReturnAmount { get; set; }
        public decimal SubTotal { get; set; }
    }

    public class PurchaseOrderDetailRequest
    {
        public int Id { get; set; }
        public string PurchaseOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public int UomId { get; set; }
        public int WarehouseId { get; set; }
        public int SupplierId { get; set; }

        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
    }

}
