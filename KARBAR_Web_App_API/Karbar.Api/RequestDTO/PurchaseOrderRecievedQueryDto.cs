using System;

namespace Karbar.Api.RequestDTO
{
    public class PurchaseOrderRecievedQueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public bool? IsCompleted { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
}
