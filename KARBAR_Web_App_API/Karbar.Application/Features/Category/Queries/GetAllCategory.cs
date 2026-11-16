using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Application.Contracts.Category;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Categories.Queries
{
    public class GetAllCategory
    {
        public sealed class Query : IRequest<List<CategoryResponse>>
        {
            public string SearchText { get; set; }
            public int? TenantId { get; set; }
            public string? CategoryId { get; set; } 
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<CategoryResponse>>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Category> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Category> repository)
            {
                _repository = repository;
            }

            public async Task<List<CategoryResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                           .Query()
                           .Where(x => x.Status != StatusEnum.Deleted);

                if (request.TenantId.HasValue && request.TenantId > 1)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }
                //if (request.CategoryId == null)
                //{
                //    query = query.Where(p => p.ParentCategoryId == string.Empty);
                //}
                if (request.CategoryId != null)
                {
                    query = query.Where(p => p.ParentCategoryId == request.CategoryId);
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
                var response = result.Adapt<List<CategoryResponse>>() ?? new List<CategoryResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}