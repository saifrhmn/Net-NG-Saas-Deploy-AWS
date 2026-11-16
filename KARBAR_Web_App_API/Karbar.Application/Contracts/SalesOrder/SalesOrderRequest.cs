using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.SalesOrder
{
    public class SalesOrderRequest
    {
        public int Id { get; set; }
        public string? InvoiceNo { get; set; }
        public string SalesOrderId { get; set; }
        public DateTime SalesOrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal SubTotal { get; set; }
        public decimal? DeliveryCharge { get; set; }
        public int? PaymentMethod { get; set; }
        public int? MobileBankMethod { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? Remarks { get; set; }
        public int TenantId { get; set; }
        public int CustomerId { get; set; }
        public bool? IsReturn { get; set; }
        public bool? IsDraft { get; set; }
        public List<SalesOrderDetailRequest> SalesOrderDetails { get; set; } 
    }
    public class SalesOrderDetailRequest
    {
        public int Id { get; set; }
        public string? SalesOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public int UomId { get; set; }
        public int WarehouseId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public string? ShadesName { get; set; }
        public bool? IsReturn { get; set; }
    }
}
