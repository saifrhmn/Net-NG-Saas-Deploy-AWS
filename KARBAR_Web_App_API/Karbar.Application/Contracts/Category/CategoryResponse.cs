using System;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Category
{
    public class CategoryResponse
    {
        public int Id { get; set; }
        public string CategoryId { get; set; }
        public string Name { get; set; }
        public string ParentCategoryId { get; set; }
        public string ParentCategoryName { get; set; }
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

        // audit fields
        public DateTime? CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }
    }
}