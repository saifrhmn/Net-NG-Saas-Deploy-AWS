using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.PurchaseOrderRecieved
{
    public class PurchaseOrderRecievedRequest
    {
        public int Id { get; set; }
        public string? RecievedOrderId { get; set; }
        public string? RecievedNo { get; set; }
        public DateTime? RecievedDate { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal? BergerTotalPurchaseAmount { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? Tax { get; set; }
        public decimal? Vat { get; set; }
        public string? RequestOrderNo { get; set; }
        public int? TenantId { get; set; }

        public List<PurchaseOrderRecievedDetailRequest>? PurchaseDetails { get; set; }
    }

    public class PurchaseOrderRecievedDetailRequest
    {
        public int Id { get; set; }
        public int PurchaseOrderMasterId { get; set; }
        public string PurchaseOrderDetailId { get; set; }
        public int ItemId { get; set; }
        public int UomId { get; set; }
        public int WarehouseId { get; set; }
        public int SupplierId { get; set; }
        public decimal InvoiceQty { get; set; }
        public decimal RemainingQty { get; set; }
        public decimal UnitPrice { get; set; }
        public string? OrderStatus { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? BergerPurchaseAmount { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime RecievedDate { get; set; }
    }

    public class ReceiveRemainingRequest
    {
        public string RecievedOrderId { get; set; }
        public int Quantity { get; set; }
    }
}
