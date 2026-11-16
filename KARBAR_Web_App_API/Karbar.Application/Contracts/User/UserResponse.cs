using System;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.User
{
    public class UserResponse
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        //public string Name { get; set; }
        //public string Email { get; set; }
        public string PhoneNumber { get; set; }
        //public string? ImagePath { get; set; }
        //public string? Department { get; set; }
        //public string? Designation { get; set; }
        public int RoleId { get; set; }
        public string RoleName { get; set; }

        public int TenantId { get; set; }
        public string? ImageUrl { get; set; }
        public string? SignatureImageUrl { get; set; }
        public string? TenantCustomerNo { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? RawPassword { get; set; }
        public StatusEnum Status { get; set; }

        //public string StatusDescription
        //{
        //    get
        //    {
        //        return Status switch
        //        {
        //            StatusEnum.Inactive => "Inactive",
        //            StatusEnum.Active => "Active",
        //            StatusEnum.Pending => "Pending",
        //            StatusEnum.Deleted => "Deleted",
        //            _ => string.Empty
        //        };
        //    }
        //}

        // list metadata (used by GetAll endpoints)
        public int TotalCount { get; set; }

        // audit fields
        //public DateTime? CreatedDate { get; set; }
        //public string CreatedBy { get; set; }
        //public DateTime? UpdatedDate { get; set; }
        //public string UpdatedBy { get; set; }
    }
}