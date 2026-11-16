using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class ReturnOrderReportResponse
    {
        public string? Warehouse { get; set; }

        public string? ReturnOrderId { get; set; }
        public string? SalesInvoiceNo { get; set; }
        public DateTime? ReturnDate { get; set; }

        public string? MaterialNumber { get; set; }
        public string? ItemName { get; set; }

        public string? Brand { get; set; }
        public string? Category { get; set; }

        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalAmount { get; set; }   // Gross Return

        public decimal? DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Vat { get; set; }

        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }

        public decimal NetReturn
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

        public decimal TotalReturnAmount
        {
            get
            {
                decimal tax = ((Tax ?? 0) * NetReturn) / 100;
                decimal vat = ((Vat ?? 0) * NetReturn) / 100;
                return NetReturn > 0
                    ? NetReturn + tax + vat
                    : 0;
            }
        }

        public string? Tenant { get; set; }

        public int TotalCount { get; set; }
    }
}
