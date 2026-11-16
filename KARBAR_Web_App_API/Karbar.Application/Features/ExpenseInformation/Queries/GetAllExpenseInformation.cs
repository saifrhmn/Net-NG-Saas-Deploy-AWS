using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.ExpenseInformation;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.ExpenseInformations.Queries
{
    public class GetAllExpenseInformation
    {
        public sealed class Query : IRequest<List<ExpenseInformationResponse>>
        {
            public string? SearchText { get; set; }
            public int TenantId { get; set; }
            public string FromDate { get; set; }
            public string ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<ExpenseInformationResponse>>
        {
            private readonly IGenericRepository<ExpenseInformation> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> _cat_repository;

            public QueryHandler(IGenericRepository<ExpenseInformation> repository, IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> cat_repository)
            {
                _repository = repository;
                _cat_repository = cat_repository;
            }

            public async Task<List<ExpenseInformationResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                DateTime? fromDate = string.IsNullOrWhiteSpace(request.FromDate)
                           ? null
                           : DateTime.Parse(request.FromDate);
                DateTime? toDate = string.IsNullOrWhiteSpace(request.ToDate)
                        ? null
                        : DateTime.Parse(request.ToDate);

                var query = _repository.Query()
                    .Where(x => x.Status != StatusEnum.Deleted);
                if (request.TenantId > 0)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p =>
                        p.ExpensePurpose.ToLower().Contains(search) ||
                        p.Remarks.ToLower().Contains(search));
                }
                if (fromDate != null)
                {
                    query = query.Where(p => p.ExpenseDate >= fromDate);
                }
                if (toDate != null)
                {
                    query = query.Where(p => p.ExpenseDate <= toDate);
                }

                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.OrderByDescending(x => x.CreatedDate).ToListAsync(cancellationToken);
                var response = new List<ExpenseInformationResponse>(); // result.Adapt<List<ExpenseInformationResponse>>() ?? new List<ExpenseInformationResponse>();

                if (result.Count > 0)
                {
                    foreach (var item in result)
                    {
                        var respItem = item.Adapt<ExpenseInformationResponse>();
                        respItem.TotalCount = totalCount;

                        if (item.ForWhom.HasValue && item.ForWhom.Value > 0)
                        {
                            var category = _cat_repository.GetByIdAsync(x => x.Id == item.ForWhom).Result;
                            if (category != null)
                            {
                                if (!string.IsNullOrWhiteSpace(category.ParentId))
                                {
                                    respItem.SubCategoryName = category.Name;
                                    var parentCategory = _cat_repository.GetByIdAsync(x => x.ExpenseCategoryId == category.ParentId).Result;
                                    respItem.CategoryName = parentCategory != null ? parentCategory.Name : string.Empty;
                                }
                                else
                                {
                                    respItem.CategoryName = category.Name;
                                }
                            }
                        }

                        response.Add(respItem);
                    }
                }

                return response;
            }
        }
    }
}
