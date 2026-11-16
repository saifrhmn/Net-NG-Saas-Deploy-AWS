using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Karbar.Domain.Entities
{
    public class SapSalesData
    {
        [Key]
        public int Id { get; set; }
        public string? Client { get; set; }
        public string? CompanyCode { get; set; }
        public string? Division { get; set; }
        public string? SoldToParty { get; set; }
        public string? BillingDocument { get; set; }
        public DateTime? BillingDate { get; set; }
        public string? BusinessArea { get; set; }
        public string? CustomerAccountGroup { get; set; }
        public string? DistributionChannel { get; set; }
        public string? MaterialGroup { get; set; }
        public string? MaterialNumber { get; set; }
        public string? MaterialGroupDescription { get; set; }
        public string? SalesOrganization { get; set; }
        public string? SoldToPartyCode { get; set; }
        public string? PayerCode { get; set; }
        public string? EmployeeResponsible { get; set; }
        public string? SalesPerson { get; set; }
        public string? SalesOffice { get; set; }
        public string? SalesGroup { get; set; }
        public string? CustomerClassification { get; set; }
        public string? BillingItem { get; set; }
        public string? MaterialDescription { get; set; }
        public string? BaseUnitOfMeasure { get; set; }
        public string? VolumeUnit { get; set; }
        public string? RegionalMarket { get; set; }
        public string? RegionalStructureGrouping { get; set; }
        public string? CustomerName { get; set; }
        public string? DivisionText { get; set; }
        public string? InvoiceAmount { get; set; }
        public string? TaxAmount { get; set; }
        public string? SDAmount { get; set; }
        public string? GallonOrKG { get; set; }
        public string? ActualBilledQuantity { get; set; }
        public string? Volume { get; set; }

        public DateTime? EntryTime { get; set; }
        public string? CreditControlArea { get; set; }
        public DateTime? CreatedDate { get; set; }
        public bool? IsCustomerRecieved { get; set; }
    }
}
