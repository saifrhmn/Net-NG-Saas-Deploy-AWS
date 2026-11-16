using Karbar.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.Tenant
{
    public class TenantResponse
    {
        public int Id { get; set; }
        public string TenantId { get; set; }
        public string Name { get; set; }
        public string Contact { get; set; }
        public string Email { get; set; }
        public string TenantCustomerNo { get; set; }
        public string Domain { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public StatusEnum Status { get; set; }
        public int TotalCount { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? Phone { get; set; }
        public string? DepotCode { get; set; }
    }
}
