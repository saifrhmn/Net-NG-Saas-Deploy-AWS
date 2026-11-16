using Karbar.Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Drawing;
namespace Karbar.Api.Common.Images
{
    public interface IImagePathHelper
    {
        string GetBaseUrl();
        string GetRootPath();
        string ToImageUrl(string storedPath);
    }

    public class ImagePathHelper : IImagePathHelper
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IWebHostEnvironment _env;

        public ImagePathHelper(IHttpContextAccessor httpContextAccessor, IWebHostEnvironment env)
        {
            _httpContextAccessor = httpContextAccessor;
            _env = env;
        }

        public string GetBaseUrl()
        {
            var request = _httpContextAccessor.HttpContext?.Request;
            if (request == null)
                return string.Empty;

            return $"{request.Scheme}://{request.Host}/Images/";
        }

        public string GetRootPath()
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            return Path.Combine(webRoot, "Images") + Path.DirectorySeparatorChar;
        }

        // Stored paths are absolute disk paths that may come from another deployment folder
        // (Karbar / KarbarDev) or differ in casing, so take everything after the "Images" folder.
        public string ToImageUrl(string storedPath)
        {
            if (string.IsNullOrWhiteSpace(storedPath))
                return null;

            if (storedPath.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                return storedPath;

            const string marker = "/wwwroot/Images/";
            var normalized = storedPath.Replace("\\", "/");
            var index = normalized.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
            var relative = index >= 0 ? normalized.Substring(index + marker.Length) : normalized.TrimStart('/');

            return $"{GetBaseUrl()}{relative}";
        }
    }
}
