using System;

namespace Karbar.Application.Contracts.Warehouse
{
    public class WarehouseRequest
    {
        public int Id { get; set; }
        public string WarehouseId { get; set; }
        public string Name { get; set; }
        public string Location { get; set; }
        public int TenantId { get; set; }
        public int Status { get; set; }
    }
}
