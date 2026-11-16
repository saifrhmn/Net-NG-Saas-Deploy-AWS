using System;

namespace Karbar.Application.Contracts.Roles
{
    public class RoleRequest
    {
        public int Id { get; set; }
        public string RoleId { get; set; }
        public string Name { get; set; }
        public bool IsAdmin { get; set; }
        public int Status { get; set; }
    }
}
