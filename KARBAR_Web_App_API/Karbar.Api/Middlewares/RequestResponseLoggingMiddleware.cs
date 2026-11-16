using Serilog;
using System.Text;

namespace Karbar.Api.Middlewares
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public RequestResponseLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            // Only log API requests
            if (!context.Request.Path.StartsWithSegments("/api"))
            {
                await _next(context);
                return;
            }

            context.Request.EnableBuffering();

            var requestBody = await ReadRequestBody(context.Request);

            var originalBodyStream = context.Response.Body;
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            var startTime = DateTime.UtcNow;

            try
            {
                await _next(context);

                //var duration = DateTime.UtcNow - startTime;
                var durationMs = (DateTime.UtcNow - startTime).TotalMilliseconds;
                var responseBodyText = await ReadResponseBody(context.Response);

                Log.ForContext("RequestPath", context.Request.Path)
                   .ForContext("RequestMethod", context.Request.Method)
                   .ForContext("RequestBody", requestBody)
                   .ForContext("ResponseBody", responseBodyText)
                   .ForContext("StatusCode", context.Response.StatusCode)
                   .ForContext("Duration", durationMs)
                   .ForContext("UserName", context.User.Identity?.Name ?? "Anonymous")
                   .ForContext("MachineName", Environment.MachineName)
                   .ForContext("EnvironmentName", context.RequestServices.GetService<IWebHostEnvironment>()?.EnvironmentName ?? "Unknown")
                   .Information("API call Success");

                
            }
            catch (Exception ex)
            {
                //var duration = DateTime.UtcNow - startTime;
                var durationMs = (DateTime.UtcNow - startTime).TotalMilliseconds;
                var responseBodyText = await ReadResponseBody(context.Response);

                Log.ForContext("RequestPath", context.Request.Path)
                   .ForContext("RequestMethod", context.Request.Method)
                   .ForContext("RequestBody", requestBody)
                   .ForContext("ResponseBody", responseBodyText)
                   .ForContext("StatusCode", context.Response.StatusCode)
                   .ForContext("Duration", durationMs)
                   .ForContext("UserName", context.User.Identity?.Name ?? "Anonymous")
                   .ForContext("MachineName", Environment.MachineName)
                   .ForContext("EnvironmentName", context.RequestServices.GetService<IWebHostEnvironment>()?.EnvironmentName ?? "Unknown")
                   .Error(ex, "API call Failed");

                throw;
            }

            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }

        private async Task<string> ReadRequestBody(HttpRequest request)
        {
            request.Body.Seek(0, SeekOrigin.Begin);
            string bodyText = await new StreamReader(request.Body, Encoding.UTF8).ReadToEndAsync();
            request.Body.Seek(0, SeekOrigin.Begin);

            return Truncate(bodyText, 3000);
        }

        private async Task<string> ReadResponseBody(HttpResponse response)
        {
            response.Body.Seek(0, SeekOrigin.Begin);
            string text = await new StreamReader(response.Body, Encoding.UTF8).ReadToEndAsync();
            response.Body.Seek(0, SeekOrigin.Begin);

            return Truncate(text, 3000);
        }

        private string Truncate(string text, int maxLength)
        {
            if (string.IsNullOrEmpty(text)) return null;
            return text.Length <= maxLength ? text : text.Substring(0, maxLength) + "...";
        }
    }
}
