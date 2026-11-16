using Karbar.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.SalesOrder
{
    public class SalesOrderResponse
    {
        public int Id { get; set; }
        public string InvoiceNo { get; set; } = default!;
        public string SalesOrderId { get; set; }
        public string? OrderDate { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal SubTotal { get; set; }
        public decimal? DeliveryCharge { get; set; }
        public decimal DiscountAmount { get; set; }

        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? DueAmount { get; set; }
        public string? PaymentMethod { get; set; }
        public string MobileBankMethod { get; set; }
        public int BankId { get; set; }
        public string CardNumber { get; set; }
        public int TenantId { get; set; }
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhone { get; set; }
        public string? CustomerAddress { get; set; }
        public bool? IsReturn { get; set; }
        public bool? IsDraft { get; set; }
        public string? Remarks { get; set; }
        public decimal? TotalReturnQuantity { get; set; }
        public decimal? TotalReturnAmount { get; set; }
        public List<SalesOrderDetailResponse> SalesOrderDetails { get; set; } = new ();
    }
    public class SalesOrderDetailResponse
    {
        public int Id { get; set; }
        public string? SalesOrderDetailId { get; set; }
        public int? ItemId { get; set; }
        public string ItemName { get; set; } 

        public int? UomId { get; set; }
        public string UomName { get; set; } 

        public int? WarehouseId { get; set; }
        public string WarehouseName { get; set; }
        public int? SupplierId { get; set; }
        public string SupplierName { get; set; } 

        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? ReturnQuantity { get; set; }
        public decimal? ActualSalesQuantity { get; set; }
        public decimal? ReturnTotalAmount { get; set; }
        public string? ShadesName { get; set; }
        public bool? IsReturn { get; set; }

    }

    public class SapSalesDataResponse
    {
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
        public int? ItemId { get; set; }
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
        public int? TotalCount { get; set; }
    }

    public class SapSalesMasterResponse
    {
        public string? SoldToParty { get; set; }
        public string? BillingDocument { get; set; }
        public DateTime? BillingDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public int? TotalCount { get; set; }
        public List<SapSalesDetailResponse> SapSalesDetails { get; set; } = new();
    }
    public class SapSalesDetailResponse
    {
        public int? ItemId { get; set; }
        public string? MaterialGroup { get; set; }
        public string? MaterialNumber { get; set; }
        public string? MaterialGroupDescription { get; set; }
        public string? SoldToPartyCode { get; set; }
        public string? BillingItem { get; set; }
        public string? MaterialDescription { get; set; }
        public string? InvoiceAmount { get; set; }
        public string? TaxAmount { get; set; }
        public string? ActualBilledQuantity { get; set; }
    }

}
