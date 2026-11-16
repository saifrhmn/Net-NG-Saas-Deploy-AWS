using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class ExpenseCategory : BaseEntity
    {
        public string ExpenseCategoryId { get; set; }
        public string ParentId { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
    }
}
