using System;

namespace Karbar.Application.Contracts.User
{
    public class UserRequest
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string? PhoneNumber { get; set; }
        public string Password { get; set; }
        public int TenantId { get; set; }
        public int? ParentTenantId { get; set; }
        public int RoleId { get; set; }
        public int Status { get; set; }
        public string? ImageBase64 { get; set; }
        public string? SignatureImageBase64 { get; set; }
        public string? TenantCustomerNo { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? RawPassword { get; set; }
    }

    public class UserResetPasswordRequest
    {
        public string PhoneNumber { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
        public string RawPassword { get; set; }
    }

}