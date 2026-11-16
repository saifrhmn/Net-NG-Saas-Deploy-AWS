using Karbar.Api.Middlewares;

namespace Karbar.Api.Extensions
{
    public static class LoggingMiddlewareExtension
    {
        public static IApplicationBuilder UseRequestResponseLogging(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RequestResponseLoggingMiddleware>();
        }
    }
}
