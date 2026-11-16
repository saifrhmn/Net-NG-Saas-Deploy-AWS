using Karbar.Application.Common.Interface;
using Karbar.Infrastructure.Data;
using Karbar.Infrastructure.Respositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Karbar.Infrastructure
{
    public static class InfrastructureService
    {
        public static IServiceCollection AddInfrastructureService(this IServiceCollection services, IConfiguration configuration)
        {
            // DbContext registration 
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"),
                sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly("Karbar.Infrastructure");
                    sqlOptions.EnableRetryOnFailure();
                });
            });

            // Log Database Context
            services.AddDbContext<LogDbContext>(options =>
            {
                options.UseSqlServer(configuration.GetConnectionString("LogConnection"),
                sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly("Karbar.Infrastructure");
                    sqlOptions.EnableRetryOnFailure();
                });
            });

            // Controller and JSON configuration
            services.AddControllers().AddNewtonsoftJson(options =>
            {
                options.SerializerSettings.ReferenceLoopHandling = ReferenceLoopHandling.Ignore;
                options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            }).AddXmlDataContractSerializerFormatters();

            // Generic repository registration
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

            #region swagger configuration
            services.AddEndpointsApiExplorer();
            services.AddSwaggerGen(options =>
            {
                options.EnableAnnotations();
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = "Karbar API",
                    Description = "",
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme. \r\n\r\n Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: \"Bearer 12345abcdef\"",
                    Name = "Authorization",
                    // Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            },

                            Scheme = "oauth2",
                            Name = "Bearer",
                            In = ParameterLocation.Header,
                        },
                        new List<string>()
                    }
                });
                // "+" (nested types e.g. AssignMaterialToTenant+Command) breaks $ref resolution in Swagger UI
                options.CustomSchemaIds(type => type.FullName?.Replace("+", "."));
            });
            #endregion

            return services;
        }
    }
}
