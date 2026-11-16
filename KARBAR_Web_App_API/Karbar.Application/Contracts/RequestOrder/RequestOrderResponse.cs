using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.RequestOrder
{

    public class RequestOrderResponse
    {
        public int Id { get; set; }
        public string PurchaseInvoiceNo { get; set; }
        public string PurchaseOrderId { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime? RecievedDate { get; set; }

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
        public string TenantName { get; set; } = "";
        public string TenantCode { get; set; } = "";
        public bool? IsBerger { get; set; }
        public string? OrderStatus { get; set; }
        public DateTime? ReceivedDate { get; set; }

        public List<RequestOrderDetailResponse> RequestOrderDetails { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal DueAmount { get; set; }
    }

    public class RequestOrderDetailResponse
    {
        public int Id { get; set; }
        public string PurchaseOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public string? MaterialNumber { get; set; }
        public int UomId { get; set; }
        public string UomName { get; set; } 

        public int WarehouseId { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } 

        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }

        public decimal Tax { get; set; }
        public decimal Vat { get; set; }

        public DateTime PurchaseDate { get; set; }
        public DateTime RecievedDate { get; set; }
    }
}
