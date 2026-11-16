using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class Category : BaseEntity
    {
        public string CategoryId { get; set; }
        public string Name { get; set; }
        public string ParentCategoryId { get; set; }
        public string? MaterialGroupId { get; set; }
        public string? MaterialGroupLongDescription { get; set; }
        public int TenantId { get; set; }
    }
}
