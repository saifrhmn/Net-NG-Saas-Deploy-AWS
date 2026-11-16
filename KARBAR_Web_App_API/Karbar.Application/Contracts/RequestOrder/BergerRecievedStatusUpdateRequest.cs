using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.RequestOrder
{
    public class BergerRecievedStatusUpdateRequest
    {
        public string InvoiceNo { get; set; }
        public string? BergerRecievedStatus { get; set; }
    }
}
