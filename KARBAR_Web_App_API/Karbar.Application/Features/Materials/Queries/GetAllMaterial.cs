using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Material;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Materials.Queries
{
    public class GetAllMaterial
    {
        public sealed class Query : IRequest<List<MaterialResponse>>
        {
            public string? SearchText { get; set; }
            public string? MaterialGroup { get; set; }
            // 1 = Active, 0 = Inactive, null = all
            public int? Status { get; set; }
            // 1 = common item, 0 = not common, null = all
            public int? IsCommonItem { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<MaterialResponse>>
        {
            private readonly IGenericRepository<Material> _repository;
            public QueryHandler(IGenericRepository<Material> repository)
            {
                _repository = repository;
            }

            public async Task<List<MaterialResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository.Query().AsNoTracking();

                if (request.Status.HasValue)
                {
                    query = query.Where(p => p.Status == request.Status);
                }
                if (request.IsCommonItem.HasValue)
                {
                    query = query.Where(p => p.IsCommonItem == request.IsCommonItem);
                }
                if (!string.IsNullOrWhiteSpace(request.MaterialGroup))
                {
                    query = query.Where(p => p.MaterialGroup == request.MaterialGroup);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim();
                    query = query.Where(p =>
                        p.MaterialNumber.Contains(search) ||
                        p.MaterialDescription.Contains(search) ||
                        p.MaterialGroupDescription.Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);
                query = query.OrderBy(x => x.MaterialNumber);
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.ToListAsync(cancellationToken);
                var response = result.Adapt<List<MaterialResponse>>() ?? new List<MaterialResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}
