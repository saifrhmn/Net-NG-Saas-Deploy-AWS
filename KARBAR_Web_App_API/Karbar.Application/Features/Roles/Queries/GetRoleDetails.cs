using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Roles;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Roles.Queries
{
    public class GetRoleDetails
    {
        public sealed class Query : IRequest<RoleResponse>
        {
            public int RoleId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, RoleResponse>
        {
            private readonly IGenericRepository<Role> _repository;
            public QueryHandler(IGenericRepository<Role> repository)
            {
                _repository = repository;
            }

            public async Task<RoleResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.RoleId, cancellationToken);
                    var result = entity?.Adapt<RoleResponse>() ?? null;
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