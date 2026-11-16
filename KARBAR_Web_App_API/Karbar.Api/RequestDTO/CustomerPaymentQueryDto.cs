namespace Karbar.Api.RequestDTO
{
    public class CustomerPaymentQueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public int? CustomerId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
}