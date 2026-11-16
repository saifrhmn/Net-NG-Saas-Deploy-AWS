using Microsoft.AspNetCore.Hosting;

namespace Karbar.Api.Common.Images
{
    public class WebRootUtility
    {
        private readonly IWebHostEnvironment _webHostEnvironment;

        public WebRootUtility(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        public string GetWwwRootPath()
        {
            return _webHostEnvironment.WebRootPath ?? _webHostEnvironment.ContentRootPath;
        }
    }
}
