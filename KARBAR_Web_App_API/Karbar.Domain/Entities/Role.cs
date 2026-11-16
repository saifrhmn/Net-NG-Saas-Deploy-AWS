using Karbar.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace Karbar.Domain.Entities;

public class Role : IdentityRole<int>
{
    public string RoleId { get; set; }
    public string Name { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime? CreatedDate { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? UpdatedDate { get; set; }
    public string UpdatedBy { get; set; }
    public StatusEnum Status { get; set; }
}
