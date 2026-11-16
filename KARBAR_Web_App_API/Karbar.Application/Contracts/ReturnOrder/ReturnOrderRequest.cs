using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.ReturnOrder
{
    public class ReturnOrderRequest
    {
        public int Id { get; set; }
        public string? SalesInvoiceNo { get; set; }
        public string ReturnOrderId { get; set; }
        public DateTime SalesDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public string? PaymentMethod { get; set; }
        public string? MobileBankMethod { get; set; }
        public string? PhoneNumber { get; set; }
        public int BankId { get; set; }
        public string? CardNumber { get; set; }
        public int WarehouseId { get; set; }
        public int TenantId { get; set; }
        public int? CustomerId { get; set; }
        public string? Remarks { get; set; }
        public List<ReturnOrderDetailRequest>? ReturnOrderDetails { get; set; }
    }

    public class ReturnOrderDetailRequest
    {
        public int Id { get; set; }
        public string ReturnOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public int UomId { get; set; }
        public int? WarehouseId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal ReturnTotalAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public bool IsReturn { get; set; }
    }
}
