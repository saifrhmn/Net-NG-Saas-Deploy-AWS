namespace Karbar.Domain.Entities
{
    public class Material
    {
        public short? Id { get; set; }
        public short? Client { get; set; }
        public short? ValuationArea { get; set; }
        public string? MaterialNumber { get; set; }
        public string? MaterialDescription { get; set; }
        public string? MaterialGroup { get; set; }
        public string? MaterialGroupDescription { get; set; }
        public string? MaterialGroupLongDescription { get; set; }
        public string? MaterialType { get; set; }
        public string? BaseUnitOfMeasure { get; set; }
        public string? SizeOrPackSize { get; set; }
        public double? Volume { get; set; }
        public string? VolumeUnit { get; set; }
        public int? MRP { get; set; }
        public double? DiscountAmount { get; set; }
        public double? MovingAveragePrice { get; set; }
        public double? StandardPrice { get; set; }
        public string? LastChangedDate { get; set; }
        public string? FreightGroup { get; set; }
        public int? Status { get; set; }
        public int? IsCommonItem { get; set; }
    }
}
