using Karbar.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Karbar.Domain.Entities
{
    public class User : IdentityUser<int>
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ImagePath { get; set; }
        public string? Department { get; set; }
        public string? Designation { get; set; }
        public string? PasswordHash { get; set; }
        public int RoleId { get; set; }
        public int TenantId { get; set; }
        public int? ParentTenantId { get; set; }

        public DateTime? CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }
        public StatusEnum Status { get; set; }
        public string? ImageUrl { get; set; }
        public string? SignatureImageUrl { get; set; }
        public string? RawPassword { get; set; }
    }
}
