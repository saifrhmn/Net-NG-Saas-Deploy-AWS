using Karbar.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class StockTransfersHistory 
    {
        [Key]
        public int Id { get; set; } 
        public string? StockTransferId { get; set; }
        public string? TransferRefNo { get; set; }
        public DateTime TransferDate { get; set; }
        public int ItemId { get; set; }
        public int FromWarehouseId { get; set; }
        public int ToWarehouseId { get; set; }
        public decimal QtyTransferred { get; set; }
        public string? Remarks { get; set; }
        public int TenantId { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? CreatedDate { get; set; }
        public StatusEnum? Status { get; set; }
    }
}
