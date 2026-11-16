using System;
using Karbar.Domain.Enums;

namespace Karbar.Application.Contracts.Warehouse
{
    public class WarehouseResponse
    {
        public int Id { get; set; }
        public string WarehouseId { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public int TenantId { get; set; }
        public string TenantName { get; set; }

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
