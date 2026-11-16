using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Report
{
    public class UserLoginAndInvoiceActivityReportResponse
    {
        public string? UserName { get; set; }

        public string? UserRole { get; set; }

        public string? DealerName { get; set; }

        public string? DepotCode { get; set; }

        public DateOnly? LoginDate { get; set; }

        public TimeOnly? LoginTime { get; set; }

        public DateOnly? LogoutDate { get; set; }

        public TimeOnly? LogoutTime { get; set; }

        public TimeOnly? LastActivity { get; set; }

        public int NoOfInvoices { get; set; }

        public decimal InvoiceValue { get; set; }
    }
    
}
