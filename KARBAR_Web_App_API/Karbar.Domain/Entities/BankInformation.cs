using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class BankInformation : BaseEntity
    {
        public string BankInfoId { get; set; }
        public string AccountName { get; set; }     
        public string AccountNumber { get; set; }   
        public string BankName { get; set; }        
        public string BranchName { get; set; }
        public int? TenantId { get; set; }
    }

}
