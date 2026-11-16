using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Application.Contracts.Uom;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Brands.Queries
{
    public class GetAllBrand
    {
        public sealed class Query : IRequest<List<BrandResponse>>
        {
            public string SearchText { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public int? TenantId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<BrandResponse>>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Brand> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Brand> repository)
            {
                _repository = repository;
            }

            public async Task<List<BrandResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                                 .Query()
                                 .Where(x => x.Status != StatusEnum.Deleted);

                if (request.TenantId.HasValue && request.TenantId > 1)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);
                query = query.OrderByDescending(x => x.Id);
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.ToListAsync(cancellationToken);
                var response = result.Adapt<List<BrandResponse>>() ?? new List<BrandResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}