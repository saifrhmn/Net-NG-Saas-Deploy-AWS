using Karbar.Api.Common;
using Karbar.Api.Common.Images;
using Karbar.Api.Extensions;
using Karbar.Application;
using Karbar.Infrastructure;
using Karbar.Infrastructure.CentralCacheService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Debugging;
using Serilog.Events;
using Serilog.Filters;
using Serilog.Sinks.MSSqlServer;
using System.Collections.ObjectModel;
using System.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = builder.Configuration.GetSection("JwtSettings");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Key"]))
    };

    // ✅ Add events to handle expired token
    options.Events = new JwtBearerEvents
    {
        // Don't write the response here: this runs for every request carrying a token,
        // including [AllowAnonymous] endpoints like login. OnChallenge only runs where auth is required.

        OnChallenge = context =>
        {
            context.HandleResponse(); // skip default 401
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            var message = context.AuthenticateFailure switch
            {
                SecurityTokenExpiredException => "Token has expired. Please log in again.",
                not null => "Invalid token.",
                null => "Token is unauthorized."
            };

            var result = System.Text.Json.JsonSerializer.Serialize(new { message });
            return context.Response.WriteAsync(result);
        }
    };
});

// Configure Serilog before building app
var logConnectionString = builder.Configuration.GetConnectionString("LogConnection")
                          ?? builder.Configuration.GetConnectionString("DefaultConnection");

SelfLog.Enable(msg => Console.WriteLine(msg));

var columnOptions = new ColumnOptions();

// default column clear
columnOptions.Store.Clear();

columnOptions.Store.Add(StandardColumn.Id);
columnOptions.Store.Add(StandardColumn.Message);
columnOptions.Store.Add(StandardColumn.MessageTemplate);
columnOptions.Store.Add(StandardColumn.Level);
columnOptions.Store.Add(StandardColumn.TimeStamp);
columnOptions.Store.Add(StandardColumn.Exception);
columnOptions.Store.Add(StandardColumn.Properties);

// custom columns
columnOptions.AdditionalColumns = new Collection<SqlColumn>
{
    new SqlColumn { ColumnName = "RequestPath", DataType = SqlDbType.NVarChar, DataLength = 200 },
    new SqlColumn { ColumnName = "RequestMethod", DataType = SqlDbType.NVarChar, DataLength = 50 },
    new SqlColumn { ColumnName = "RequestBody", DataType = SqlDbType.NVarChar, DataLength = -1 },
    new SqlColumn { ColumnName = "ResponseBody", DataType = SqlDbType.NVarChar, DataLength = -1 },
    new SqlColumn { ColumnName = "StatusCode", DataType = SqlDbType.Int },
    new SqlColumn { ColumnName = "Duration", DataType = SqlDbType.Float },
    new SqlColumn { ColumnName = "UserName", DataType = SqlDbType.NVarChar, DataLength = 100 },
    new SqlColumn { ColumnName = "MachineName", DataType = SqlDbType.NVarChar, DataLength = 200 },
    new SqlColumn { ColumnName = "EnvironmentName", DataType = SqlDbType.NVarChar, DataLength = 100 }
};

#pragma warning disable CS0618
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .WriteTo.Logger(lc => lc
    .Filter.ByIncludingOnly(Matching.WithProperty<string>("RequestPath", p => p.StartsWith("/api")))
    .WriteTo.MSSqlServer(
            connectionString: logConnectionString,
            sinkOptions: new MSSqlServerSinkOptions
            {
                TableName = "ApiLogs",
                AutoCreateSqlTable = true
            },
            restrictedToMinimumLevel: LogEventLevel.Information,
            columnOptions: columnOptions
        )
    )
    .CreateLogger();

#pragma warning restore CS0618

builder.Host.UseSerilog();
builder.Services.AddSingleton<WebRootUtility>();
builder.Services.AddScoped<IImagePathHelper, ImagePathHelper>();
builder.Services.AddScoped<IMaterialCacheService, MaterialCacheService>();
builder.Services.AddMemoryCache();
#region layered architecture service registration

builder.Services.AddInfrastructureService(builder.Configuration);
builder.Services.AddApplicationService();

#endregion

// Register IHttpContextAccessor
builder.Services.AddHttpContextAccessor();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});
builder.Services.AddControllers()
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Karbar V1");
    });
}
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Karbar V1");
});

app.UseHttpsRedirection();
app.UseRouting();   // 1. UseRouting FIRST
app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Client")),
    RequestPath = ""
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Client")),
    RequestPath = ""
});
app.UseStaticFiles();

app.UseCors("AllowAll");
app.UseAuthentication();    // 2. Authentication AFTER routing
app.UseAuthorization();     // 3. Authorization AFTER authentication

// Add custom logging middleware
app.UseRequestResponseLogging();

app.MapControllers();
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();

    endpoints.MapFallbackToFile("index.html", new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Client"))
    });
});

app.Run();
