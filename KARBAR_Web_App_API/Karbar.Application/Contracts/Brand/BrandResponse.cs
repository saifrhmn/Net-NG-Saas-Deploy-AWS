using Karbar.Domain.Enums;
using System;

namespace Karbar.Application.Contracts.Brand
{
    public class BrandResponse
    {
        public int Id { get; set; }
        public string BrandId { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
        public string TenantName { get; set; }
        public StatusEnum Status { get; set; }

        public string StatusDescription
        {
            get
            {
                var res = "";
                switch (Status)
                {
                    case StatusEnum.Inactive:
                        res = "Inactive";
                        break;
                    case StatusEnum.Active:
                        res = "Active";
                        break;
                    case StatusEnum.Pending:
                        res = "Pending";
                        break;
                    case StatusEnum.Deleted:
                        res = "Deleted";
                        break;
                    default:
                        break;
                }
                return res;
            }
        }

        // list metadata
        public int TotalCount { get; set; }

        // audit fields from BaseEntity
        public DateTime? CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }
    }
}