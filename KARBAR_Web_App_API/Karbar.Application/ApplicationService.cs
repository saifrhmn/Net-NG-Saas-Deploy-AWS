using FluentValidation;
using Karbar.Application.Common.Mappings;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;


namespace Karbar.Application
{
    public static class ApplicationService
    {
        public static IServiceCollection AddApplicationService(this IServiceCollection services)
        {
            // Mapster configuration
            MapsterConfiguration.Configure();

            // MediatR registration
            services.AddMediatR(cfg =>
            {
                cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            });

            // FluentValidation registration
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());


            return services;
        }
    }
}
