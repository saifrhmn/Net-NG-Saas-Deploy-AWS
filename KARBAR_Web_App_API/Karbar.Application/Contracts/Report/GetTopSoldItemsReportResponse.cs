using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetTopSoldItemsReportResponse
    {
        public int  SlNo { get; set; }
        public string ItemCode { get; set; }
        public string ItemName { get; set; }
        public int BrandId { get; set; }
        public string Brand { get; set; }
        public int TotalQuantitySold { get; set; }
        public decimal TotalSalesValue { get; set; }
        public int Rank { get; set; }
        public int TotalCount { get; set; }
    }
}
