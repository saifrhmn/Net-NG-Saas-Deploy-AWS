using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class GetStockTransferReportResponse
    {
        public long SlNo { get; set; }

        public DateTime TransferDate { get; set; }

        public string TransferRefNo { get; set; }

        public string FromWarehouseName { get; set; }

        public string ToWarehouseName { get; set; }

        public string ItemCode { get; set; }

        public string ItemName { get; set; }

        public string Brand { get; set; }

        public decimal QtyTransferred { get; set; }

        public string Remarks { get; set; }

        public int TotalCount { get; set; }
    }
}
