using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Customer;
using Karbar.Application.Contracts.Uom;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Uoms.Queries
{
    public class GetAllUom
    {
        public sealed class Query : IRequest<List<UomResponse>>
        {
            public string SearchText { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public int? TenantId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<UomResponse>>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Uom> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Uom> repository)
            {
                _repository = repository;
            }

            public async Task<List<UomResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                 .Query()
                 .Where(x => x.Status != StatusEnum.Deleted)
                 .Where(x => x.TenantId == request.TenantId || x.TenantId == null);

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
                var response = result.Adapt<List<UomResponse>>() ?? new List<UomResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}