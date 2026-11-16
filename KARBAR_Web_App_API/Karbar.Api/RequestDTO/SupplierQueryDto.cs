using Karbar.Domain.Enums;

namespace Karbar.Api.RequestDTO
{
    public class QueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public string? CategoryId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class TenantQueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public int? RoleId { get; set; }
        public string? CategoryId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class ExpenseQueryDto
    {
        public string? SearchText { get; set; }
        public int? TenantId { get; set; }
        public string? ExpenseCategoryId { get; set; }
        public string? CategoryId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class ItemQueryDto
    {
        public string SearchText { get; set; }
        public int TenantId { get; set; }
        public int? CategoryId { get; set; }
        public int? BrandId { get; set; }
        public bool? IsBergerItem { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class MaterialQueryDto
    {
        public string? SearchText { get; set; }
        public string? MaterialGroup { get; set; }
        // 1 = common item, 0 = not common, null = all
        public int? IsCommonItem { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class UserQueryDto
    {
        public string SearchText { get; set; }
        public int? TenantId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class OrderRequestQueryDto
    {
        public string SearchText { get; set; }
        public int TenantId { get; set; }
        public bool? IsBerger { get; set; }        
        public string? OrderStatus { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class SalesOrderQueryDto
    {
        public string? SearchText { get; set; }
        public bool? IsCustomerRecieved { get; set; }
        public int TenantId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class GetAllSalesOrderQueryDto
    {
        public string? SearchText { get; set; }
        public bool? IsCustomerRecieved { get; set; }
        public int TenantId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public bool? IsReturn { get; set; }
        public bool? IsDraft { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
    public class DashboardQueryDto
    {
        public int TenantId { get; set; }
    }
    public class PaymentQueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public int? UserType { get; set; }
        public int? UserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class GetTopSoldItemsReportDto
    {
        public int TenantId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? BrandId { get; set; }
        public int? CategoryId { get; set; }
        public int? Top { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
    public class ReturnOrderQueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class CustomerReceivablReportDto
    {
        public int TenantId { get; set; }
        public string? SearchText { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
    public class ProfitAndLossReportDto
    {
        public int TenantId { get; set; }

        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        public int? PageIndex { get; set; }

        public int? PageSize { get; set; }
    }
    public class StockTransferReportDto
    {
        public int TenantId { get; set; }

        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        //public int? FromWarehouseId { get; set; }

        //public int? ToWarehouseId { get; set; }

        //public int? ItemId { get; set; }

        //public string? TransferRefNo { get; set; }

        public int? PageIndex { get; set; }

        public int? PageSize { get; set; }
    }
    public class CustomerStatementReportDto
    {
        public int? TenantId { get; set; }

        public DateTime? FromDate { get; set; }

        public DateTime? ToDate { get; set; }

        public string? SearchText { get; set; }

        public int? PageIndex { get; set; }

        public int? PageSize { get; set; }
    }
    public class PurchaseReturnQueryDto
    {
        public string? SearchText { get; set; }
        public int TenantId { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int? SupplierId { get; set; }
        public int? WarehouseId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
    public class SlowMovingNonMovingDeadStockReportDto
    {
        public int? TenantId { get; set; }

        public int? PageIndex { get; set; }

        public int? PageSize { get; set; }
    }
    public class UserLoginAndInvoiceActivityReportDto
    {
        public int? TenantId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }

        public int? PageSize { get; set; }
    }
    public class InventoryValuationReportDto
    {
        public int TenantId { get; set; }
        public int? WarehouseId { get; set; }
        public string? SearchText { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
    }
}
