using System;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Customer
{
    public class CustomerResponse
    {
        public int Id { get; set; }
        public string CustomerId { get; set; }
        public string Name { get; set; }
        public string Contact { get; set; }
        public string Address { get; set; }
        public int TenantId { get; set; }
        public string TenantName { get; set; }
        public StatusEnum Status { get; set; }
        public decimal? TotalDueAmount { get; set; }
        public string? CustomerCategory { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? Phone { get; set; }
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

        // audit fields from BaseEntity
        public DateTime? CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }
    }
}