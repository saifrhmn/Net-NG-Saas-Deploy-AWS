using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Invoice
{
    public class LastThreeInvoiceAverageResponse
    {
        public string DealerCode { get; set; }
        public string MaterialCode { get; set; }
        public decimal AverageInvoiceValue { get; set; }
    }
}
