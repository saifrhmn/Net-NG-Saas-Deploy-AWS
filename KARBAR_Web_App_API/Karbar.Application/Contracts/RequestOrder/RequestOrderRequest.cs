using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.RequestOrder
{
    public class RequestOrderRequest
    {
        public int Id { get; set; }
        public string? OrderNo { get; set; }
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

        public List<RequestOrderDetailRequest>? RequestOrderDetails { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
    }

    public class RequestOrderDetailRequest
    {
        public int Id { get; set; }
        public string PurchaseOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public string? ItemName { get; set; }
        public string? MaterialNumber { get; set; }
        public int UomId { get; set; }
        public string? UomName { get; set; }
        public int WarehouseId { get; set; }
        public int SupplierId { get; set; }

        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
    }
}
