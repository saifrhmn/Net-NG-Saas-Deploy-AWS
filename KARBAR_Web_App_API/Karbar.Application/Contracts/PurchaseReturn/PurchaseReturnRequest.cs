using System;
using System.Collections.Generic;

namespace Karbar.Application.Contracts.PurchaseReturn
{
    public class PurchaseReturnRequest
    {
        public string? PurchaseReturnId { get; set; }
        public string? PurchaseInvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; }
        public int? SupplierId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public string? PaymentMethod { get; set; }
        public string? MobileBankMethod { get; set; }
        public string? PhoneNumber { get; set; }
        public int? BankId { get; set; }
        public string? CardNumber { get; set; }
        public int WarehouseId { get; set; }
        public int TenantId { get; set; }
        public string? Remarks { get; set; }
        public bool? IsReturn { get; set; }
        public List<PurchaseReturnDetailRequest> PurchaseReturnDetails { get; set; } = new();
    }

    public class PurchaseReturnDetailRequest
    {
        public int? Id { get; set; }
        public string? PurchaseReturnDetailId { get; set; }
        public int ItemId { get; set; }
        public int UomId { get; set; }
        public int? WarehouseId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public bool? IsReturn { get; set; }
    }
}