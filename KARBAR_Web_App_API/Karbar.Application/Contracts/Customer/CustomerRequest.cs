using System;

namespace Karbar.Application.Contracts.Customer
{
    public class CustomerRequest
    {
        public int Id { get; set; }
        public string CustomerId { get; set; }
        public string Name { get; set; }
        public string Contact { get; set; }
        public string Address { get; set; }
        public int TenantId { get; set; }
        public string? CustomerCategory { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? Phone { get; set; }
        /// <summary>
        /// Integer value mapping to <see cref="Karbar.Domain.Enums.StatusEnum"/>
        /// (0 = Inactive, 1 = Active, 2 = Pending, 9 = Deleted)
        /// </summary>
        public int Status { get; set; }
    }
}