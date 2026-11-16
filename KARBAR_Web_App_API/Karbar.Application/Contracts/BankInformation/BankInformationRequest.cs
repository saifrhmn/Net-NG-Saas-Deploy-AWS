using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.BankInformation
{
    public class BankInformationRequest
    {
        public int? Id { get; set; }

        public string AccountName { get; set; } = default!;
        public string AccountNumber { get; set; } = default!;
        public string BankName { get; set; } = default!;
        public string BranchName { get; set; } = default!;
        public int? TenantId { get; set; }
    }
}
