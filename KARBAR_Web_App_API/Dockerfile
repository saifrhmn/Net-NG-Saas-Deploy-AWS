# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore first (cached unless a .csproj changes)
COPY Karbar.sln ./
COPY Karbar.Api/Karbar.Api.csproj                       Karbar.Api/
COPY Karbar.Application/Karbar.Application.csproj       Karbar.Application/
COPY Karbar.Common/Karbar.Common.csproj                 Karbar.Common/
COPY Karbar.Domain/Karbar.Domain.csproj                 Karbar.Domain/
COPY Karbar.Infrastructure/Karbar.Infrastructure.csproj Karbar.Infrastructure/
RUN dotnet restore Karbar.Api/Karbar.Api.csproj

COPY . .
RUN dotnet publish Karbar.Api/Karbar.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Program.cs serves static files from ./Client (must exist) and images are written to wwwroot/Images
RUN mkdir -p /app/Client /app/wwwroot/Images && chown -R app:app /app/Client /app/wwwroot

COPY --from=build --chown=app:app /app/publish .

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    # Trust X-Forwarded-Proto/For from the AWS ALB so image URLs and redirects use https
    ASPNETCORE_FORWARDEDHEADERS_ENABLED=true

# Uploaded images: mount EFS/volume here or they are lost when the container is replaced
VOLUME ["/app/wwwroot/Images"]

EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "Karbar.Api.dll"]
