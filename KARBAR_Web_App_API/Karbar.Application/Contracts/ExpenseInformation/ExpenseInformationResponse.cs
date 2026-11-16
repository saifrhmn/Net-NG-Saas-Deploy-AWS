using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.ExpenseInformation
{
    public class ExpenseInformationResponse
    {
        public int Id { get; set; }
        public DateTime EntryDate { get; set; }
        public DateTime ExpenseDate { get; set; }
        public int? ForWhom { get; set; }
        public decimal? ExpenseAmount { get; set; }
        public string? ExpensePurpose { get; set; }
        public string? Remarks { get; set; }
        public int? TenantId { get; set; }
        public int TotalCount { get; set; }
        public string CategoryName { get; set; }
        public string SubCategoryName { get; set; }
    }
}
