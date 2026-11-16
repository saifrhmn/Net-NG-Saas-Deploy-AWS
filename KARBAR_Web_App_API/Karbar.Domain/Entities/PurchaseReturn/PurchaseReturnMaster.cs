using Karbar.Domain.Entities.PurchaseReturn;
using System;
using System.Collections.Generic;

namespace Karbar.Domain.Entities.PurchaseReturn
{
    public class PurchaseReturnMaster : BaseEntity
    {
        public string PurchaseReturnId { get; set; }
        public string PurchaseInvoiceNo { get; set; }
        public DateTime PurchaseDate { get; set; } = DateTime.Now;
        public int? SupplierId { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Vat { get; set; }
        public string? PaymentMethod { get; set; }
        public string? MobileBankMethod { get; set; }
        public string? PhoneNumber { get; set; }
        public int? BankId { get; set; }
        public string? CardNumber { get; set; }
        public int? WarehouseId { get; set; }
        public int? TenantId { get; set; }
        public string? Remarks { get; set; }
        public ICollection<PurchaseReturnDetail> PurchaseReturnDetails { get; set; }
        public Supplier Supplier { get; set; }
    }
}