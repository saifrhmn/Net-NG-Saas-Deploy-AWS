using Karbar.Domain.Enums;

namespace Karbar.Domain.Entities.Payment
{
    public class Payment : BaseEntity
    {
        public UserTypeEnum UserType { get; set; }
        public int UserId { get; set; }
        public PaymentMethodEnum? PaymentMethod { get; set; }
        public int PaymentType { get; set; }    // 1 = Purchase, 2 = Sales
        public int OrderId { get; set; }        // Refers to RequestOrderMaster / PurchaseOrderMaster Id or SalesOrder Id based on PaymentType
        public string OrderInvoiceNo { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public MobileBankMethodEnum? MobileBankMethod { get; set; }
        public string? PhoneNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public bool IsBerger { get; set; }
        public int TenantId { get; set; }
    }
}
