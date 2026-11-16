using System;

namespace Karbar.Application.Contracts.Brand
{
    public class BrandRequest
    {
        public int Id { get; set; }
        public string BrandId { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
        public int Status { get; set; }
    }
}