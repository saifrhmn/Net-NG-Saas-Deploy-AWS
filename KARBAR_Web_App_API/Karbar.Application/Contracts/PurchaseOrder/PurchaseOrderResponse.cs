using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.PurchaseOrder
{
    public class PurchaseOrderResponse
    {
        public int Id { get; set; }
        public string PurchaseInvoiceNo { get; set; }
        public string PurchaseOrderId { get; set; }
        public string PurchaseDate { get; set; }
        public DateTime RecievedDate { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }

        public decimal Tax { get; set; }
        public decimal Vat { get; set; }
        public string PaymentMethod { get; set; }
        public string MobileBankMethod { get; set; }
        public string PhoneNumber { get; set; }
        public string BankName { get; set; }
        public string CardNumber { get; set; }
        public int TenantId { get; set; }

        public List<PurchaseOrderDetailResponse> PurchaseDetails { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal SubTotal { get; set; }
    }

    public class PurchaseOrderDetailResponse
    {
        public int Id { get; set; }
        public string PurchaseOrderDetailId { get; set; }
        public int? ItemId { get; set; }
        public string ItemName { get; set; } // Populate via join if needed

        public int? UomId { get; set; }
        public string UomName { get; set; } // Optional - join to UOM table

        public int? WarehouseId { get; set; }
        public int? SupplierId { get; set; }
        public string SupplierName { get; set; } // Optional - join to Supplier table

        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }

        public decimal Tax { get; set; }
        public decimal Vat { get; set; }

        public DateTime PurchaseDate { get; set; }
        public DateTime RecievedDate { get; set; }
        public bool? IsReturn { get; set; }
        public decimal? WeightedAveragePrice { get; set; }
        public DateTime? WeightedAveragePriceUpdatetdDate { get; set; }
    }

}
