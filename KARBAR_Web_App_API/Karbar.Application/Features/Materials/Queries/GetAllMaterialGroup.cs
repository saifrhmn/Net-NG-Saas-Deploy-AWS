using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Material;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Materials.Queries
{
    public class GetAllMaterialGroup
    {
        public sealed class Query : IRequest<List<MaterialGroupResponse>>
        {
            public string? SearchText { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<MaterialGroupResponse>>
        {
            private readonly IGenericRepository<Material> _repository;
            public QueryHandler(IGenericRepository<Material> repository)
            {
                _repository = repository;
            }

            public async Task<List<MaterialGroupResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                                 .Query()
                                 .AsNoTracking()
                                 .Where(x => x.MaterialGroup != null && x.MaterialGroup != "");

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim();
                    query = query.Where(p =>
                        p.MaterialGroup.Contains(search) ||
                        p.MaterialGroupDescription.Contains(search));
                }

                // One row per distinct MaterialGroup
                var groupQuery = query
                    .GroupBy(x => x.MaterialGroup)
                    .Select(g => new MaterialGroupResponse
                    {
                        MaterialGroup = g.Key,
                        MaterialGroupDescription = g.Max(x => x.MaterialGroupDescription)
                    });

                var totalCount = await groupQuery.CountAsync(cancellationToken);
                groupQuery = groupQuery.OrderBy(x => x.MaterialGroup);
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    groupQuery = groupQuery
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var response = await groupQuery.ToListAsync(cancellationToken);

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}
