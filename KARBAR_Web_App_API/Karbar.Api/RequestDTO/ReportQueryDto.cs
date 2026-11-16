namespace Karbar.Api.RequestDTO
{
    public class ItemStockReportQuery
    {
        public int? TenantId { get; set; }
        public int? ItemId { get; set; }
        public int? BrandId { get; set; }
        public int? CategoryId { get; set; }
        public int? WarehouseId { get; set; }
        public string MaterialNo { get; set; }
        public string ItemName { get; set; }
        public string FromDate { get; set; }
        public string ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class InventoryMovementQuery
    {
        public int? TenantId { get; set; }
        public string? FromDate { get; set; }
        public string? ToDate { get; set; }
        public int? Month { get; set; }
        public int? Year { get; set; }
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public string? ItemName { get; set; }
    }
    public class SalesReportQuery
    {
        public int? TenantId { get; set; }
        public int? ItemId { get; set; }
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public int? WarehouseId { get; set; }
        public string? SearchText { get; set; }   // InvoiceNo / Material / Item / Customer Name / Phone
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class ReturnOrderReportQuery
    {
        public string? SearchText { get; set; }
        public int? TenantId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
    public class PaymentCollectionReportQuery
    {
        public int? TenantId { get; set; }
        public string FromDate { get; set; }
        public string ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public string? SearchText { get; set; }
        /// <summary>1 = Customer (default), 2 = Supplier</summary>
        public int? PartyType { get; set; }
    }

    public class GetDatewiseSupplierStatementReport
    {
        public int TenantId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        public string? SearchText { get; set; }

        public int PageIndex { get; set; }
        public int PageSize { get; set; }
    }
    public class GetDatewiseSupplierPaybleReportQuery
    {
        public int TenantId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SearchText { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
    }
    public class PurchaseReportQuery
    {
        public int? TenantId { get; set; }
        public int? ItemId { get; set; }
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public int? WarehouseId { get; set; }
        public string InvoiceNo { get; set; }
        public string FromDate { get; set; }
        public string ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public string? SearchMaterial { get; set; }
        public int? SupplierType { get; set; }
    }
}