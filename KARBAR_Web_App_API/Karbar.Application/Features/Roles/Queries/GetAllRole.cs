using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Roles;
using Karbar.Application.Contracts.User;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Roles.Queries
{
    public class GetAllRole
    {
        public sealed class Query : IRequest<List<RoleResponse>>
        {
            public string SearchText { get; set; }
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<RoleResponse>>
        {
            private readonly IGenericRepository<Role> _repository;
            public QueryHandler(IGenericRepository<Role> repository)
            {
                _repository = repository;
            }

            public async Task<List<RoleResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                     .Query()
                     .Where(x => x.Status != StatusEnum.Deleted);

               
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.ToListAsync(cancellationToken);
                var response = result.Adapt<List<RoleResponse>>() ?? new List<RoleResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}