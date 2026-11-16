using System.ComponentModel.DataAnnotations;

namespace Karbar.Api.RequestDTO
{
    public class BulkInsertItemRequest
    {
        [Required]
        public IFormFile File { get; set; }
    }

}
