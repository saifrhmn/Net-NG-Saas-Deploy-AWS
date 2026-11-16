using System;

namespace Karbar.Application.Contracts.Category
{
    public class CategoryRequest
    {
        public int Id { get; set; }
        public string CategoryId { get; set; }
        public string Name { get; set; }
        public string ParentCategoryId { get; set; }
        public int TenantId { get; set; }

        /// <summary>
        /// Integer value mapping to <see cref="Karbar.Domain.Enums.StatusEnum"/>
        /// (0 = Inactive, 1 = Active, 2 = Pending, 9 = Deleted)
        /// </summary>
        public int Status { get; set; }
    }
}