using System;

namespace Karbar.Application.Contracts.Supplier
{
    public class SupplierRequest
    {
        public int Id { get; set; }
        public string SupplierId { get; set; }
        public string Name { get; set; }
        public string Contact { get; set; }
        public string? PhoneNo { get; set; }
        public string? Email { get; set; }
        public string Address { get; set; }
        public int TenantId { get; set; }

        /// <summary>
        /// Integer value mapping to <see cref="Karbar.Domain.Enums.StatusEnum"/>
        /// (0 = Inactive, 1 = Active, 2 = Pending, 9 = Deleted)
        /// </summary>
        public int Status { get; set; }
    }
}