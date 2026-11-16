namespace Karbar.Application.Contracts.Report
{
    public class RequestOrderReportResponse
    {
        public string? Warehouse { get; set; }

        public string? PurchaseInvoiceNo { get; set; }
        public DateTime? InvoiceDate { get; set; }

        public string? MaterialNumber { get; set; }
        public string? ItemName { get; set; }

        public string? Brand { get; set; }
        public string? Category { get; set; }

        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalAmount { get; set; }   // Gross Sales

        public decimal? DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Vat { get; set; }

        public string? SupplierName { get; set; }

        public decimal NetPurchase
        {
            get
            {
                decimal total = TotalAmount ?? 0;
                decimal discount = DiscountAmount ?? 0;
                return total > 0 
                    ? total - discount 
                    : 0;
            }
        }

        public decimal TotalInvoiceAmount
        {
            get
            {
                decimal tax = ((Tax ?? 0) * NetPurchase) / 100;
                decimal vat = ((Vat ?? 0) * NetPurchase) / 100;
                return NetPurchase > 0
                    ? NetPurchase + tax + vat
                    : 0;
            }
        }

        public string? Tenant { get; set; }

        public int TotalCount { get; set; }
    }
}
