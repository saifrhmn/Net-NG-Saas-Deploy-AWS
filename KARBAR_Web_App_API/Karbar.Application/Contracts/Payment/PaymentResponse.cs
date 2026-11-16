using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Payment
{
    public class PaymentResponse
    {
        public int? Id { get; set; }
        public int? TenantId { get; set; }

        public UserTypeEnum UserType { get; set; }
        public string UserTypeName
        {
            get
            {
                return UserType.ToString();
            }
        }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public string UserPhone { get; set; }
        public string UserAddress { get; set; }
        public PaymentMethodEnum PaymentMethod { get; set; }
        public string PaymentMethodName
        {
            get
            {
                return PaymentMethod.ToString();
            }
        }
        public int PaymentType { get; set; }    // 1 = Purchase, 2 = Sales
        public string PaymentTypeName
        {
            get
            {
                return PaymentType switch
                {
                    1 => "Purchase",
                    2 => "Sales",
                    _ => ""
                };
            }
        }
        public int OrderId { get; set; }    // Refers to RequestOrderMaster / PurchaseOrderMaster Id or SalesOrder Id based on PaymentType
        public string OrderInvoiceNo { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public MobileBankMethodEnum? MobileBankMethod { get; set; }
        public string MobileBankMethodName
        {
            get
            {
                return MobileBankMethod.HasValue ? MobileBankMethod.Value.ToString() : "";
            }
        }
        public string? PhoneNumber { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public bool IsBerger { get; set; }
        public DateTime? CreatedDate { get; set; }
        public int TotalCount { get; set; }
    }
}
