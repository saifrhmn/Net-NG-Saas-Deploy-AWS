using System.Net;
using System.Collections.Generic;

namespace Karbar.Common.Shared
{
    public class ApiResponse
    {
        public ApiResponse()
        {
            ErrorMessage = new List<string>();
            Result = null;
        }
        public HttpStatusCode StatusCode { get; set; }
        public bool IsSuccess { get; set; } = true;
        public List<string> ErrorMessage { get; set; }
        public object Result { get; set; }
        public int? PageIndex { get; set; }
        public int? PageSize { get; set; }
        public int? Count { get; set; }
    }
}
