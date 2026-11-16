using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.User;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Configuration;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Users.Queries
{
    public class Logout
    {

        // ✅ Query Model
        public sealed class Query : IRequest<LogoutResponse>
        {
            public string Token { get; set; }
            public DateTime ExpiredAt { get; set; }
        }

        // ✅ Query Handler
        public sealed class QueryHandler : IRequestHandler<Query, LogoutResponse>
        {
            private readonly IGenericRepository<RefreshToken> _refreshRepository;

            public QueryHandler(IGenericRepository<RefreshToken> refreshRepository)
            {
                _refreshRepository = refreshRepository;
            }

            public async Task<LogoutResponse> Handle(Query request, CancellationToken cancellationToken)
            {

                var existing = await _refreshRepository
                    .GetByIdAsync(x => x.AccessToken == request.Token, cancellationToken);

                if (existing == null)
                {
                    return new LogoutResponse
                    {
                        IsSuccess = false,
                        Message = "Token not found."
                    };
                }


                existing.ExpiredAt = DateTime.UtcNow;
                await _refreshRepository.UpdateAsync(existing, cancellationToken);
                await _refreshRepository.SaveChangesAsync(cancellationToken);
                return new LogoutResponse
                {
                    IsSuccess = true,
                    Message = "Token successfully invalidated."
                };
            }
        }
    }
}
