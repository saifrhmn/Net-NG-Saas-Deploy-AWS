using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.User;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Karbar.Application.Features.Users.Queries
{
    public class LogIn
    {
        public sealed class Query : IRequest<LoginResponse>
        {
            public string PhoneNoOrEmail { get; set; }
            public string Password { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, LoginResponse>
        {
            private readonly IGenericRepository<User> _userRepository;
            private readonly IGenericRepository<Role> _roleRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Tenant> _tenantRepository;
            private readonly IGenericRepository<RefreshToken> _refreshRepository;
            private readonly IConfiguration _configuration;

            public QueryHandler(
                IGenericRepository<User> userRepository,
                IGenericRepository<Role> roleRepository,
                IGenericRepository<Karbar.Domain.Entities.Tenant> tenantRepository,
                IGenericRepository<RefreshToken> refreshRepository,
                IConfiguration configuration)
            {
                _userRepository = userRepository;
                _roleRepository = roleRepository;
                _tenantRepository = tenantRepository;
                _refreshRepository = refreshRepository;
                _configuration = configuration;
            }

            public async Task<LoginResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                // Same phone/email can exist on more than one user, so pick the one whose password matches
                var candidates = await _userRepository
                    .Query()
                    .Where(u => (u.PhoneNumber == request.PhoneNoOrEmail || u.Email == request.PhoneNoOrEmail)
                                && u.Status != StatusEnum.Deleted)
                    .OrderByDescending(u => u.Id)
                    .ToListAsync(cancellationToken);

                var user = candidates.FirstOrDefault(u =>
                    !string.IsNullOrWhiteSpace(u.PasswordHash) && CryptoHasher.ValidateHash(request.Password, u.PasswordHash));

                if (user == null) return null;
                var tenantinfo = await _tenantRepository
                    .Query()
                    .Where(u => (u.Id == user.TenantId))
                    .FirstOrDefaultAsync(cancellationToken);

                var isAdmin = false;
                if (user != null && user.RoleId > 0)
                {
                    isAdmin = await _roleRepository.Query().Where(x => x.Id == user.RoleId).Select(x => x.IsAdmin).FirstOrDefaultAsync(cancellationToken);
                }

                // Build claims
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId ?? string.Empty),
                    new Claim(ClaimTypes.Name, user.Name ?? string.Empty),
                    new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                    new Claim("tenantId", user.TenantId.ToString()),
                    new Claim("roleId", user.RoleId.ToString()),
                    new Claim("address", tenantinfo?.AddressLine1 ?? "" + " " + tenantinfo?.AddressLine2?? ""),
                    new Claim("phone", tenantinfo?.Phone?? ""),
                    new Claim("phoneNumber", user?.PhoneNumber?? ""),
                    new Claim("isAdmin", isAdmin ? "true" : "false"),
                };

                // Read JWT settings (fallbacks supported)
                var jwtKey = _configuration["JwtSettings:Key"] ?? _configuration["AppSettings:JwtSettings:Key"];
                if (string.IsNullOrWhiteSpace(jwtKey))
                    throw new InvalidOperationException("JWT signing key is not configured. Set JwtSettings:Key in configuration.");

                var jwtIssuer = _configuration["JwtSettings:Issuer"] ?? _configuration["AppSettings:JwtSettings:Issuer"];
                var jwtAudience = _configuration["JwtSettings:Audience"] ?? _configuration["AppSettings:JwtSettings:Audience"];

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var tokenHandler = new JwtSecurityTokenHandler();
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.UtcNow.AddDays(1), // Access token expires in 1 day
                    SigningCredentials = creds,
                    Issuer = jwtIssuer,
                    Audience = jwtAudience
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);
                var accessToken = tokenHandler.WriteToken(token);

                // Create and persist refresh token
                var refreshDaysSetting = _configuration["JwtSettings:RefreshTokenValidForInDays"]
                                         ?? _configuration["AppSettings:JwtSettings:RefreshTokenValidForInDays"];
                int refreshDays = 30;
                if (!string.IsNullOrWhiteSpace(refreshDaysSetting) && int.TryParse(refreshDaysSetting, out var parsedDays))
                {
                    refreshDays = parsedDays;
                }

                var refreshToken = new RefreshToken
                {
                    RefreshTokenId = GenerateId.MakeId(),
                    AccessToken = accessToken,
                    IssuedAt = DateTime.UtcNow,
                    ExpiredAt = DateTime.UtcNow.AddDays(refreshDays),
                    UserGeneratedId = user.UserId,
                    UserId = user.Id,
                };

                await _refreshRepository.AddAsync(refreshToken, cancellationToken);
                await _refreshRepository.SaveChangesAsync(cancellationToken);

                return new LoginResponse
                {
                    AccessToken = accessToken
                };
            }
        }
    }
}