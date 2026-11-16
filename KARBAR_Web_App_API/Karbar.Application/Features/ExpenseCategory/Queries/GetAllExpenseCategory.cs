using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Application.Contracts.Category;
using Karbar.Application.Contracts.ExpenseCategory;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.ExpenseCategory.Queries
{
    public class GetAllExpenseCategory
    {
        public sealed class Query : IRequest<List<ExpenseCategoryResponse>>
        {
            public string SearchText { get; set; }
            public int? TenantId { get; set; }
            public string? ExpenseCategoryId { get; set; } 
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<ExpenseCategoryResponse>>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> repository)
            {
                _repository = repository;
            }

            public async Task<List<ExpenseCategoryResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                           .Query()
                           .Where(x => x.Status != StatusEnum.Deleted);

                if (request.TenantId != null && request.TenantId > 0)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }
                if (!string.IsNullOrWhiteSpace(request.ExpenseCategoryId))
                {
                    query = query.Where(p => p.ParentId == request.ExpenseCategoryId);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p => p.Name.ToLower().Contains(search));
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
                var response = result.Adapt<List<ExpenseCategoryResponse>>() ?? new List<ExpenseCategoryResponse>();

                if (response.Count > 0)
                {
                    foreach (var res in response)
                    {
                        res.TotalCount = totalCount;
                        if (!string.IsNullOrWhiteSpace(res.ParentId))
                        {
                            res.ParentCategoryName = _repository.GetByIdAsync(x => x.ExpenseCategoryId == res.ParentId).Result.Name;
                        }
                    }
                }
                    

                return response;
            }
        }
    }
}