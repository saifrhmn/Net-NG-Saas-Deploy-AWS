using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class ExpenseInformation : BaseEntity
    {
        public string? ExpenseInfoId { get; set; }
        public DateTime EntryDate { get; set; }
        public DateTime ExpenseDate { get; set; }
        public int? ForWhom { get; set; }
        public Decimal? ExpenseAmount { get; set; }
        public string? ExpensePurpose { get; set; }
        public string? Remarks { get; set; }
        public int? TenantId { get; set; }
    }
}
