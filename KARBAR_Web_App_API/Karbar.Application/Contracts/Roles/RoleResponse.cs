using System;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Roles
{
    public class RoleResponse
    {
        public int Id { get; set; }
        public string RoleId { get; set; }
        public string Name { get; set; }
        public bool IsAdmin { get; set; }
        public StatusEnum Status { get; set; }

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
        public int TotalCount { get; set; }
    }
}
