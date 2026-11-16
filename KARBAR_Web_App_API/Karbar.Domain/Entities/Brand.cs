using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class Brand : BaseEntity
    {
        public string BrandId { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
    }
}
