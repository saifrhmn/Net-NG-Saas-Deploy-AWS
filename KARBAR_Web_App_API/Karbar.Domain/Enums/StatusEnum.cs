using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Enums
{
    public enum StatusEnum
    {
        Inactive = 0,
        Active = 1,
        Pending = 2,
        Deleted = 9
    }

    public enum PaymentStatusEnum
    {
        Due = 0,
        Paid = 1
    }
}
