using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Domain.Entities
{
    public class ApiLog
    {
        public int Id { get; set; }
        public DateTime TimeStamp { get; set; }
        public string? RequestPath { get; set; }
        public string? RequestMethod { get; set; }
        public string? RequestBody { get; set; }
        public string? ResponseBody { get; set; }
        public int StatusCode { get; set; }
        public double? Duration { get; set; }
        public string? UserName { get; set; }
        public string? MachineName { get; set; }
        public string? EnvironmentName { get; set; }
    }
}
