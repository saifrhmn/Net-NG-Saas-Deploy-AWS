using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.User;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Users.Queries
{
    public class GetUserDetails
    {
        public sealed class Query : IRequest<UserResponse>
        {
            public int UserId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, UserResponse>
        {
            private readonly IGenericRepository<User> _repository;
            public QueryHandler(IGenericRepository<User> repository)
            {
                _repository = repository;
            }

            public async Task<UserResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try 
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.UserId, cancellationToken);
                    var result = entity?.Adapt<UserResponse>() ?? null;
                    return result;
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }
    }
}