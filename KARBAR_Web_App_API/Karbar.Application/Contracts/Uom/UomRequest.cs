using System;

namespace Karbar.Application.Contracts.Uom
{
    public class UomRequest
    {
        public int Id { get; set; }
        public string UomId { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
        public int Status { get; set; }
    }
}