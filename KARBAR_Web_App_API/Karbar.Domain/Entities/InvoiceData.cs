using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class InvoiceData
    {
        public int Id { get; set; } 
        public string InvoiceNo { get; set; }
        public string MaterialCode { get; set; }
        public DateTime InvoiceDate { get; set; }
        public string DealerCode { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal NetPrice { get; set; }
        public decimal Quantity { get; set; }
        public bool? IsCustomerRecieved { get; set; }
    }
    public class InvoiceDataResponse
    {
        public int Id { get; set; }
        public int? ItemId { get; set; }
        public string? ItemName { get; set; }
        public string InvoiceNo { get; set; }
        public string MaterialCode { get; set; }
        public DateTime InvoiceDate { get; set; }
        public string DealerCode { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal NetPrice { get; set; }
        public decimal Quantity { get; set; }
        public int TotalCount { get; set; }
        public bool? IsCustomerRecieved { get; set; }
    }
}
