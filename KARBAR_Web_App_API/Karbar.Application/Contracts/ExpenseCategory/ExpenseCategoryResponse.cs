using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.ExpenseCategory
{
    public class ExpenseCategoryResponse
    {
        public int Id { get; set; }
        public string ExpenseCategoryId { get; set; }
        public string ParentId { get; set; }
        public string ParentCategoryName { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
        public string TenantName { get; set; }
        public StatusEnum Status { get; set; }
        public string StatusDescription
        {
            get
            {
                return Status switch
                {
                    StatusEnum.Inactive => "Inactive",
                    StatusEnum.Active => "Active",
                    StatusEnum.Pending => "Pending",
                    StatusEnum.Deleted => "Deleted",
                    _ => string.Empty
                };
            }
        }

        // list metadata
        public int TotalCount { get; set; }
        public DateTime? CreatedDate { get; set; }
    }
}
