using Karbar.Domain.Enums;

namespace Karbar.Domain.Entities
{
    public class BaseEntity: IHasStatus, IHasUpdatedDate
    {
        public int Id { get; set; }
        public DateTime? CreatedDate { get; set; }
        public string CreatedBy { get; set; }
        public DateTime? UpdatedDate { get; set; }
        public string UpdatedBy { get; set; }
        public StatusEnum Status { get; set; }
    }

    public interface IHasStatus
    {
        StatusEnum Status { get; set; }
    }
    public interface IHasUpdatedDate
    {
        DateTime? UpdatedDate { get; set; }
    }
}
