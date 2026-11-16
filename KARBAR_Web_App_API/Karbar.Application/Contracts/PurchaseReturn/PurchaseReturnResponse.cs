using System;
using System.Collections.Generic;

namespace Karbar.Application.Contracts.PurchaseReturn
{
    public class PurchaseReturnResponse
    {
        public int Id { get; set; }
        public string PurchaseReturnId { get; set; }
        public string PurchaseInvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; }
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
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
        public string? WarehouseName { get; set; }
        public int TenantId { get; set; }
        public string? Remarks { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string? UpdatedBy { get; set; }
        public List<PurchaseReturnDetailResponse> PurchaseReturnDetails { get; set; } = new();
    }

    public class PurchaseReturnDetailResponse
    {
        public int Id { get; set; }
        public string PurchaseReturnDetailId { get; set; }
        public int PurchaseReturnId { get; set; }
        public int? ItemId { get; set; }
        public string? ItemName { get; set; }
        public string? ItemCode { get; set; }
        public int? UomId { get; set; }
        public string? UomName { get; set; }
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public int? WarehouseId { get; set; }
        public string? WarehouseName { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime CreatedDate { get; set; }
        public string? CreatedBy { get; set; }
    }

}